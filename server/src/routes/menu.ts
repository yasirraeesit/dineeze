import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { authenticateJWT, verifyRestaurantOwner, requireRole } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

// Protect dashboard menu management routes with owner/manager JWT authentication
router.use("/categories", authenticateJWT, requireRole("MANAGER"));
router.use("/items", authenticateJWT, requireRole("MANAGER"));
router.use("/seed-sample", authenticateJWT, requireRole("MANAGER"));

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
  prepTimeMinutes: z.number().int().min(1).optional().default(10),
  sortOrder: z.number().int().optional().default(0),
});

const availabilitySchema = z.object({
  isAvailable: z.boolean(),
});

const reorderCategoriesSchema = z.object({
  restaurantId: z.string(),
  categoryIds: z.array(z.string()),
});

const reorderItemsSchema = z.object({
  restaurantId: z.string(),
  dishIds: z.array(z.string()).min(1, "At least one dish ID is required"),
});

const seedSampleSchema = z.object({
  restaurantId: z.string(),
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
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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
        prepTimeMinutes: req.body.prepTimeMinutes || 10,
        sortOrder: req.body.sortOrder || 0,
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

// Reorder items / dishes
router.put("/items/reorder", verifyRestaurantOwner, validateBody(reorderItemsSchema), async (req: Request, res: Response) => {
  const { dishIds } = req.body;
  try {
    await prisma.$transaction(
      dishIds.map((id: string, index: number) =>
        prisma.dish.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      )
    );
    return res.json({ success: true, message: "Dishes reordered successfully" });
  } catch (error) {
    console.error("Reorder dishes error:", error);
    return res.status(500).json({ error: "Failed to reorder dishes" });
  }
});

// One-Click "Load Sample Menu" for empty restaurants
router.post("/seed-sample", verifyRestaurantOwner, validateBody(seedSampleSchema), async (req: Request, res: Response) => {
  const { restaurantId } = req.body;
  try {
    const existingCount = await prisma.category.count({
      where: { restaurantId },
    });

    if (existingCount > 0) {
      return res.status(400).json({
        error: "Menu already contains categories. Quick-start sample menu is only available for empty menus.",
      });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const currency = restaurant.currency || "USD";

    // Pricing scaled to restaurant's active currency
    const prices = (() => {
      switch (currency) {
        case "PKR":
          return { calamari: 1350, bruschetta: 950, burger: 1850, salmon: 2450, spritz: 650, latte: 550 };
        case "INR":
          return { calamari: 450, bruschetta: 350, burger: 650, salmon: 850, spritz: 250, latte: 200 };
        case "GBP":
          return { calamari: 11.5, bruschetta: 9.5, burger: 15.5, salmon: 20.0, spritz: 5.5, latte: 4.5 };
        case "USD":
        default:
          return { calamari: 13.5, bruschetta: 11.0, burger: 18.5, salmon: 24.0, spritz: 6.5, latte: 5.5 };
      }
    })();

    const createdCategories = await prisma.$transaction(async (tx) => {
      // Category 1: Starters
      const cat1 = await tx.category.create({
        data: {
          restaurantId,
          name: "Starters & Small Plates",
          description: "Handcrafted appetizers prepared fresh to order",
          sortOrder: 1,
          dishes: {
            create: [
              {
                restaurantId,
                name: "Crispy Calamari",
                description: "Herb-dusted squid with roasted garlic aioli and charred lemon.",
                price: prices.calamari,
                isAvailable: true,
                isVegetarian: false,
                isSpicy: false,
                preparationTime: 10,
                sortOrder: 1,
                imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80",
              },
              {
                restaurantId,
                name: "Truffle Mushroom Bruschetta",
                description: "Wild sauteed mushrooms, garlic thyme butter on grilled artisan sourdough.",
                price: prices.bruschetta,
                isAvailable: true,
                isVegetarian: true,
                isSpicy: false,
                preparationTime: 8,
                sortOrder: 2,
                imageUrl: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=800&q=80",
              },
            ],
          },
        },
        include: { dishes: true },
      });

      // Category 2: Mains
      const cat2 = await tx.category.create({
        data: {
          restaurantId,
          name: "Mains & Signature Grills",
          description: "Prime cuts and chef-crafted kitchen specialties",
          sortOrder: 2,
          dishes: {
            create: [
              {
                restaurantId,
                name: "Smoky Wagyu Burger",
                description: "Black Angus beef, aged cheddar, caramelized shallots, brioche bun, truffle fries.",
                price: prices.burger,
                isAvailable: true,
                isVegetarian: false,
                isSpicy: false,
                preparationTime: 15,
                sortOrder: 1,
                imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
              },
              {
                restaurantId,
                name: "Pan-Seared Salmon Fillet",
                description: "Atlantic salmon, lemon dill butter glaze, roasted asparagus, creamy potato puree.",
                price: prices.salmon,
                isAvailable: true,
                isVegetarian: false,
                isSpicy: false,
                preparationTime: 18,
                sortOrder: 2,
                imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80",
              },
            ],
          },
        },
        include: { dishes: true },
      });

      // Category 3: Beverages
      const cat3 = await tx.category.create({
        data: {
          restaurantId,
          name: "Beverages & Refreshers",
          description: "Artisan sodas, mocktails, and specialty brews",
          sortOrder: 3,
          dishes: {
            create: [
              {
                restaurantId,
                name: "Artisan Wild Berry Spritz",
                description: "Sparkling mineral soda, crushed mountain blackberries, lime, and garden mint.",
                price: prices.spritz,
                isAvailable: true,
                isVegetarian: true,
                isSpicy: false,
                preparationTime: 5,
                sortOrder: 1,
                imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80",
              },
              {
                restaurantId,
                name: "Iced Vanilla Oat Latte",
                description: "Double shot single-origin espresso, steamed organic oat milk, Madagascar vanilla.",
                price: prices.latte,
                isAvailable: true,
                isVegetarian: true,
                isSpicy: false,
                preparationTime: 5,
                sortOrder: 2,
                imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&q=80",
              },
            ],
          },
        },
        include: { dishes: true },
      });

      return [cat1, cat2, cat3];
    });

    return res.status(201).json({
      success: true,
      message: "Starter menu created successfully with 3 categories and 6 chef-crafted items.",
      categories: createdCategories,
    });
  } catch (error) {
    console.error("Seed sample menu error:", error);
    return res.status(500).json({ error: "Failed to load sample menu" });
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

