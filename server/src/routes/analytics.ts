import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authenticateJWT, verifyRestaurantOwner, requireRole } from "../middlewares/auth";

const router = Router();
router.use(authenticateJWT);
router.use(requireRole("MANAGER"));

// GET /api/analytics?restaurantId=...&range=7d|30d
router.get("/", verifyRestaurantOwner, async (req: Request, res: Response) => {
  const restaurantId = req.query.restaurantId as string;
  const rangeParam = (req.query.range as string) || "7d";
  const numDays = rangeParam === "30d" ? 30 : 7;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (numDays - 1));
    cutoffDate.setHours(0, 0, 0, 0);

    // 1. Fetch non-cancelled orders for restaurant in date window
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: cutoffDate },
        status: { not: "CANCELLED" },
      },
      include: {
        items: {
          include: { dish: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Compute Summary Metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const aov = totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

    const ratedOrders = orders.filter((o) => typeof o.rating === "number" && o.rating > 0);
    const averageRating = ratedOrders.length > 0
      ? Number((ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOrders.length).toFixed(1))
      : 5.0;

    const soldOutCount = await prisma.dish.count({
      where: {
        restaurantId,
        isAvailable: false,
      },
    });

    // 3. Daily Series (Fill all days from cutoffDate to today)
    const dailyMap = new Map<string, { date: string; label: string; revenue: number; orders: number }>();
    for (let i = 0; i < numDays; i++) {
      const d = new Date(cutoffDate);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().split("T")[0];
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
      const monthDay = d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
      dailyMap.set(dateKey, {
        date: dateKey,
        label: `${weekday} ${monthDay}`,
        revenue: 0,
        orders: 0,
      });
    }

    orders.forEach((o) => {
      const dateKey = new Date(o.createdAt).toISOString().split("T")[0];
      const entry = dailyMap.get(dateKey);
      if (entry) {
        entry.revenue = Number((entry.revenue + Number(o.totalAmount)).toFixed(2));
        entry.orders += 1;
      }
    });

    const dailySeries = Array.from(dailyMap.values());

    // 4. Peak Ordering Hours (0-23)
    const peakHours = Array.from({ length: 24 }, (_, h) => {
      const period = h >= 12 ? "PM" : "AM";
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      return {
        hour: h,
        label: `${displayHour} ${period}`,
        orders: 0,
        revenue: 0,
      };
    });

    orders.forEach((o) => {
      const hour = new Date(o.createdAt).getHours();
      peakHours[hour].orders += 1;
      peakHours[hour].revenue = Number((peakHours[hour].revenue + Number(o.totalAmount)).toFixed(2));
    });

    // 5. Top 5 Best-Selling Dishes
    const dishMap = new Map<string, { id: string; name: string; quantity: number; revenue: number; imageUrl?: string | null }>();
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const existing = dishMap.get(item.dishId) || {
          id: item.dishId,
          name: item.dish.name,
          quantity: 0,
          revenue: 0,
          imageUrl: item.dish.imageUrl,
        };
        existing.quantity += item.quantity;
        existing.revenue = Number((existing.revenue + Number(item.subtotal)).toFixed(2));
        dishMap.set(item.dishId, existing);
      });
    });

    const topDishes = Array.from(dishMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return res.json({
      range: rangeParam,
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        aov,
        averageRating,
        totalRatingsCount: ratedOrders.length,
        soldOutCount,
      },
      dailySeries,
      peakHours,
      topDishes,
    });
  } catch (error) {
    console.error("Analytics aggregation error:", error);
    return res.status(500).json({ error: "Failed to load restaurant analytics" });
  }
});

export default router;

