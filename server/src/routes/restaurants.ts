import { Router, Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import prisma from "../prisma";
import { authenticateJWT, verifyRestaurantOwner } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

// Apply auth to all restaurant routes
router.use(authenticateJWT);

const createRestaurantSchema = z.object({
  name: z.string().min(2, "Restaurant name is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  currency: z.string().default("USD"),
  address: z.string().optional(),
  accentColor: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Valid hex color required").default("#10B981"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  wifiPassword: z.string().optional(),
  description: z.string().optional(),
  tableCount: z.number().int().min(1).max(100).default(6),
});

const updateRestaurantSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  currency: z.string().optional(),
  address: z.string().optional(),
  accentColor: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  wifiPassword: z.string().optional(),
  isActive: z.boolean().optional(),
});

// List all restaurants for current owner
router.get("/", async (req: Request, res: Response) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { ownerId: req.user!.id },
      include: {
        _count: {
          select: {
            tables: true,
            categories: true,
            dishes: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ restaurants });
  } catch (error) {
    console.error("List restaurants error:", error);
    return res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// Setup / Create new restaurant with auto-generated tables in a single transaction
router.post("/", validateBody(createRestaurantSchema), async (req: Request, res: Response) => {
  const {
    name,
    slug,
    currency,
    address,
    accentColor,
    logoUrl,
    bannerUrl,
    wifiPassword,
    description,
    tableCount,
  } = req.body;

  try {
    // Check if slug is unique
    const existingSlug = await prisma.restaurant.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (existingSlug) {
      return res.status(409).json({ error: "Restaurant URL slug is already taken" });
    }

    // Execute in a single Prisma transaction:
    // 1. Create Restaurant
    // 2. Create Table 01 through Table N with UUID qrToken
    const result = await prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          ownerId: req.user!.id,
          name,
          slug: slug.toLowerCase(),
          currency: currency || "USD",
          address: address || null,
          accentColor: accentColor || "#10B981",
          logoUrl: logoUrl || null,
          bannerUrl: bannerUrl || null,
          wifiPassword: wifiPassword || null,
          description: description || null,
          isActive: true,
        },
      });

      // Generate Table 01 through Table N
      const tablesToCreate = [];
      for (let i = 1; i <= tableCount; i++) {
        const paddedNum = String(i).padStart(2, "0");
        const qrToken = `tbl_${restaurant.slug}_${paddedNum}_${crypto.randomUUID().slice(0, 8)}`;
        tablesToCreate.push({
          restaurantId: restaurant.id,
          tableNumber: i,
          label: `Table ${paddedNum}`,
          qrToken,
          capacity: 4,
          isActive: true,
        });
      }

      await tx.table.createMany({
        data: tablesToCreate,
      });

      // Default category "Popular Items"
      await tx.category.create({
        data: {
          restaurantId: restaurant.id,
          name: "Popular Items",
          sortOrder: 1,
          description: "Our signature dishes and favorites",
          isActive: true,
        },
      });

      return restaurant;
    }, { maxWait: 15000, timeout: 30000 });

    // Return the created restaurant with its tables
    const fullRestaurant = await prisma.restaurant.findUnique({
      where: { id: result.id },
      include: {
        tables: { orderBy: { tableNumber: "asc" } },
        categories: true,
      },
    });

    return res.status(201).json({ restaurant: fullRestaurant });
  } catch (error) {
    console.error("Create restaurant error:", error);
    return res.status(500).json({ error: "Failed to create restaurant and tables" });
  }
});

// Get single restaurant
router.get("/:id", verifyRestaurantOwner, async (req: Request, res: Response) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
      include: {
        tables: { orderBy: { tableNumber: "asc" } },
        categories: {
          orderBy: { sortOrder: "asc" },
          include: {
            dishes: { orderBy: { createdAt: "asc" } },
          },
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    return res.json({ restaurant });
  } catch (error) {
    console.error("Get restaurant error:", error);
    return res.status(500).json({ error: "Failed to fetch restaurant" });
  }
});

// Update restaurant profile & settings
router.patch("/:id", verifyRestaurantOwner, validateBody(updateRestaurantSchema), async (req: Request, res: Response) => {
  try {
    const updated = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: req.body,
    });

    return res.json({ restaurant: updated });
  } catch (error) {
    console.error("Update restaurant error:", error);
    return res.status(500).json({ error: "Failed to update restaurant settings" });
  }
});

export default router;

