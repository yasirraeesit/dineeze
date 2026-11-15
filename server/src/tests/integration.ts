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

    // -------------------------------------------------------------------------
    // TEST (h): Sprint 1 (Wait Times, Item Prep Toggle, Feedback, Void Reason)
    // -------------------------------------------------------------------------
    console.log("▶ TEST (h): Verifying Sprint 1 wait time, item prep toggle, feedback, and void reason...");

    // 1. Verify estimatedWaitMinutes in GET /api/menu/:qrToken
    const menuWithWaitRes = await fetch(`${baseUrl}/api/menu/${tableA.qrToken}`);
    const menuWithWaitJson: any = await menuWithWaitRes.json();
    if (typeof menuWithWaitJson.estimatedWaitMinutes !== "number" || menuWithWaitJson.estimatedWaitMinutes < 10) {
      throw new Error(`TEST (h) FAILED: expected estimatedWaitMinutes >= 10, got ${menuWithWaitJson.estimatedWaitMinutes}`);
    }

    // 2. Verify Item-Level Kitchen Prep Toggle
    const orderItemId = orderJson.order.items[0].id;

    // Cross-tenant prep toggle should return 403
    const crossTenantPrepRes = await fetch(`${baseUrl}/api/orders/${createdOrderId}/items/${orderItemId}/prepared`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ isPrepared: true }),
    });
    if (crossTenantPrepRes.status !== 403) {
      throw new Error(`TEST (h) FAILED: Expected 403 on cross-tenant item prep toggle, got ${crossTenantPrepRes.status}`);
    }

    // Authorized prep toggle should return 200 with updated isPrepared
    const authPrepRes = await fetch(`${baseUrl}/api/orders/${createdOrderId}/items/${orderItemId}/prepared`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ isPrepared: true }),
    });
    const authPrepJson: any = await authPrepRes.json();
    if (authPrepRes.status !== 200 || authPrepJson.item?.isPrepared !== true) {
      throw new Error(`TEST (h) FAILED: Item prep toggle failed, status: ${authPrepRes.status}`);
    }

    // 3. Verify Post-Meal Feedback
    // First advance order to READY status
    await fetch(`${baseUrl}/api/orders/${createdOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ status: "READY" }),
    });

    // Public guest feedback submission (rating 1-5 + comment)
    const feedbackRes = await fetch(`${baseUrl}/api/orders/${createdOrderId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5, feedbackComment: "Exceptional dining!" }),
    });
    const feedbackJson: any = await feedbackRes.json();
    if (feedbackRes.status !== 200 || feedbackJson.order?.rating !== 5) {
      throw new Error(`TEST (h) FAILED: Feedback submission failed, status: ${feedbackRes.status}`);
    }

    // Duplicate feedback should return 400
    const dupFeedbackRes = await fetch(`${baseUrl}/api/orders/${createdOrderId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 4 }),
    });
    if (dupFeedbackRes.status !== 400) {
      throw new Error(`TEST (h) FAILED: Expected 400 on duplicate feedback, got ${dupFeedbackRes.status}`);
    }

    // 4. Verify Cancel / Void Order with Reason
    // Missing cancelReason on CANCELLED should return 400
    const invalidCancelRes = await fetch(`${baseUrl}/api/orders/${createdOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (invalidCancelRes.status !== 400) {
      throw new Error(`TEST (h) FAILED: Expected 400 when cancelReason is missing, got ${invalidCancelRes.status}`);
    }

    // Valid cancel with reason should return 200 and store cancelReason
    const validCancelRes = await fetch(`${baseUrl}/api/orders/${createdOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ status: "CANCELLED", cancelReason: "Guest changed mind" }),
    });
    const validCancelJson: any = await validCancelRes.json();
    if (validCancelRes.status !== 200 || validCancelJson.order?.cancelReason !== "Guest changed mind") {
      throw new Error(`TEST (h) FAILED: Cancel with reason failed, status: ${validCancelRes.status}`);
    }

    console.log(`  ✅ PASS: Wait time, prep toggle, feedback, and void reason validated.`);

    // -------------------------------------------------------------------------
    // TEST (i): Sprint 2 (Live Floor Status, Split-Bill/Payment & Analytics)
    // -------------------------------------------------------------------------
    console.log("▶ TEST (i): Verifying live floor status, payment settlement, and analytics API...");

    // 1. Verify GET /api/tables/status
    // Cross-tenant check: tokenB querying restaurantA tables should return 403
    const crossTenantFloorRes = await fetch(`${baseUrl}/api/tables/status?restaurantId=${restaurantA.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    if (crossTenantFloorRes.status !== 403) {
      throw new Error(`TEST (i) FAILED: Expected 403 on cross-tenant floor query, got ${crossTenantFloorRes.status}`);
    }

    // Authorized floor query returns enriched tables
    const authFloorRes = await fetch(`${baseUrl}/api/tables/status?restaurantId=${restaurantA.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const authFloorJson: any = await authFloorRes.json();
    if (authFloorRes.status !== 200 || !Array.isArray(authFloorJson.tables) || authFloorJson.tables.length === 0) {
      throw new Error(`TEST (i) FAILED: Floor status returned invalid response, status: ${authFloorRes.status}`);
    }
    const targetTable = authFloorJson.tables.find((t: any) => t.id === tableA.id);
    if (!targetTable || !targetTable.floorStatus) {
      throw new Error(`TEST (i) FAILED: targetTable not enriched with floorStatus`);
    }

    // 2. Verify PATCH /api/orders/:id/payment
    // Cross-tenant check: tokenB attempting to settle restaurantA's order should return 403
    const crossTenantPayRes = await fetch(`${baseUrl}/api/orders/${createdOrderId}/payment`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ paymentMethod: "CARD", splitCount: 2 }),
    });
    if (crossTenantPayRes.status !== 403) {
      throw new Error(`TEST (i) FAILED: Expected 403 on cross-tenant payment settlement, got ${crossTenantPayRes.status}`);
    }

    // Authorized payment settlement
    const authPayRes = await fetch(`${baseUrl}/api/orders/${createdOrderId}/payment`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ paymentMethod: "CARD", splitCount: 2 }),
    });
    const authPayJson: any = await authPayRes.json();
    if (authPayRes.status !== 200 || authPayJson.order?.paymentStatus !== "PAID" || authPayJson.order?.paymentMethod !== "CARD") {
      throw new Error(`TEST (i) FAILED: Payment settlement failed, status: ${authPayRes.status}`);
    }

    // 3. Verify GET /api/analytics
    // Cross-tenant check: tokenB querying restaurantA analytics should return 403
    const crossTenantAnalyticsRes = await fetch(`${baseUrl}/api/analytics?restaurantId=${restaurantA.id}&range=7d`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    if (crossTenantAnalyticsRes.status !== 403) {
      throw new Error(`TEST (i) FAILED: Expected 403 on cross-tenant analytics query, got ${crossTenantAnalyticsRes.status}`);
    }

    // Authorized analytics query
    const authAnalyticsRes = await fetch(`${baseUrl}/api/analytics?restaurantId=${restaurantA.id}&range=7d`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const authAnalyticsJson: any = await authAnalyticsRes.json();
    if (
      authAnalyticsRes.status !== 200 ||
      typeof authAnalyticsJson.summary?.totalRevenue !== "number" ||
      !Array.isArray(authAnalyticsJson.dailySeries) ||
      !Array.isArray(authAnalyticsJson.peakHours) ||
      authAnalyticsJson.peakHours.length !== 24
    ) {
      throw new Error(`TEST (i) FAILED: Analytics response schema invalid: ${JSON.stringify(authAnalyticsJson)}`);
    }

    console.log(`  ✅ PASS: Floor board, payment settlement, and analytics API verified with multi-tenant isolation.`);

    // ==========================================
    // TEST (j): Sprint 3 - Multi-Branch, Staff RBAC, Order Audit Log & Smart Cart Upsells
    // ==========================================
    console.log("👉 TEST (j): Multi-Branch, Staff RBAC, Audit Logs & Upsells...");

    // 1. Create a second branch with menu cloning
    const branchSlug = `branch-two-${Date.now()}`;
    const createBranchRes = await fetch(`${baseUrl}/api/restaurants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: "Branch Two",
        slug: branchSlug,
        currency: "USD",
        tableCount: 3,
        cloneMenuFromRestaurantId: restaurantA.id,
      }),
    });
    const createBranchJson: any = await createBranchRes.json();
    if (createBranchRes.status !== 201 || !createBranchJson.restaurant) {
      throw new Error(`TEST (j) FAILED: Failed to create cloned branch: ${JSON.stringify(createBranchJson)}`);
    }
    const branch2 = createBranchJson.restaurant;

    // Verify categories & dishes were cloned
    const branch2Categories = await prisma.category.findMany({
      where: { restaurantId: branch2.id },
      include: { dishes: true },
    });
    if (branch2Categories.length === 0 || branch2Categories[0].dishes.length === 0) {
      throw new Error(`TEST (j) FAILED: Menu was not cloned to new branch`);
    }
    const branch2Dish = branch2Categories[0].dishes[0];
    const branch2Table = branch2.tables[0];

    // Verify GET /api/restaurants/mine
    const listMineRes = await fetch(`${baseUrl}/api/restaurants/mine`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listMineJson: any = await listMineRes.json();
    if (listMineRes.status !== 200 || listMineJson.restaurants.length < 2) {
      throw new Error(`TEST (j) FAILED: GET /api/restaurants/mine did not return all owner branches`);
    }

    // 2. Provision Staff (Kitchen and Waiter)
    const addKitchenRes = await fetch(`${baseUrl}/api/staff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        restaurantId: branch2.id,
        name: "Chef Mario",
        email: `chef-${Date.now()}@dineeze.test`,
        pinOrPassword: "kitchen-pin-4321",
        role: "KITCHEN",
      }),
    });
    const addKitchenJson: any = await addKitchenRes.json();
    if (addKitchenRes.status !== 201 || !addKitchenJson.staff) {
      throw new Error(`TEST (j) FAILED: Failed to create kitchen staff: ${JSON.stringify(addKitchenJson)}`);
    }
    const kitchenStaff = addKitchenJson.staff;

    const addWaiterRes = await fetch(`${baseUrl}/api/staff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        restaurantId: branch2.id,
        name: "Waiter Luigi",
        email: `waiter-${Date.now()}@dineeze.test`,
        pinOrPassword: "waiter-pin-1234",
        role: "WAITER",
      }),
    });
    const addWaiterJson: any = await addWaiterRes.json();
    const waiterStaff = addWaiterJson.staff;

    // Cross-tenant protection on staff management
    const crossStaffRes = await fetch(`${baseUrl}/api/staff?restaurantId=${branch2.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    if (crossStaffRes.status !== 403) {
      throw new Error(`TEST (j) FAILED: Expected 403 for cross-tenant staff access, got ${crossStaffRes.status}`);
    }

    // 3. Staff Login
    const staffLoginRes = await fetch(`${baseUrl}/api/auth/staff-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantSlug: branch2.slug,
        email: kitchenStaff.email,
        pinOrPassword: "kitchen-pin-4321",
      }),
    });
    const staffLoginJson: any = await staffLoginRes.json();
    if (staffLoginRes.status !== 200 || !staffLoginJson.token || staffLoginJson.staff.role !== "KITCHEN") {
      throw new Error(`TEST (j) FAILED: Staff login failed: ${JSON.stringify(staffLoginJson)}`);
    }
    const kitchenToken = staffLoginJson.token;

    const waiterLoginRes = await fetch(`${baseUrl}/api/auth/staff-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantSlug: branch2.slug,
        email: waiterStaff.email,
        pinOrPassword: "waiter-pin-1234",
      }),
    });
    const waiterLoginJson: any = await waiterLoginRes.json();
    const waiterToken = waiterLoginJson.token;

    // 4. Place an order on Branch 2 & test RBAC + Audit Logs
    const branch2OrderRes = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qrToken: branch2Table.qrToken,
        items: [{ dishId: branch2Dish.id, quantity: 2 }],
      }),
    });
    const branch2OrderJson: any = await branch2OrderRes.json();
    const b2Order = branch2OrderJson.order;
    const b2OrderItem = b2Order.items[0];

    // Waiter tries to toggle item prep -> MUST BE 403 FORBIDDEN
    const waiterPrepRes = await fetch(`${baseUrl}/api/orders/${b2Order.id}/items/${b2OrderItem.id}/prepared`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${waiterToken}`,
      },
      body: JSON.stringify({ isPrepared: true }),
    });
    if (waiterPrepRes.status !== 403) {
      throw new Error(`TEST (j) FAILED: Expected 403 when waiter tries to toggle kitchen prep status, got ${waiterPrepRes.status}`);
    }

    // Kitchen staff toggles item prep -> 200 OK
    const kitchenPrepRes = await fetch(`${baseUrl}/api/orders/${b2Order.id}/items/${b2OrderItem.id}/prepared`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${kitchenToken}`,
      },
      body: JSON.stringify({ isPrepared: true }),
    });
    if (kitchenPrepRes.status !== 200) {
      throw new Error(`TEST (j) FAILED: Kitchen staff failed to update prep status: ${kitchenPrepRes.status}`);
    }

    // Kitchen staff accepts order (PREPARING)
    await fetch(`${baseUrl}/api/orders/${b2Order.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${kitchenToken}`,
      },
      body: JSON.stringify({ status: "PREPARING" }),
    });

    // Waiter settles payment -> 200 OK
    const waiterPayRes = await fetch(`${baseUrl}/api/orders/${b2Order.id}/payment`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${waiterToken}`,
      },
      body: JSON.stringify({ paymentMethod: "CASH", splitCount: 1 }),
    });
    if (waiterPayRes.status !== 200) {
      throw new Error(`TEST (j) FAILED: Waiter failed to settle payment: ${waiterPayRes.status}`);
    }

    // 5. Verify Chronological Audit Log
    const auditLogsRes = await fetch(`${baseUrl}/api/orders/audit-logs?restaurantId=${branch2.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const auditLogsJson: any = await auditLogsRes.json();
    if (auditLogsRes.status !== 200 || !Array.isArray(auditLogsJson.auditLogs) || auditLogsJson.auditLogs.length < 3) {
      throw new Error(`TEST (j) FAILED: Audit logs not properly recorded: ${JSON.stringify(auditLogsJson)}`);
    }

    // 6. Verify Smart Cart Upsells endpoint
    const upsellsRes = await fetch(`${baseUrl}/api/menu/${branch2Table.qrToken}/upsells?itemIds=${branch2Dish.id}`);
    const upsellsJson: any = await upsellsRes.json();
    if (upsellsRes.status !== 200 || !Array.isArray(upsellsJson.upsells)) {
      throw new Error(`TEST (j) FAILED: Upsell recommendations endpoint failed: ${JSON.stringify(upsellsJson)}`);
    }

    console.log(`  ✅ PASS: Multi-branch cloning, staff RBAC, order audit logs, and smart cart upsells verified.`);

    // Cleanup branch 2
    await prisma.orderAuditLog.deleteMany({ where: { restaurantId: branch2.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: b2Order.id } });
    await prisma.order.deleteMany({ where: { restaurantId: branch2.id } });
    await prisma.staffMember.deleteMany({ where: { restaurantId: branch2.id } });
    await prisma.dish.deleteMany({ where: { restaurantId: branch2.id } });
    await prisma.category.deleteMany({ where: { restaurantId: branch2.id } });
    await prisma.table.deleteMany({ where: { restaurantId: branch2.id } });
    await prisma.restaurant.delete({ where: { id: branch2.id } });

    // Cleanup test records
    await prisma.dish.deleteMany({ where: { restaurantId: emptyRestB.id } });
    await prisma.category.deleteMany({ where: { restaurantId: emptyRestB.id } });
    await prisma.restaurant.delete({ where: { id: emptyRestB.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } });
    await prisma.order.delete({ where: { id: createdOrderId } });
    await prisma.dish.delete({ where: { id: dishA.id } });
    await prisma.category.delete({ where: { id: categoryA.id } });
    await prisma.table.delete({ where: { id: tableA.id } });

    console.log("\n🎉 ALL 10 INTEGRATION TESTS PASSED CLEANLY!");
  } catch (error) {
    console.error("❌ Integration test error:", error);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runIntegrationTests();

