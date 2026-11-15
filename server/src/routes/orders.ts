import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { authenticateJWT, verifyRestaurantOwner } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { getIO } from "../server";

const router = Router();

const orderItemInputSchema = z.object({
  dishId: z.string(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  specialInstructions: z.string().max(250).optional(),
});

const createOrderSchema = z.object({
  qrToken: z.string(),
  items: z.array(orderItemInputSchema).min(1, "At least one item is required to place an order"),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

const updateOrderStatusSchema = z
  .object({
    status: z.enum([
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "READY",
      "SERVED",
      "COMPLETED",
      "CANCELLED",
    ]),
    cancelReason: z.string().max(250).optional(),
  })
  .refine(
    (data) => {
      if (data.status === "CANCELLED" && (!data.cancelReason || data.cancelReason.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "Cancellation reason is required when voiding or cancelling an order",
      path: ["cancelReason"],
    }
  );

const toggleItemPreparedSchema = z.object({
  isPrepared: z.boolean(),
});

const orderFeedbackSchema = z.object({
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  feedbackComment: z.string().max(500, "Feedback comment cannot exceed 500 characters").optional(),
});

const settlePaymentSchema = z.object({
  paymentMethod: z.enum(["CASH", "CARD", "ONLINE"]),
  splitCount: z.number().int().min(1).max(20).optional().default(1),
});

// 1. PUBLIC: Customer places an order via QR token
// STRICT NON-NEGOTIABLE: SERVER-SIDE PRICE RECALCULATION
router.post("/", validateBody(createOrderSchema), async (req: Request, res: Response) => {
  const { qrToken, items, customerName, customerPhone, notes } = req.body;

  try {
    // 1. Resolve Table & Restaurant
    const table = await prisma.table.findUnique({
      where: { qrToken },
      include: { restaurant: true },
    });

    if (!table || !table.isActive || !table.restaurant.isActive) {
      return res.status(400).json({ error: "Invalid or inactive table/restaurant" });
    }

    const restaurantId = table.restaurantId;

    // 2. Fetch authoritative dish prices directly from Neon PostgreSQL
    const dishIds = items.map((i: { dishId: string }) => i.dishId);
    const dbDishes = await prisma.dish.findMany({
      where: {
        id: { in: dishIds },
        restaurantId, // Multi-tenant scope
      },
    });

    // Check that every requested dish exists and belongs to this restaurant
    const dishMap = new Map(dbDishes.map((d) => [d.id, d]));
    for (const item of items) {
      const dbDish = dishMap.get(item.dishId);
      if (!dbDish) {
        return res.status(400).json({
          error: `Dish with ID ${item.dishId} does not exist in this restaurant`,
        });
      }
      if (!dbDish.isAvailable) {
        return res.status(400).json({
          error: `"${dbDish.name}" is currently sold out and cannot be ordered`,
        });
      }
    }

    // 3. Compute Line Item Subtotals and Total Amount SERVER-SIDE
    let computedTotalAmount = 0;
    const orderItemsData = items.map((item: { dishId: string; quantity: number; specialInstructions?: string }) => {
      const dbDish = dishMap.get(item.dishId)!;
      const unitPriceNumber = Number(dbDish.price);
      const subtotalNumber = unitPriceNumber * item.quantity;
      computedTotalAmount += subtotalNumber;

      return {
        dishId: item.dishId,
        quantity: item.quantity,
        unitPrice: dbDish.price, // Authoritative price from DB
        subtotal: subtotalNumber.toFixed(2),
        specialInstructions: item.specialInstructions || null,
      };
    });

    // 4. Calculate dynamic estimated wait time based on dish prep times + active kitchen queue load
    const maxDishPrepTime = Math.max(
      ...dbDishes.map((d) => d.prepTimeMinutes || d.preparationTime || 10),
      10
    );
    const activeQueueCount = await prisma.order.count({
      where: {
        restaurantId,
        status: { in: ["PENDING", "PREPARING"] },
      },
    });
    const estimatedWaitMinutes = maxDishPrepTime + activeQueueCount * 3;

    // 5. Generate human-readable order number
    const todayOrdersCount = await prisma.order.count({
      where: { restaurantId },
    });
    const orderNumber = `#${String(todayOrdersCount + 101).padStart(4, "0")}`;

    // 6. Create Order & OrderItems inside a single transaction with Neon timeout accommodation
    const newOrder = await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.create({
          data: {
            restaurantId,
            tableId: table.id,
            orderNumber,
            status: "PENDING",
            totalAmount: computedTotalAmount.toFixed(2),
            customerName: customerName || null,
            customerPhone: customerPhone || null,
            notes: notes || null,
            paymentStatus: "UNPAID",
            estimatedWaitMinutes,
            items: {
              create: orderItemsData,
            },
          },
          include: {
            table: true,
            restaurant: {
              select: {
                id: true,
                name: true,
                currency: true,
                accentColor: true,
              },
            },
            items: {
              include: { dish: true },
            },
          },
        });

        return order;
      },
      { maxWait: 15000, timeout: 30000 }
    );

    // 6. Emit real-time Socket.io event to restaurant room (KDS)
    const io = getIO();
    if (io) {
      io.to(`restaurant_${restaurantId}`).emit("new_order", newOrder);
    }

    return res.status(201).json({
      order: newOrder,
      message: "Order placed successfully",
    });
  } catch (error) {
    console.error("Place order error:", error);
    return res.status(500).json({ error: "Failed to process order" });
  }
});

// 2. OWNER/KDS: List orders for restaurant (Protected by owner JWT)
router.get("/", authenticateJWT, verifyRestaurantOwner, async (req: Request, res: Response) => {
  const restaurantId = req.query.restaurantId as string;
  const status = req.query.status as string;

  try {
    const whereClause: any = { restaurantId };
    if (status) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        table: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            currency: true,
            accentColor: true,
          },
        },
        items: {
          include: {
            dish: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ orders });
  } catch (error) {
    console.error("List orders error:", error);
    return res.status(500).json({ error: "Failed to list orders" });
  }
});

// 3. PUBLIC: Customer tracks live order status by ID (supports /:id and /:id/track)
const handleGetSingleOrder = async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        table: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            accentColor: true,
            currency: true,
            logoUrl: true,
          },
        },
        items: {
          include: {
            dish: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json({ order });
  } catch (error) {
    console.error("Track order error:", error);
    return res.status(500).json({ error: "Failed to track order" });
  }
};

router.get("/:id", handleGetSingleOrder);
router.get("/:id/track", handleGetSingleOrder);

// 4. OWNER/KDS: Update order status (PENDING -> PREPARING -> READY -> SERVED / CANCELLED)
router.patch(
  "/:id/status",
  authenticateJWT,
  validateBody(updateOrderStatusSchema),
  async (req: Request, res: Response) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { restaurant: true },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Verify owner authorization
      if (order.restaurant.ownerId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden: Multi-tenant access denied" });
      }

      const updateData: any = { status: req.body.status };
      if (req.body.status === "CANCELLED" && req.body.cancelReason) {
        updateData.cancelReason = req.body.cancelReason.trim();
      }

      const updated = await prisma.order.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          table: true,
          restaurant: {
            select: {
              id: true,
              name: true,
              currency: true,
              accentColor: true,
            },
          },
          items: {
            include: { dish: true },
          },
        },
      });

      // Emit real-time updates to BOTH restaurant room and customer order room
      const io = getIO();
      if (io) {
        io.to(`restaurant_${order.restaurantId}`).emit("order_status_updated", updated);
        io.to(`order_${order.id}`).emit("order_status_updated", updated);
      }

      return res.json({ order: updated });
    } catch (error) {
      console.error("Update status error:", error);
      return res.status(500).json({ error: "Failed to update order status" });
    }
  }
);

// 5. OWNER/KDS: Item-Level Kitchen Prep Toggle
router.patch(
  "/:orderId/items/:itemId/prepared",
  authenticateJWT,
  validateBody(toggleItemPreparedSchema),
  async (req: Request, res: Response) => {
    try {
      const { orderId, itemId } = req.params;
      const { isPrepared } = req.body;

      // Find order to check tenant authorization
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { restaurant: true },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.restaurant.ownerId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden: Multi-tenant access denied" });
      }

      // Check item belongs to order
      const existingItem = await prisma.orderItem.findFirst({
        where: { id: itemId, orderId },
      });

      if (!existingItem) {
        return res.status(404).json({ error: "Order item not found on this order" });
      }

      const updatedItem = await prisma.orderItem.update({
        where: { id: itemId },
        data: { isPrepared },
        include: { dish: true },
      });

      // Emit real-time item update to both restaurant and order rooms
      const io = getIO();
      if (io) {
        const payload = {
          orderId,
          itemId,
          isPrepared,
          restaurantId: order.restaurantId,
        };
        io.to(`restaurant_${order.restaurantId}`).emit("order_item_updated", payload);
        io.to(`order_${order.id}`).emit("order_item_updated", payload);
      }

      return res.json({ item: updatedItem, message: "Item prep status updated successfully" });
    } catch (error) {
      console.error("Update item prep error:", error);
      return res.status(500).json({ error: "Failed to update item prep status" });
    }
  }
);

// 6. PUBLIC: Guest post-meal rating & feedback
router.post(
  "/:id/feedback",
  validateBody(orderFeedbackSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rating, feedbackComment } = req.body;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          table: true,
          restaurant: true,
        },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Allowed only when order is READY, SERVED, or COMPLETED
      if (!["READY", "SERVED", "COMPLETED"].includes(order.status)) {
        return res.status(400).json({
          error: "Feedback can only be submitted once your order is ready or served",
        });
      }

      // Allowed only once
      if (order.rating !== null) {
        return res.status(400).json({
          error: "Feedback has already been submitted for this order",
        });
      }

      const updated = await prisma.order.update({
        where: { id },
        data: {
          rating,
          feedbackComment: feedbackComment ? feedbackComment.trim() : null,
        },
        include: {
          table: true,
          restaurant: {
            select: {
              id: true,
              name: true,
              currency: true,
              accentColor: true,
            },
          },
          items: {
            include: { dish: true },
          },
        },
      });

      // Emit real-time feedback event to restaurant room (KDS) & order room
      const io = getIO();
      if (io) {
        io.to(`restaurant_${order.restaurantId}`).emit("order_feedback_received", {
          orderId: updated.id,
          rating: updated.rating,
          feedbackComment: updated.feedbackComment,
          orderNumber: updated.orderNumber,
          tableNumber: updated.table.tableNumber,
        });
        io.to(`restaurant_${order.restaurantId}`).emit("order_status_updated", updated);
        io.to(`order_${order.id}`).emit("order_status_updated", updated);
      }

      return res.json({
        order: updated,
        message: "Thank you! Your feedback has been received.",
      });
    } catch (error) {
      console.error("Submit feedback error:", error);
      return res.status(500).json({ error: "Failed to submit feedback" });
    }
  }
);

// 7. OWNER/KDS: Settle payment & mark order paid (with split count & payment method)
router.patch(
  "/:id/payment",
  authenticateJWT,
  validateBody(settlePaymentSchema),
  async (req: Request, res: Response) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { restaurant: true },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.restaurant.ownerId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden: Multi-tenant access denied" });
      }

      const nextStatus =
        order.status === "READY" || order.status === "SERVED"
          ? "COMPLETED"
          : order.status;

      const updated = await prisma.order.update({
        where: { id: req.params.id },
        data: {
          paymentStatus: "PAID",
          paymentMethod: req.body.paymentMethod,
          splitCount: req.body.splitCount || 1,
          status: nextStatus,
        },
        include: {
          table: true,
          restaurant: {
            select: {
              id: true,
              name: true,
              currency: true,
              accentColor: true,
            },
          },
          items: {
            include: { dish: true },
          },
        },
      });

      const io = getIO();
      if (io) {
        io.to(`restaurant_${order.restaurantId}`).emit("order_status_updated", updated);
        io.to(`order_${order.id}`).emit("order_status_updated", updated);
      }

      return res.json({
        order: updated,
        message: "Payment settled successfully",
      });
    } catch (error) {
      console.error("Payment settlement error:", error);
      return res.status(500).json({ error: "Failed to settle payment" });
    }
  }
);

export default router;

