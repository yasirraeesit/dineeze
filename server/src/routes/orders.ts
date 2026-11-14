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

const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "SERVED",
    "COMPLETED",
    "CANCELLED",
  ]),
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

    // 4. Generate human-readable order number
    const todayOrdersCount = await prisma.order.count({
      where: { restaurantId },
    });
    const orderNumber = `#${String(todayOrdersCount + 101).padStart(4, "0")}`;

    // 5. Create Order & OrderItems inside a single transaction with Neon timeout accommodation
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

      const updated = await prisma.order.update({
        where: { id: req.params.id },
        data: { status: req.body.status },
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

export default router;

