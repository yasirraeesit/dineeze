import { Router, Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import prisma from "../prisma";
import { authenticateJWT, verifyRestaurantOwner } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();
router.use(authenticateJWT);

const createTableSchema = z.object({
  restaurantId: z.string(),
  tableNumber: z.number().int().positive(),
  label: z.string().optional(),
  capacity: z.number().int().positive().default(4),
});

// List tables for restaurant
router.get("/", verifyRestaurantOwner, async (req: Request, res: Response) => {
  const restaurantId = req.query.restaurantId as string;
  try {
    const tables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: "asc" },
      include: {
        _count: {
          select: {
            orders: {
              where: {
                status: {
                  in: ["PENDING", "CONFIRMED", "PREPARING", "READY"],
                },
              },
            },
          },
        },
      },
    });

    return res.json({ tables });
  } catch (error) {
    console.error("List tables error:", error);
    return res.status(500).json({ error: "Failed to list tables" });
  }
});

// Live Floor Status for restaurant tables
router.get("/status", verifyRestaurantOwner, async (req: Request, res: Response) => {
  const restaurantId = req.query.restaurantId as string;
  try {
    const tables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: "asc" },
      include: {
        orders: {
          where: {
            OR: [
              { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] } },
              { status: "SERVED", paymentStatus: "UNPAID" },
            ],
          },
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: { dish: true },
            },
          },
        },
      },
    });

    const enrichedTables = tables.map((t) => {
      const activeOrders = t.orders;

      // Determine Floor Status:
      // AVAILABLE, WAITING_FOOD, READY_TO_SERVE, BILL_PENDING
      let floorStatus: "AVAILABLE" | "WAITING_FOOD" | "READY_TO_SERVE" | "BILL_PENDING" = "AVAILABLE";

      if (activeOrders.length === 0) {
        floorStatus = "AVAILABLE";
      } else if (activeOrders.some((o) => o.status === "READY")) {
        floorStatus = "READY_TO_SERVE";
      } else if (activeOrders.some((o) => o.status === "PENDING" || o.status === "PREPARING" || o.status === "CONFIRMED")) {
        floorStatus = "WAITING_FOOD";
      } else if (activeOrders.every((o) => o.status === "SERVED" && o.paymentStatus === "UNPAID")) {
        floorStatus = "BILL_PENDING";
      } else {
        floorStatus = "WAITING_FOOD";
      }

      const unpaidRunningTotal = activeOrders
        .filter((o) => o.paymentStatus === "UNPAID")
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);

      const earliestCreatedAt = activeOrders.length > 0
        ? Math.min(...activeOrders.map((o) => new Date(o.createdAt).getTime()))
        : null;

      const elapsedMinutes = earliestCreatedAt
        ? Math.max(0, Math.floor((Date.now() - earliestCreatedAt) / 60000))
        : 0;

      return {
        id: t.id,
        restaurantId: t.restaurantId,
        tableNumber: t.tableNumber,
        label: t.label,
        capacity: t.capacity,
        qrToken: t.qrToken,
        isActive: t.isActive,
        floorStatus,
        unpaidRunningTotal: Number(unpaidRunningTotal.toFixed(2)),
        elapsedMinutes,
        activeOrdersCount: activeOrders.length,
        activeOrders,
      };
    });

    return res.json({ tables: enrichedTables });
  } catch (error) {
    console.error("Floor status error:", error);
    return res.status(500).json({ error: "Failed to load floor status" });
  }
});

// Add new table
router.post("/", verifyRestaurantOwner, validateBody(createTableSchema), async (req: Request, res: Response) => {
  const { restaurantId, tableNumber, label, capacity } = req.body;

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const existing = await prisma.table.findUnique({
      where: {
        restaurantId_tableNumber: {
          restaurantId,
          tableNumber,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: `Table number ${tableNumber} already exists in this restaurant` });
    }

    const paddedNum = String(tableNumber).padStart(2, "0");
    const qrToken = `tbl_${restaurant.slug}_${paddedNum}_${crypto.randomUUID().slice(0, 8)}`;

    const table = await prisma.table.create({
      data: {
        restaurantId,
        tableNumber,
        label: label || `Table ${paddedNum}`,
        qrToken,
        capacity: capacity || 4,
        isActive: true,
      },
    });

    return res.status(201).json({ table });
  } catch (error) {
    console.error("Create table error:", error);
    return res.status(500).json({ error: "Failed to create table" });
  }
});

// Regenerate QR Token
router.patch("/:id/regenerate-token", async (req: Request, res: Response) => {
  try {
    const table = await prisma.table.findUnique({
      where: { id: req.params.id },
      include: { restaurant: true },
    });

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    if (table.restaurant.ownerId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden: Multi-tenant access denied" });
    }

    const paddedNum = String(table.tableNumber).padStart(2, "0");
    const newQrToken = `tbl_${table.restaurant.slug}_${paddedNum}_${crypto.randomUUID().slice(0, 8)}`;

    const updated = await prisma.table.update({
      where: { id: req.params.id },
      data: { qrToken: newQrToken },
    });

    return res.json({ table: updated });
  } catch (error) {
    console.error("Regenerate table token error:", error);
    return res.status(500).json({ error: "Failed to regenerate table QR token" });
  }
});

// Delete table
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const table = await prisma.table.findUnique({
      where: { id: req.params.id },
      include: { restaurant: true },
    });

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    if (table.restaurant.ownerId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden: Multi-tenant access denied" });
    }

    await prisma.table.delete({
      where: { id: req.params.id },
    });

    return res.json({ success: true, message: "Table deleted" });
  } catch (error) {
    console.error("Delete table error:", error);
    return res.status(500).json({ error: "Failed to delete table" });
  }
});

export default router;

