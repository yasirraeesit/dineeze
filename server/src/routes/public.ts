import { Router, Request, Response, NextFunction } from "express";
import prisma from "../prisma";

const router = Router();

// Public Smart Cart Upsells: GET /api/menu/:qrToken/upsells?itemIds=...
router.get("/:qrToken/upsells", async (req: Request, res: Response) => {
  const { qrToken } = req.params;
  const rawItemIds = req.query.itemIds;

  try {
    const table = await prisma.table.findUnique({
      where: { qrToken },
      include: { restaurant: true },
    });

    if (!table || !table.isActive || !table.restaurant.isActive) {
      return res.status(404).json({ error: "Table or restaurant not active" });
    }

    const restaurantId = table.restaurantId;

    // Parse target itemIds from comma-separated string or array
    let targetItemIds: string[] = [];
    if (typeof rawItemIds === "string") {
      targetItemIds = rawItemIds.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (Array.isArray(rawItemIds)) {
      targetItemIds = (rawItemIds as string[]).map((s) => String(s).trim()).filter(Boolean);
    }

    const recommendedDishIds: string[] = [];

    // 1. Historical Co-occurrence Engine
    if (targetItemIds.length > 0) {
      const pastOrdersWithItems = await prisma.order.findMany({
        where: {
          restaurantId,
          items: {
            some: {
              dishId: { in: targetItemIds },
            },
          },
        },
        select: {
          items: {
            select: { dishId: true },
          },
        },
        take: 100,
        orderBy: { createdAt: "desc" },
      });

      const frequencyMap: Record<string, number> = {};
      for (const order of pastOrdersWithItems) {
        for (const item of order.items) {
          if (!targetItemIds.includes(item.dishId)) {
            frequencyMap[item.dishId] = (frequencyMap[item.dishId] || 0) + 1;
          }
        }
      }

      const sortedByFreq = Object.entries(frequencyMap)
        .sort((a, b) => b[1] - a[1])
        .map(([dishId]) => dishId);

      recommendedDishIds.push(...sortedByFreq);
    }

    // 2. Fallback Recommendations if < 3 suggestions found
    if (recommendedDishIds.length < 3) {
      const fallbackDishes = await prisma.dish.findMany({
        where: {
          restaurantId,
          isAvailable: true,
          id: {
            notIn: [...targetItemIds, ...recommendedDishIds],
          },
        },
        select: { id: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 3 - recommendedDishIds.length,
      });

      recommendedDishIds.push(...fallbackDishes.map((d) => d.id));
    }

    // 3. Fetch full dish objects for the top 3 IDs that are available
    const upsellDishes = await prisma.dish.findMany({
      where: {
        id: { in: recommendedDishIds.slice(0, 3) },
        restaurantId,
        isAvailable: true,
      },
      include: {
        category: {
          select: { name: true },
        },
      },
    });

    const orderedUpsells = recommendedDishIds
      .slice(0, 3)
      .map((id) => upsellDishes.find((d) => d.id === id))
      .filter(Boolean);

    return res.json({
      upsells: orderedUpsells,
    });
  } catch (error) {
    console.error("Upsells error:", error);
    return res.status(500).json({ error: "Failed to compute cart upsells" });
  }
});

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

