import http from "http";
import { app, io } from "../server";
import prisma from "../prisma";
import { io as ClientIO } from "socket.io-client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const TEST_PORT = 5099;
const JWT_SECRET = process.env.JWT_SECRET || "dineeze-super-secret-jwt-key-2026";

async function runIntegrationTests() {
  console.log("🧪 Starting Dineeze Backend Automated Integration Tests...\n");

  const server = http.createServer(app);
  io.attach(server);

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`📡 Test server running on http://localhost:${TEST_PORT}`);
      resolve();
    });
  });

  const baseUrl = `http://localhost:${TEST_PORT}`;

  try {
    // Setup test users & restaurants
    const passHash = await bcrypt.hash("Password123!", 10);

    const userA = await prisma.user.upsert({
      where: { email: "tenant_a@dineeze.test" },
      update: {},
      create: {
        email: "tenant_a@dineeze.test",
        name: "Owner A",
        passwordHash: passHash,
      },
    });

    const userB = await prisma.user.upsert({
      where: { email: "tenant_b@dineeze.test" },
      update: {},
      create: {
        email: "tenant_b@dineeze.test",
        name: "Owner B",
        passwordHash: passHash,
      },
    });

    const tokenA = jwt.sign({ id: userA.id, email: userA.email, role: userA.role }, JWT_SECRET);
    const tokenB = jwt.sign({ id: userB.id, email: userB.email, role: userB.role }, JWT_SECRET);

    const restaurantA = await prisma.restaurant.upsert({
      where: { slug: "restaurant-tenant-a" },
      update: { ownerId: userA.id },
      create: {
        ownerId: userA.id,
        name: "Restaurant A",
        slug: "restaurant-tenant-a",
        accentColor: "#10B981",
        currency: "USD",
      },
    });

    // Create table & dish for Restaurant A
    const tableA = await prisma.table.upsert({
      where: { qrToken: "test-token-table-a" },
      update: { restaurantId: restaurantA.id },
      create: {
        restaurantId: restaurantA.id,
        tableNumber: 99,
        label: "Test Table 99",
        qrToken: "test-token-table-a",
        capacity: 4,
      },
    });

    const categoryA = await prisma.category.create({
      data: {
        restaurantId: restaurantA.id,
        name: "Test Cat",
        sortOrder: 1,
      },
    });

    const dishA = await prisma.dish.create({
      data: {
        restaurantId: restaurantA.id,
        categoryId: categoryA.id,
        name: "Authoritative Burger",
        price: 15.50, // True price in DB
        isAvailable: true,
      },
    });

    // -------------------------------------------------------------------------
    // TEST (a): Cross-tenant access returns 403
    // -------------------------------------------------------------------------
    console.log("▶ TEST (a): Verifying strict cross-tenant isolation...");
    const crossTenantRes = await fetch(`${baseUrl}/api/restaurants/${restaurantA.id}`, {
      headers: {
        Authorization: `Bearer ${tokenB}`, // User B trying to access Restaurant A
      },
    });

    if (crossTenantRes.status === 403) {
      console.log("  ✅ PASS: Cross-tenant access was blocked with HTTP 403 Forbidden.");
    } else {
      throw new Error(`TEST (a) FAILED: Expected status 403, got ${crossTenantRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST (b): Tampered client prices are strictly recalculated server-side
    // -------------------------------------------------------------------------
    console.log("▶ TEST (b): Verifying server-side price recalculation on POST /api/orders...");
    const orderPayload = {
      qrToken: tableA.qrToken,
      items: [
        {
          dishId: dishA.id,
          quantity: 2,
          // Attacker injects fake cheap price
          price: 0.01,
          unitPrice: 0.01,
          totalAmount: 0.02,
        },
      ],
      customerName: "Attacker Test",
    };

    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    const orderJson: any = await orderRes.json();
    if (orderRes.status !== 201) {
      throw new Error(`TEST (b) FAILED: Order placement failed with status ${orderRes.status}: ${JSON.stringify(orderJson)}`);
    }

    // True DB price is 15.50 * 2 = 31.00
    const expectedTotal = "31.00";
    const actualTotal = Number(orderJson.order.totalAmount).toFixed(2);

    if (actualTotal === expectedTotal) {
      console.log(`  ✅ PASS: Client price (0.01) overridden. Correct DB calculated total: $${actualTotal}`);
    } else {
      throw new Error(`TEST (b) FAILED: Client price tampering succeeded! Total was ${actualTotal}, expected ${expectedTotal}`);
    }

    const createdOrderId = orderJson.order.id;

    // -------------------------------------------------------------------------
    // TEST (c): Order status update emits Socket.io events to restaurant room
    // -------------------------------------------------------------------------
    console.log("▶ TEST (c): Verifying real-time Socket.io event delivery on status update...");
    const socketClient = ClientIO(baseUrl, { transports: ["websocket"] });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Socket connection timed out"));
      }, 5000);

      socketClient.on("connect", () => {
        socketClient.emit("join_restaurant", restaurantA.id);
        clearTimeout(timeout);
        resolve();
      });
    });

    const socketEventPromise = new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Did not receive 'order_status_updated' socket event within 5s"));
      }, 5000);

      socketClient.on("order_status_updated", (data: any) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });

    // Update order status via API
    const updateRes = await fetch(`${baseUrl}/api/orders/${createdOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ status: "PREPARING" }),
    });

    if (updateRes.status !== 200) {
      throw new Error(`Failed to update order status: ${updateRes.status}`);
    }

    const receivedSocketData = await socketEventPromise;
    if (receivedSocketData && receivedSocketData.status === "PREPARING") {
      console.log("  ✅ PASS: Socket.io received 'order_status_updated' event for status: PREPARING");
    } else {
      throw new Error(`TEST (c) FAILED: Received unexpected socket event data: ${JSON.stringify(receivedSocketData)}`);
    }

    socketClient.disconnect();

    // -------------------------------------------------------------------------
    // TEST (d): Unauthenticated public menu access via GET /api/menu/:qrToken
    // -------------------------------------------------------------------------
    console.log("▶ TEST (d): Verifying public guest menu access without Authorization header...");
    const publicMenuRes = await fetch(`${baseUrl}/api/menu/${tableA.qrToken}`);
    if (publicMenuRes.status === 200) {
      const publicMenuJson: any = await publicMenuRes.json();
      if (publicMenuJson.restaurant?.name === "Restaurant A" && publicMenuJson.table?.qrToken === tableA.qrToken) {
        console.log(`  ✅ PASS: GET /api/menu/:qrToken returned HTTP 200 OK without any auth headers.`);
      } else {
        throw new Error(`TEST (d) FAILED: Unexpected response payload: ${JSON.stringify(publicMenuJson)}`);
      }
    } else {
      throw new Error(`TEST (d) FAILED: Expected status 200, got ${publicMenuRes.status} (Possible auth intercept bug!)`);
    }

    // -------------------------------------------------------------------------
    // TEST (e): Unauthenticated public order tracking via GET /api/orders/:id and /api/orders/:id/track
    // -------------------------------------------------------------------------
    console.log("▶ TEST (e): Verifying public order tracking without Authorization header...");
    const trackRes = await fetch(`${baseUrl}/api/orders/${createdOrderId}/track`);
    const directOrderRes = await fetch(`${baseUrl}/api/orders/${createdOrderId}`);
    if (trackRes.status === 200 && directOrderRes.status === 200) {
      console.log(`  ✅ PASS: Both GET /api/orders/:id and /track returned HTTP 200 OK without auth headers.`);
    } else {
      throw new Error(`TEST (e) FAILED: /track status: ${trackRes.status}, /:id status: ${directOrderRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST (f): Protected endpoints correctly reject unauthenticated requests
    // -------------------------------------------------------------------------
    console.log("▶ TEST (f): Verifying protected dashboard endpoints reject missing token with 401...");
    const unauthOrdersRes = await fetch(`${baseUrl}/api/orders?restaurantId=${restaurantA.id}`);
    const unauthCategoriesRes = await fetch(`${baseUrl}/api/menu/categories?restaurantId=${restaurantA.id}`);
    const authCategoriesRes = await fetch(`${baseUrl}/api/menu/categories?restaurantId=${restaurantA.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    if (unauthOrdersRes.status === 401 && unauthCategoriesRes.status === 401 && authCategoriesRes.status === 200) {
      console.log(`  ✅ PASS: Protected routes correctly return HTTP 401 when token is missing and 200 when authenticated.`);
    } else {
      throw new Error(`TEST (f) FAILED: unauthOrders=${unauthOrdersRes.status}, unauthCats=${unauthCategoriesRes.status}, authCats=${authCategoriesRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST (g): One-Click Sample Menu Seeding & Multi-Tenant Protection
    // -------------------------------------------------------------------------
    console.log("▶ TEST (g): Verifying POST /api/menu/seed-sample and dish reordering...");
    const emptyRestB = await prisma.restaurant.upsert({
      where: { slug: "restaurant-tenant-b-empty" },
      update: { ownerId: userB.id },
      create: {
        ownerId: userB.id,
        name: "Restaurant B Empty",
        slug: "restaurant-tenant-b-empty",
        accentColor: "#3B82F6",
        currency: "GBP",
      },
    });

    // Clean any prior categories on rest B
    await prisma.dish.deleteMany({ where: { restaurantId: emptyRestB.id } });
    await prisma.category.deleteMany({ where: { restaurantId: emptyRestB.id } });

    // 1. Unauthenticated seed rejects with 401
    const unauthSeedRes = await fetch(`${baseUrl}/api/menu/seed-sample`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId: emptyRestB.id }),
    });
    if (unauthSeedRes.status !== 401) {
      throw new Error(`TEST (g) FAILED: Expected 401 on unauth seed, got ${unauthSeedRes.status}`);
    }

    // 2. Cross-tenant seed (User A attempting to seed User B's restaurant) returns 403
    const crossTenantSeedRes = await fetch(`${baseUrl}/api/menu/seed-sample`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ restaurantId: emptyRestB.id }),
    });
    if (crossTenantSeedRes.status !== 403) {
      throw new Error(`TEST (g) FAILED: Expected 403 on cross-tenant seed, got ${crossTenantSeedRes.status}`);
    }

    // 3. Authorized seed populates 3 categories and 6 dishes
    const validSeedRes = await fetch(`${baseUrl}/api/menu/seed-sample`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ restaurantId: emptyRestB.id }),
    });
    const validSeedJson: any = await validSeedRes.json();
    if (validSeedRes.status !== 201 || validSeedJson.categories?.length !== 3) {
      throw new Error(`TEST (g) FAILED: Expected 201 with 3 categories, got status ${validSeedRes.status}`);
    }

    // 4. Repeated seed on non-empty menu returns 400
    const repeatSeedRes = await fetch(`${baseUrl}/api/menu/seed-sample`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ restaurantId: emptyRestB.id }),
    });
    if (repeatSeedRes.status !== 400) {
      throw new Error(`TEST (g) FAILED: Expected 400 on non-empty seed, got ${repeatSeedRes.status}`);
    }

    // 5. Test dish reordering: PUT /api/menu/items/reorder
    const seededDishes = validSeedJson.categories[0].dishes;
    const reorderedIds = [seededDishes[1].id, seededDishes[0].id];
    const reorderRes = await fetch(`${baseUrl}/api/menu/items/reorder`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        restaurantId: emptyRestB.id,
        dishIds: reorderedIds,
      }),
    });
    if (reorderRes.status === 200) {
      console.log(`  ✅ PASS: Sample menu seeded and reordered with multi-tenant isolation.`);
    } else {
      throw new Error(`TEST (g) FAILED: Dish reorder failed with status ${reorderRes.status}`);
    }

    // Cleanup test records
    await prisma.dish.deleteMany({ where: { restaurantId: emptyRestB.id } });
    await prisma.category.deleteMany({ where: { restaurantId: emptyRestB.id } });
    await prisma.restaurant.delete({ where: { id: emptyRestB.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } });
    await prisma.order.delete({ where: { id: createdOrderId } });
    await prisma.dish.delete({ where: { id: dishA.id } });
    await prisma.category.delete({ where: { id: categoryA.id } });
    await prisma.table.delete({ where: { id: tableA.id } });

    console.log("\n🎉 ALL 7 INTEGRATION TESTS PASSED CLEANLY!");
  } catch (error) {
    console.error("❌ Integration test error:", error);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runIntegrationTests();

