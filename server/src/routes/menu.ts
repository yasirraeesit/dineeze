import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { authenticateJWT, verifyRestaurantOwner } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();
router.use(authenticateJWT);

// Validation Schemas
const categorySchema = z.object({
  restaurantId: z.string(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  sortOrder: z.number().int().optional().default(0),
});

const itemSchema = z.object({
  restaurantId: z.string(),
  categoryId: z.string(),
  name: z.string().min(1, "Dish name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than 0"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isAvailable: z.boolean().optional().default(true),
  isVegetarian: z.boolean().optional().default(false),
  isSpicy: z.boolean().optional().default(false),
  preparationTime: z.number().int().optional(),
});

const availabilitySchema = z.object({
  isAvailable: z.boolean(),
});

const reorderCategoriesSchema = z.object({
  restaurantId: z.string(),
  categoryIds: z.array(z.string()),
});

// --- Category Routes ---

// List categories
router.get("/categories", verifyRestaurantOwner, async (req: Request, res: Response) => {
  const restaurantId = req.query.restaurantId as string;
  try {
    const categories = await prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: "asc" },
      include: {
        dishes: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return res.json({ categories });
  } catch (error) {
    console.error("List categories error:", error);
    return res.status(500).json({ error: "Failed to list categories" });
  }
});

// Create category
router.post("/categories", verifyRestaurantOwner, validateBody(categorySchema), async (req: Request, res: Response) => {
  try {
    const { restaurantId, name, description, sortOrder } = req.body;
    const category = await prisma.category.create({
      data: {
        restaurantId,
        name,
        description,
        sortOrder: sortOrder || 0,
      },
    });
    return res.status(201).json({ category });
  } catch (error) {
    console.error("Create category error:", error);
    return res.status(500).json({ error: "Failed to create category" });
  }
});

// Reorder categories
router.put("/categories/reorder", verifyRestaurantOwner, validateBody(reorderCategoriesSchema), async (req: Request, res: Response) => {
  const { categoryIds } = req.body;
  try {
    await prisma.$transaction(
      categoryIds.map((id: string, index: number) =>
        prisma.category.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      )
    );
    return res.json({ success: true });
  } catch (error) {
    console.error("Reorder categories error:", error);
    return res.status(500).json({ error: "Failed to reorder categories" });
  }
});

// Update category
router.put("/categories/:id", async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { restaurant: true },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (category.restaurant.ownerId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden: Multi-tenant access denied" });
    }

    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name ?? category.name,
        description: req.body.description ?? category.description,
        sortOrder: req.body.sortOrder ?? category.sortOrder,
      },
    });

    return res.json({ category: updated });
  } catch (error) {
    console.error("Update category error:", error);
    return res.status(500).json({ error: "Failed to update category" });
  }
});

// Delete category
router.delete("/categories/:id", async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { restaurant: true },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (category.restaurant.ownerId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden: Multi-tenant access denied" });
    }

    await prisma.category.delete({
      where: { id: req.params.id },
    });

    return res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({ error: "Failed to delete category" });
  }
});

// --- Menu Items / Dishes Routes ---

// List items for restaurant
router.get("/items", verifyRestaurantOwner, async (req: Request, res: Response) => {
  const restaurantId = req.query.restaurantId as string;
  try {
    const items = await prisma.dish.findMany({
      where: { restaurantId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ items });
  } catch (error) {
    console.error("List items error:", error);
    return res.status(500).json({ error: "Failed to list menu items" });
  }
});

// Create menu item
router.post("/items", verifyRestaurantOwner, validateBody(itemSchema), async (req: Request, res: Response) => {
  try {
    const {
      restaurantId,
      categoryId,
      name,
      description,
      price,
      imageUrl,
      isAvailable,
      isVegetarian,
      isSpicy,
      preparationTime,
    } = req.body;

    const item = await prisma.dish.create({
      data: {
        restaurantId,
        categoryId,
        name,
        description: description || null,
        price,
        imageUrl: imageUrl || null,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        isVegetarian: isVegetarian || false,
        isSpicy: isSpicy || false,
        preparationTime: preparationTime || null,
      },
    });

    return res.status(201).json({ item });
  } catch (error) {
    console.error("Create item error:", error);
    return res.status(500).json({ error: "Failed to create menu item" });
  }
});

// Fast In-Stock / Sold-Out Toggle
router.patch("/items/:id/availability", validateBody(availabilitySchema), async (req: Request, res: Response) => {
  try {
    const dish = await prisma.dish.findUnique({
      where: { id: req.params.id },
      include: { restaurant: true },
    });

    if (!dish) {
      return res.status(404).json({ error: "Item not found" });
    }

    if (dish.restaurant.ownerId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden: Multi-tenant access denied" });
    }

    const updated = await prisma.dish.update({
      where: { id: req.params.id },
      data: { isAvailable: req.body.isAvailable },
    });

    return res.json({ item: updated });
  } catch (error) {
    console.error("Toggle availability error:", error);
    return res.status(500).json({ error: "Failed to update item availability" });
  }
});

// Update item
router.put("/items/:id", async (req: Request, res: Response) => {
  try {
    const dish = await prisma.dish.findUnique({
      where: { id: req.params.id },
      include: { restaurant: true },
    });

    if (!dish) {
      return res.status(404).json({ error: "Item not found" });
    }

    if (dish.restaurant.ownerId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden: Multi-tenant access denied" });
    }

    const updated = await prisma.dish.update({
      where: { id: req.params.id },
      data: {
        categoryId: req.body.categoryId ?? dish.categoryId,
        name: req.body.name ?? dish.name,
        description: req.body.description !== undefined ? req.body.description : dish.description,
        price: req.body.price !== undefined ? req.body.price : dish.price,
        imageUrl: req.body.imageUrl !== undefined ? req.body.imageUrl : dish.imageUrl,
        isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : dish.isAvailable,
        isVegetarian: req.body.isVegetarian !== undefined ? req.body.isVegetarian : dish.isVegetarian,
        isSpicy: req.body.isSpicy !== undefined ? req.body.isSpicy : dish.isSpicy,
        preparationTime: req.body.preparationTime !== undefined ? req.body.preparationTime : dish.preparationTime,
      },
    });

    return res.json({ item: updated });
  } catch (error) {
    console.error("Update item error:", error);
    return res.status(500).json({ error: "Failed to update item" });
  }
});

// Delete item
router.delete("/items/:id", async (req: Request, res: Response) => {
  try {
    const dish = await prisma.dish.findUnique({
      where: { id: req.params.id },
      include: { restaurant: true },
    });

    if (!dish) {
      return res.status(404).json({ error: "Item not found" });
    }

    if (dish.restaurant.ownerId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden: Multi-tenant access denied" });
    }

    await prisma.dish.delete({
      where: { id: req.params.id },
    });

    return res.json({ success: true, message: "Item deleted" });
  } catch (error) {
    console.error("Delete item error:", error);
    return res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;

