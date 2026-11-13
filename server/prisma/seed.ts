import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Dineeze database seed...");

  // 1. Upsert Demo Owner
  const demoEmail = "owner@thespicekitchen.com";
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  const owner = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      name: "Chef Marco",
      passwordHash: hashedPassword,
      role: Role.OWNER,
    },
    create: {
      email: demoEmail,
      name: "Chef Marco",
      passwordHash: hashedPassword,
      role: Role.OWNER,
    },
  });

  console.log(`👤 Owner ready: ${owner.email} (${owner.id})`);

  // 2. Upsert Restaurant: The Spice Kitchen
  const restaurantSlug = "the-spice-kitchen";
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: restaurantSlug },
    update: {
      name: "The Spice Kitchen",
      description: "Authentic artisan Indian & contemporary fusion cuisine.",
      accentColor: "#10B981",
      currency: "USD",
      ownerId: owner.id,
      isActive: true,
      logoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    },
    create: {
      ownerId: owner.id,
      name: "The Spice Kitchen",
      slug: restaurantSlug,
      description: "Authentic artisan Indian & contemporary fusion cuisine.",
      accentColor: "#10B981",
      currency: "USD",
      isActive: true,
      logoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    },
  });

  console.log(`🍽️ Restaurant ready: ${restaurant.name} (${restaurant.id})`);

  // 3. Seed 6 Tables
  const tablesData = [
    { tableNumber: 1, label: "Patio Table 1", qrToken: "table-1-spice-kitchen", capacity: 2 },
    { tableNumber: 2, label: "Patio Table 2", qrToken: "table-2-spice-kitchen", capacity: 2 },
    { tableNumber: 3, label: "Main Dining 3", qrToken: "table-3-spice-kitchen", capacity: 4 },
    { tableNumber: 4, label: "Main Dining 4", qrToken: "table-4-spice-kitchen", capacity: 4 },
    { tableNumber: 5, label: "Family Booth 5", qrToken: "table-5-spice-kitchen", capacity: 6 },
    { tableNumber: 6, label: "Banquet Table 6", qrToken: "table-6-spice-kitchen", capacity: 8 },
  ];

  for (const table of tablesData) {
    await prisma.table.upsert({
      where: { qrToken: table.qrToken },
      update: {
        restaurantId: restaurant.id,
        tableNumber: table.tableNumber,
        label: table.label,
        capacity: table.capacity,
        isActive: true,
      },
      create: {
        restaurantId: restaurant.id,
        tableNumber: table.tableNumber,
        label: table.label,
        qrToken: table.qrToken,
        capacity: table.capacity,
        isActive: true,
      },
    });
  }
  console.log(`🪑 6 Tables seeded`);

  // 4. Seed 3 Categories
  const categoriesData = [
    { name: "Starters", sortOrder: 1, description: "Crisp bites and savory appetizers" },
    { name: "Main Course", sortOrder: 2, description: "Rich curries, sizzling grills, and fragrant biryanis" },
    { name: "Beverages", sortOrder: 3, description: "Refreshing traditional and modern cold drinks" },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesData) {
    const existing = await prisma.category.findFirst({
      where: { restaurantId: restaurant.id, name: cat.name },
    });

    let catId = existing?.id;
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { sortOrder: cat.sortOrder, description: cat.description },
      });
    } else {
      const created = await prisma.category.create({
        data: {
          restaurantId: restaurant.id,
          name: cat.name,
          sortOrder: cat.sortOrder,
          description: cat.description,
          isActive: true,
        },
      });
      catId = created.id;
    }
    if (catId) {
      categoryMap.set(cat.name, catId);
    }
  }
  console.log(`📂 3 Categories seeded`);

  // 5. Seed 8 Sample Dishes
  const startersId = categoryMap.get("Starters")!;
  const mainCourseId = categoryMap.get("Main Course")!;
  const beveragesId = categoryMap.get("Beverages")!;

  const dishesData = [
    // Starters
    {
      name: "Crispy Samosa Chaat",
      categoryId: startersId,
      price: 8.50,
      description: "Golden fried pastries crushed with spiced chickpeas, yogurt, tamarind, and mint chutney.",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
      isVegetarian: true,
      isSpicy: true,
      preparationTime: 10,
    },
    {
      name: "Chicken Tikka Sliders",
      categoryId: startersId,
      price: 12.00,
      description: "Tandoor-smoked chicken tikka in brioche buns with pickled onion and mint aioli.",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
      isVegetarian: false,
      isSpicy: true,
      preparationTime: 15,
    },
    {
      name: "Truffle Garlic Naan Bites",
      categoryId: startersId,
      price: 7.50,
      description: "Wood-fired mini naan bites tossed in white truffle oil, roasted garlic, and cilantro.",
      imageUrl: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80",
      isVegetarian: true,
      isSpicy: false,
      preparationTime: 8,
    },
    // Main Course
    {
      name: "Butter Chicken Deluxe",
      categoryId: mainCourseId,
      price: 18.50,
      description: "Tender chicken morsels simmered in a velvety tomato, butter, and fenugreek gravy.",
      imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80",
      isVegetarian: false,
      isSpicy: false,
      preparationTime: 20,
    },
    {
      name: "Paneer Tikka Masala",
      categoryId: mainCourseId,
      price: 16.00,
      description: "Charred cottage cheese cubes cooked in a spiced onion-tomato masala.",
      imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
      isVegetarian: true,
      isSpicy: true,
      preparationTime: 18,
    },
    {
      name: "Slow-Cooked Lamb Rogan Josh",
      categoryId: mainCourseId,
      price: 21.00,
      description: "Kashmiri-style braised lamb shoulder infused with aromatic whole spices.",
      imageUrl: "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=600&q=80",
      isVegetarian: false,
      isSpicy: true,
      preparationTime: 25,
    },
    {
      name: "Fragrant Dum Biryani",
      categoryId: mainCourseId,
      price: 17.50,
      description: "Aged basmati rice layered with spiced chicken, saffron, and caramelized onions.",
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      isVegetarian: false,
      isSpicy: false,
      preparationTime: 22,
    },
    // Beverages
    {
      name: "Mango Cardamom Lassi",
      categoryId: beveragesId,
      price: 5.50,
      description: "Chilled yogurt drink blended with Alphonso mango pulp and fresh green cardamom.",
      imageUrl: "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80",
      isVegetarian: true,
      isSpicy: false,
      preparationTime: 5,
    },
  ];

  for (const dish of dishesData) {
    const existing = await prisma.dish.findFirst({
      where: { restaurantId: restaurant.id, name: dish.name },
    });

    if (existing) {
      await prisma.dish.update({
        where: { id: existing.id },
        data: {
          categoryId: dish.categoryId,
          price: dish.price,
          description: dish.description,
          imageUrl: dish.imageUrl,
          isVegetarian: dish.isVegetarian,
          isSpicy: dish.isSpicy,
          preparationTime: dish.preparationTime,
          isAvailable: true,
        },
      });
    } else {
      await prisma.dish.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: dish.categoryId,
          name: dish.name,
          price: dish.price,
          description: dish.description,
          imageUrl: dish.imageUrl,
          isVegetarian: dish.isVegetarian,
          isSpicy: dish.isSpicy,
          preparationTime: dish.preparationTime,
          isAvailable: true,
        },
      });
    }
  }
  console.log(`🍲 8 Sample dishes seeded`);

  console.log("✅ Dineeze seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

