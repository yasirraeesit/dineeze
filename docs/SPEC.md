# Dineeze System Specification (`SPEC.md`)

## 1. Executive Summary

**Dineeze** is a modern, real-time, multi-tenant digital dining and contactless ordering platform. It enables restaurant operators to configure digital menus, generate branded QR codes for physical tables, and receive real-time dine-in customer orders directly on a live kitchen display/dashboard. Customers scan a table QR code to view a responsive, brand-themed digital menu, customize items, and place orders directly from their smartphone without installing an app.

---

## 2. Monorepo Architecture

The project is structured as a TypeScript monorepo with strict separation of concerns between client and server:

```
dineeze/
├── .agents/
│   ├── rules/
│   │   └── dineeze-architecture.md
│   └── skills/
├── docs/
│   ├── SPEC.md
│   └── superpowers/plans/
├── client/                     # Frontend Application
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Custom hooks (e.g., useSocket)
│   │   ├── pages/              # Admin dashboard & customer menu routes
│   │   ├── stores/             # Zustand state stores (cart, auth, orders)
│   │   ├── types/              # Client-side domain types
│   │   ├── utils/              # Formatting, api client
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── server/                     # Backend API & WebSocket Engine
│   ├── prisma/
│   │   ├── schema.prisma       # Database models
│   │   └── seed.ts             # Default seed dataset
│   ├── src/
│   │   ├── config/             # Environment, cloudinary, db setup
│   │   ├── controllers/        # Route controllers
│   │   ├── middlewares/        # Auth, tenant verification, error handlers
│   │   ├── routes/             # Express route declarations
│   │   ├── sockets/            # Socket.io connection & event handlers
│   │   ├── types/              # Server-side TypeScript interfaces
│   │   ├── utils/              # Helper utilities (QR generation, price calculation)
│   │   └── index.ts            # Server entrypoint
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── package.json                # Root package orchestration
```

---

## 3. Non-Negotiable Core Tenets

1. **Monorepo Structure**: Standard `/client` (React, Vite, TS, Tailwind, Zustand) and `/server` (Node, Express, TS, Prisma, Socket.io).
2. **Multi-Tenant Isolation**: Every database query touching tenant data must scope to `restaurantId`. Updates and management actions require `restaurant.ownerId === req.user.id`.
3. **Server-Side Price Calculation**: On `POST /api/orders`, the client provides only `dishId`, `quantity`, and optional instructions. The server queries current dish prices directly from PostgreSQL, calculates line item subtotals and the overall order total, and writes the authoritative amounts to the database.
4. **Cloudinary Asset Storage**: All uploaded media (logos, food imagery) must be uploaded directly to Cloudinary. No persistent local disk storage is assumed (accommodating Render ephemeral disks).
5. **Dineeze Design System**:
   - Canvas / Page background: `#F8FAFC`
   - Sidebar / Navigation: `#0F172A`
   - SaaS Accent: `#10B981` (Emerald)
   - Typography: `Plus Jakarta Sans` (Display/Headings) + `Inter` (Body/UI)
   - Customer Menu (`/m/:qrToken`): Mobile-first `max-w-md mx-auto` layout with dynamic tenant `accentColor`.

---

## 4. Multi-Tenant Domain & Database Models (Prisma)

Target database: **PostgreSQL** (hosted on Neon with connection pooling).

### Entities & Relationships

- **User**: System administrator or restaurant owner.
  - Fields: `id`, `email`, `passwordHash`, `name`, `role` (`OWNER`, `STAFF`, `ADMIN`), `createdAt`, `updatedAt`
  - Relation: `restaurants Restaurant[]`

- **Restaurant**: Tenant organization.
  - Fields: `id`, `ownerId`, `name`, `slug` (unique), `description`, `logoUrl`, `bannerUrl`, `accentColor` (hex, default `#10B981`), `currency` (default `USD`), `isActive`, `createdAt`, `updatedAt`
  - Relations: `owner User`, `tables Table[]`, `categories Category[]`, `dishes Dish[]`, `orders Order[]`

- **Table**: Physical dining table inside a restaurant.
  - Fields: `id`, `restaurantId`, `tableNumber` (int or string), `label` (e.g. "Patio 4"), `qrToken` (unique UUID/nanoid for customer scanning), `capacity`, `isActive`, `createdAt`, `updatedAt`
  - Relations: `restaurant Restaurant`, `orders Order[]`

- **Category**: Menu grouping (e.g., Appetizers, Entrees, Drinks).
  - Fields: `id`, `restaurantId`, `name`, `description`, `sortOrder` (int), `isActive`, `createdAt`, `updatedAt`
  - Relations: `restaurant Restaurant`, `dishes Dish[]`

- **Dish**: Menu item offered by a restaurant.
  - Fields: `id`, `restaurantId`, `categoryId`, `name`, `description`, `price` (Decimal(10,2)), `imageUrl`, `isAvailable` (boolean), `isVegetarian` (boolean), `isSpicy` (boolean), `preparationTime` (int, minutes), `createdAt`, `updatedAt`
  - Relations: `restaurant Restaurant`, `category Category`, `orderItems OrderItem[]`

- **Order**: Customer dine-in order.
  - Fields: `id`, `restaurantId`, `tableId`, `orderNumber` (string e.g. "ORD-1001"), `status` (`PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `SERVED`, `COMPLETED`, `CANCELLED`), `totalAmount` (Decimal(10,2)), `customerName` (nullable), `customerPhone` (nullable), `notes` (nullable), `paymentStatus` (`UNPAID`, `PAID`), `createdAt`, `updatedAt`
  - Relations: `restaurant Restaurant`, `table Table`, `items OrderItem[]`

- **OrderItem**: Individual line item within an order.
  - Fields: `id`, `orderId`, `dishId`, `quantity` (int), `unitPrice` (Decimal(10,2) captured at order time), `subtotal` (Decimal(10,2)), `specialInstructions` (string nullable)
  - Relations: `order Order`, `dish Dish`

---

## 5. API Specification

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Create owner user and initial restaurant profile.
- `POST /api/auth/login`: Authenticate owner/staff, returns signed JWT.
- `GET /api/auth/me`: Validate JWT and return authenticated session details with associated restaurant.

### Restaurant Management (`/api/restaurants`)
- `GET /api/restaurants`: Fetch managed restaurants for the authenticated owner.
- `GET /api/restaurants/:id`: Fetch restaurant details (verified via `ownerId === req.user.id`).
- `PUT /api/restaurants/:id`: Update branding (name, accentColor, currency, logoUrl, bannerUrl).

### Menu Categories & Dishes (`/api/categories`, `/api/dishes`)
- `GET /api/restaurants/:restaurantId/categories`: List categories for tenant.
- `POST /api/restaurants/:restaurantId/categories`: Create category (owner check required).
- `PUT /api/restaurants/:restaurantId/categories/:id`: Update category.
- `DELETE /api/restaurants/:restaurantId/categories/:id`: Soft delete or remove category.
- `GET /api/restaurants/:restaurantId/dishes`: List dishes with category filter.
- `POST /api/restaurants/:restaurantId/dishes`: Create dish with photo URL from Cloudinary.
- `PUT /api/restaurants/:restaurantId/dishes/:id`: Update dish details or availability status.
- `DELETE /api/restaurants/:restaurantId/dishes/:id`: Remove dish.

### Tables & QR Codes (`/api/tables`)
- `GET /api/restaurants/:restaurantId/tables`: List all tables with active status and QR tokens.
- `POST /api/restaurants/:restaurantId/tables`: Create table and generate unique `qrToken`.
- `GET /api/tables/:id/qr`: Return downloadable QR code PNG or SVG targeting client `/m/:qrToken`.

### Public Customer Menu Endpoint (`/api/m/:qrToken`)
- `GET /api/m/:qrToken`: Public endpoint called when a customer scans a table QR code. Returns:
  - Restaurant metadata (`name`, `accentColor`, `logoUrl`, `bannerUrl`, `currency`)
  - Table info (`id`, `tableNumber`, `label`)
  - Full active menu grouped by category (only `isAvailable: true` dishes).

### Order Processing (`/api/orders`)
- `POST /api/orders`: Public endpoint for placing an order from the customer menu.
  - **Payload**:
    ```json
    {
      "qrToken": "table-uuid-or-token",
      "items": [
        { "dishId": "dish-1", "quantity": 2, "specialInstructions": "Extra spicy" },
        { "dishId": "dish-2", "quantity": 1 }
      ],
      "customerName": "Alex",
      "customerPhone": "1234567890",
      "notes": "Bring together"
    }
    ```
  - **Processing Logic**:
    1. Resolve `Table` and `Restaurant` from `qrToken`. Verify both are active.
    2. Extract all unique `dishId` values from request.
    3. Query database for dishes where `id IN (...)` and `restaurantId === table.restaurantId` and `isAvailable === true`.
    4. Validate all requested dish IDs exist and are available.
    5. Calculate line subtotals: `dish.price * item.quantity`.
    6. Calculate total order amount: `SUM(subtotals)`.
    7. Generate incremental readable `orderNumber` (e.g. `#1042`).
    8. Create `Order` and `OrderItem` records inside a Prisma transaction.
    9. Emit real-time Socket.io event: `socket.to("restaurant_" + restaurantId).emit("order:created", order)`.
    10. Return created order to customer with `status: "PENDING"`.

- `GET /api/restaurants/:restaurantId/orders`: Fetch active and past orders for kitchen/admin dashboard.
- `PATCH /api/restaurants/:restaurantId/orders/:id/status`: Update order status (`CONFIRMED`, `PREPARING`, `READY`, `SERVED`, etc.) and emit `order:updated` event to table and dashboard.

---

## 6. Real-Time Architecture (Socket.io)

- **Rooms**:
  - `restaurant_${restaurantId}`: Joined by authenticated restaurant dashboard and kitchen display clients.
  - `table_${tableId}`: Joined by customer mobile menu clients viewing active order updates.
- **Events**:
  - `order:created`: Broadcast to restaurant room when a new customer order is placed.
  - `order:status_changed`: Broadcast to restaurant room and table room when kitchen updates preparation status.
  - `table:call_waiter`: Optional customer ping sent to restaurant staff.

---

## 7. Media Upload Pipeline (Cloudinary)

- File uploads processed via `multer` in-memory storage buffer.
- Buffer streamed directly to Cloudinary using `cloudinary.v2.uploader.upload_stream` under folder `dineeze/{restaurantId}/`.
- Returns Cloudinary secure URL (`https://res.cloudinary.com/...`).
- No files stored on local disk, ensuring 100% compatibility with stateless hosting on Render.

---

## 8. Client UI & Design System

- **Styling Architecture**: Tailwind CSS with CSS custom variables.
- **Palette**:
  - Background Canvas: `#F8FAFC` (`slate-50`)
  - Surface Card: `#FFFFFF` (`white`) with subtle borders `#E2E8F0` (`slate-200`)
  - Primary Sidebar / Topbar: `#0F172A` (`slate-900`)
  - SaaS Accent: `#10B981` (`emerald-500`)
  - Text Primary: `#0F172A`
  - Text Muted: `#64748B` (`slate-500`)
- **Typography**:
  - Headings / Brand: `Plus Jakarta Sans`
  - Body / Form / Controls: `Inter`
- **Customer Mobile Menu Experience (`/m/:qrToken`)**:
  - Viewport-restricted container: `max-w-md mx-auto min-h-screen bg-slate-50 pb-28 shadow-xl`
  - Dynamic branding: Reads `restaurant.accentColor` and injects as `--tenant-accent` for buttons, active category tabs, and badges.
  - Sticky bottom floating order summary bar displaying cart count and total amount.
  - Real-time order status tracking with visual timeline.

---

## 9. Seed Dataset Specification

The default database seed must bootstrap:
1. **Demo Owner**:
   - Name: `Chef Marco`
   - Email: `owner@thespicekitchen.com`
   - Password: `Password123!` (hashed with bcryptjs)
   - Role: `OWNER`
2. **Restaurant**:
   - Name: `The Spice Kitchen`
   - Slug: `the-spice-kitchen`
   - Description: `Authentic artisan Indian & contemporary fusion cuisine.`
   - Accent Color: `#10B981`
   - Currency: `USD`
3. **6 Tables**:
   - Table 1 (Capacity 2, `qrToken`: `table-1-spice-kitchen`)
   - Table 2 (Capacity 2, `qrToken`: `table-2-spice-kitchen`)
   - Table 3 (Capacity 4, `qrToken`: `table-3-spice-kitchen`)
   - Table 4 (Capacity 4, `qrToken`: `table-4-spice-kitchen`)
   - Table 5 (Capacity 6, `qrToken`: `table-5-spice-kitchen`)
   - Table 6 (Capacity 8, `qrToken`: `table-6-spice-kitchen`)
4. **3 Categories**:
   - `Starters` (sortOrder: 1)
   - `Main Course` (sortOrder: 2)
   - `Beverages` (sortOrder: 3)
5. **8 Sample Dishes**:
   - *Starters*:
     1. Crispy Samosa Chaat ($8.50, Vegetarian, Spicy)
     2. Chicken Tikka Sliders ($12.00, Spicy)
     3. Truffle Garlic Naan Bites ($7.50, Vegetarian)
   - *Main Course*:
     4. Butter Chicken Deluxe ($18.50)
     5. Paneer Tikka Masala ($16.00, Vegetarian, Spicy)
     6. Slow-Cooked Lamb Rogan Josh ($21.00, Spicy)
     7. Fragrant Dum Biryani ($17.50)
   - *Beverages*:
     8. Mango Cardamom Lassi ($5.50, Vegetarian)

