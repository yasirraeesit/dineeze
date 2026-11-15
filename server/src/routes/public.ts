import { Router, Request, Response, NextFunction } from "express";
import prisma from "../prisma";

const router = Router();

// Public customer menu endpoint: GET /api/menu/:qrToken
router.get("/:qrToken", async (req: Request, res: Response, next: NextFunction) => {
  const { qrToken } = req.params;

  // Pass through if the requested token is an internal management route (e.g. categories, items)
  if (qrToken === "categories" || qrToken === "items") {
    return next();
  }

  try {
    const table = await prisma.table.findUnique({
      where: { qrToken },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            accentColor: true,
            currency: true,
            logoUrl: true,
            bannerUrl: true,
            address: true,
            wifiPassword: true,
            isActive: true,
          },
        },
      },
    });

    if (!table) {
      return res.status(404).json({
        error: "Invalid QR code. Table not found or link has expired.",
        code: "TABLE_NOT_FOUND",
      });
    }

    if (!table.isActive) {
      return res.status(403).json({
        error: "This table is currently not in service. Please notify staff.",
        code: "TABLE_INACTIVE",
      });
    }

    if (!table.restaurant.isActive) {
      return res.status(403).json({
        error: "This restaurant is currently closed for orders.",
        code: "RESTAURANT_INACTIVE",
      });
    }

    // Fetch active categories and dishes
    const categories = await prisma.category.findMany({
      where: {
        restaurantId: table.restaurant.id,
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
      include: {
        dishes: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    // Smart Wait Time: Active PENDING/PREPARING orders in kitchen + baseline prep time
    const activeOrdersCount = await prisma.order.count({
      where: {
        restaurantId: table.restaurant.id,
        status: { in: ["PENDING", "PREPARING"] },
      },
    });
    // Baseline 12 mins + 3 mins per active queued order
    const estimatedWaitMinutes = 12 + activeOrdersCount * 3;

    return res.json({
      restaurant: table.restaurant,
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        label: table.label,
        qrToken: table.qrToken,
      },
      categories,
      estimatedWaitMinutes,
    });
  } catch (error) {
    console.error("Public menu error:", error);
    return res.status(500).json({ error: "Failed to load restaurant menu" });
  }
});

export default router;

