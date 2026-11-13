# Dineeze — Multi-Tenant QR Code Menu & Dine-In Ordering SaaS

<p align="center">
  <strong>Dining Made Effortless.</strong>
  <br />
  A full-stack, multi-tenant digital dining platform connecting tabletop guests directly to kitchen displays in real time.
</p>

<p align="center">
  <a href="https://dineeze.vercel.app">
    <img src="https://img.shields.io/badge/Vercel-Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel Live Demo" />
  </a>
  <a href="https://dineeze-backend.onrender.com/health">
    <img src="https://img.shields.io/badge/Render-Backend_Live-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Render Backend Live" />
  </a>
  <a href="https://neon.tech">
    <img src="https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=white" alt="Neon PostgreSQL" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Prisma_ORM-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Neon_Serverless-00E599?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white" alt="Cloudinary" />
</p>

---

## 🎯 Live Production Links & Demo Credentials

- **Public Marketing & Interactive Demo**: [https://dineeze.vercel.app](https://dineeze.vercel.app)
- **Live Customer Table Menu**: [https://dineeze.vercel.app/m/table-1-spice-kitchen](https://dineeze.vercel.app/m/table-1-spice-kitchen) *(Table 01 — The Spice Kitchen)*
- **Owner & Kitchen Management Dashboard**: [https://dineeze.vercel.app/login](https://dineeze.vercel.app/login)
  - **Email**: `owner@thespicekitchen.com`
  - **Password**: `Password123!`
- **Backend API Health Check**: [https://dineeze-backend.onrender.com/health](https://dineeze-backend.onrender.com/health)

---

## 📸 Product Surfaces

| Surface | Description | Preview |
| :--- | :--- | :--- |
| **SaaS Landing Page** (`/`) | High-converting marketing surface featuring an interactive Phone-to-KDS simulator, 3-step contactless workflow, asymmetric Bento feature grid, and transparent pricing. | <img src="docs/screenshots/landing.png" width="400" alt="Landing Page Preview" onerror="this.src='https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'" /> |
| **Live Kitchen KDS** (`/dashboard/orders`) | High-velocity Kanban tickets with real-time Socket.io dispatching, Web Audio synthesizer chime alerts, elapsed preparation timers, and one-tap status advancement. | <img src="docs/screenshots/kds.png" width="400" alt="Kitchen KDS Preview" onerror="this.src='https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'" /> |
| **Printable QR Table Tents** (`/dashboard/tables`) | Vector-sharp QR code generator with live preview and HTML5 Canvas renderer to export 300 DPI acrylic stand posters with guest Wi-Fi details. | <img src="docs/screenshots/tables.png" width="400" alt="Table QR Generator Preview" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'" /> |
| **Customer Mobile Menu** (`/m/:qrToken`) | Frictionless zero-app ordering experience locked to mobile viewport (`max-w-md`), styled dynamically with the restaurant's brand accent color. | <img src="docs/screenshots/mobile.png" width="400" alt="Customer Mobile Menu Preview" onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'" /> |

---

## ⚡ Core Features

### 1. Zero-Login Mobile Menu (`/m/:qrToken`)
- **Zero App Friction**: Runs directly in Mobile Safari/Chrome via standard QR camera scan; no App Store downloads or mandatory account creation.
- **Dynamic Tenant Theming**: Injects each restaurant's custom `accentColor` via CSS variable `--tenant-accent`, instantly branding buttons, tags, and cart bars.
- **Dietary & Modifier Badges**: Filter dishes by Vegetarian, Spicy, and Popular tags with customizable special instructions per line item.
- **Live Order Status Tracker**: Once placed, customers watch order progress (`PENDING` ➔ `PREPARING` ➔ `READY` ➔ `SERVED`) updating in real time via WebSockets.

### 2. Owner & Kitchen Management Dashboard (`/dashboard`)
- **Live KDS Kanban**: Kitchen display organized into Pending, Preparing, and Ready columns. Plays an authentic synthesized double-chime bell on incoming orders.
- **Menu Builder**: Fast in-stock toggling (`isAvailable`), category reordering, price configuration, and image uploads.
- **Floor Plan & Table Generator**: Batch generate tables with unique cryptographic QR tokens and export print-ready PDF/PNG table tents.
- **Restaurant Brand Settings**: Modify venue description, currency, Wi-Fi credentials, and live-preview brand accent colors on an integrated smartphone mockup.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Clients["Client Surfaces"]
        Guest["Guest Smartphone\n(/m/:qrToken)\nZero-Login Web Menu"]
        Owner["Restaurant Staff / Owner\n(/dashboard)\nKDS Kanban & Admin"]
    end

    subgraph Vercel["Vercel Cloud"]
        Frontend["Dineeze React SPA\n(Vite + TypeScript + Tailwind)"]
    end

    subgraph Render["Render Cloud"]
        Backend["Express REST API & Socket.io Engine\n(Node.js + TypeScript)"]
        Rooms["WebSocket Rooms\n- restaurant_{id} (Kitchen KDS)\n- order_{id} (Guest Tracker)"]
    end

    subgraph Neon["Neon Cloud"]
        Postgres[("Neon Serverless PostgreSQL\n- Pooled Connection (Runtime)\n- Direct Connection (Migrations)\nStrict Multi-Tenant Scoping")]
    end

    subgraph Cloudinary["Cloudinary CDN"]
        Media["Cloudinary Media Storage\n(Restaurant Logos, Banners, Dishes)\nMemory Buffer Streaming"]
    end

    Guest -->|HTTPS / WSS| Frontend
    Owner -->|HTTPS / WSS| Frontend
    Frontend -->|REST API Requests| Backend
    Frontend <-->|Real-Time Sockets| Rooms
    Backend -->|Prisma Client| Postgres
    Backend -->|Stream Buffers| Media
```

---

## 🔒 Security & Data Integrity Highlights

- **Strict Multi-Tenant Isolation**: Every database resource (`Table`, `Category`, `Dish`, `Order`, `OrderItem`) is strictly partitioned by `restaurantId`. API routes enforce that `restaurant.ownerId === req.user.id`.
- **Tamper-Proof Server-Side Price Recalculation**: On `POST /api/orders`, client-submitted prices are discarded. The server queries live item prices directly from Neon PostgreSQL inside an interactive Prisma transaction to compute subtotal and total amounts.
- **Zero Ephemeral Disk Storage**: Render web services run on ephemeral disks. Dineeze streams uploaded dish photos, logos, and banners directly into Cloudinary through memory buffers (`multer.memoryStorage()`), persisting only immutable HTTPS URLs in PostgreSQL.
- **Cryptographic Table Access**: QR codes encode opaque table tokens (`qrToken`) rather than auto-incrementing database IDs, preventing enumeration attacks across dining rooms.

---

## 📊 Database Schema (Prisma)

```mermaid
erDiagram
    User ||--o{ Restaurant : "owns"
    Restaurant ||--o{ Table : "has"
    Restaurant ||--o{ Category : "organizes"
    Restaurant ||--o{ Dish : "serves"
    Restaurant ||--o{ Order : "receives"
    Category ||--o{ Dish : "contains"
    Table ||--o{ Order : "places"
    Order ||--|{ OrderItem : "includes"
    Dish ||--o{ OrderItem : "references"

    User {
        string id PK
        string email UK
        string passwordHash
        string name
        enum role "OWNER | STAFF | ADMIN"
    }

    Restaurant {
        string id PK
        string ownerId FK
        string name
        string slug UK
        string accentColor
        string currency
        string logoUrl
        string bannerUrl
    }

    Table {
        string id PK
        string restaurantId FK
        int tableNumber
        string qrToken UK
        int capacity
        boolean isActive
    }

    Category {
        string id PK
        string restaurantId FK
        string name
        int sortOrder
        boolean isActive
    }

    Dish {
        string id PK
        string restaurantId FK
        string categoryId FK
        string name
        decimal price
        string imageUrl
        boolean isAvailable
        boolean isVegetarian
        boolean isSpicy
    }

    Order {
        string id PK
        string restaurantId FK
        string tableId FK
        string orderNumber
        enum status "PENDING | PREPARING | READY | SERVED | COMPLETED"
        decimal totalAmount
        enum paymentStatus "UNPAID | PAID"
    }

    OrderItem {
        string id PK
        string orderId FK
        string dishId FK
        int quantity
        decimal unitPrice
        decimal subtotal
        string specialInstructions
    }
```

---

## 🛠️ Local Development & Setup

### Prerequisites
- Node.js 20+
- npm 10+
- A Neon PostgreSQL database instance

### 1. Clone the Monorepo
```bash
git clone https://github.com/yasirraeesit/dineeze.git
cd dineeze
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

#### Backend (`/server/.env`)
```env
# Neon PostgreSQL Connection (Pooled for runtime queries)
DATABASE_URL="postgresql://user:pass@ep-wandering-mouse-bdcjkzem-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Neon PostgreSQL Direct Connection (Unpooled for DDL & Prisma migrations)
DIRECT_URL="postgresql://user:pass@ep-wandering-mouse-bdcjkzem.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Server Port & Secrets
PORT=5000
JWT_SECRET="your-secure-jwt-secret-key"

# Frontend Application Origins (CORS)
CLIENT_URL="http://localhost:5173"
FRONTEND_URL="http://localhost:5173"

# Cloudinary Storage Credentials (optional demo fallback enabled)
CLOUDINARY_CLOUD_NAME="demo"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="sample_secret"
```

#### Frontend (`/client/.env`)
```env
VITE_API_URL="http://localhost:5000"
VITE_SOCKET_URL="http://localhost:5000"
```

### 4. Push Schema & Seed Initial Restaurant
```bash
cd server
npx prisma db push
npm run seed
cd ..
```
*Seeds **The Spice Kitchen** with 6 tables, 3 categories, and 8 dishes under owner `owner@thespicekitchen.com` (`Password123!`).*

### 5. Start Development Servers
From the repository root:
```bash
# Terminal 1: Backend API & Socket Server (port 5000)
npm run dev:server

# Terminal 2: Frontend Client (port 5173)
npm run dev:client
```

---

## 🧪 Verification & Testing

Run backend integration test suite (tenant isolation, tamper protection, and WebSocket event flow):
```bash
npm run test --workspace=server
```

Run TypeScript and Vite client build validation:
```bash
npm run build:client
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
