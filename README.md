# Dineeze — Dining Made Effortless.

<p align="center">
  <strong>The Next-Generation Contactless Ordering, Live Table Floor OS & Real-Time Kitchen Display System for Modern Hospitality.</strong>
  <br />
  Turn any customer smartphone into a branded ordering terminal, any tablet into a live interactive Kitchen Display System (KDS), and any counter into a real-time table floor and billing station.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Release-v2.0_Production_Ready-10B981?style=for-the-badge&logo=statuspage&logoColor=white" alt="v2.0 Production Ready" />
  <img src="https://img.shields.io/badge/Architecture-Multi--Tenant_Multi--Branch_SaaS-0F172A?style=for-the-badge" alt="Multi-Tenant SaaS" />
  <img src="https://img.shields.io/badge/Real--Time-Socket.io_KDS-3B82F6?style=for-the-badge&logo=socket.io&logoColor=white" alt="Real-Time KDS" />
  <img src="https://img.shields.io/badge/Database-Neon_Serverless_Postgres-00E599?style=for-the-badge&logo=postgresql&logoColor=white" alt="Neon PostgreSQL" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript_5-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js_20+-43853D?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express_4-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma_ORM_5-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Cloudinary_CDN-3448C5?style=flat-square&logo=cloudinary&logoColor=white" alt="Cloudinary" />
</p>

---

## 🌐 Live Product Access & Enterprise Demos

Dineeze is deployed globally across low-latency edge networks. Test the live production environment directly:

| Surface | Live Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| **SaaS Web Application** | [dineeze.vercel.app](https://dineeze.vercel.app) | Public / Operator | Merchant onboarding, brand studio, and product landing |
| **Live Guest Menu Demo** | [dineeze.vercel.app/m/table-1-spice-kitchen](https://dineeze.vercel.app/m/table-1-spice-kitchen) | Dining Guest | Zero-login self-ordering demo (Table 01 — *The Spice Kitchen*) |
| **Restaurant Admin & KDS** | [dineeze.vercel.app/login](https://dineeze.vercel.app/login) | Restaurant Owner | **Email:** `owner@thespicekitchen.com`<br />**Password:** `Password123!` |
| **Staff Station Portal** | [dineeze.vercel.app/staff-login](https://dineeze.vercel.app/staff-login) | Kitchen / Waiter Staff | Low-friction station access via venue slug & station PIN |
| **API Health Status** | [dineeze-backend.onrender.com/health](https://dineeze-backend.onrender.com/health) | System Monitor | Live API latency, database connectivity, and WebSocket engine |

---

## 💡 The Problem & The Solution

Traditional dine-in operations bleed margin through three structural friction points:

1. **Reprint Costs & Out-of-Stock Disasters**: Physical menus cost thousands annually to print, clean, and replace. When dishes sell out mid-shift, waitstaff waste time explaining omissions at the table.
2. **App Store & Sign-Up Friction**: Requiring diners to download 80 MB mobile apps or create accounts before ordering results in high abandonment and customer dissatisfaction.
3. **Staff Bottlenecks & Order Transcription Errors**: Hand-written paper tickets and waiter transit delays throttle kitchen throughput, slowing down table turns during peak hours.

### The Dineeze Solution
Dineeze transforms restaurant operations into a frictionless, hardware-agnostic digital workflow:
- **Instant Camera Scan**: Diners point their standard smartphone camera at an acrylic table tent to open a high-speed web application in under 400 milliseconds.
- **Dynamic Brand Autonomy**: Every restaurant features distinct logo branding, accent colors, menu categories, and dietary flags without custom app store builds.
- **Bi-Directional Kitchen Sync**: Orders beam directly into an interactive Kitchen Display System (KDS) board with synthesized audio bells, while guests track live preparation states in real time.
- **Full Operational Lifecycle**: Encompasses kitchen ticket preparation, dining room floor occupancy, split-bill settlement, multi-branch management, and executive analytics.

---

## 🚀 Core Product Capabilities (V2 Platform)

```
+---------------------------------------------------------------------------------------------------------+
|                                            DINEEZE V2 OS                                                |
+---------------------------------------------------------------------------------------------------------+
|  [Guest Smartphone]        [Kitchen Display (KDS)]       [Floor & Billing]         [Executive Admin]    |
|   - Zero-App Browser Menu   - Real-Time Kanban Board      - Live Table Status Grid  - Multi-Branch Studio|
|   - Smart Cart Upsells      - Kitchen Dark Mode           - Split-Bill Calculator   - Staff RBAC Roster  |
|   - Dynamic Wait Estimates  - Space/Enter Shortcuts       - Cash/Card Settlement    - 30-Day Analytics   |
|   - Live Order Tracker      - Dish Prep Item Checkboxes   - Unpaid Balance Totals   - Order Audit Log    |
|   - 1-5★ Guest Feedback     - Dual-Tone Audio Chimes      - Elapsed Dining Timers   - Multi-Currency     |
+---------------------------------------------------------------------------------------------------------+
```

### 1. Live Kitchen Display System (KDS)
- **Real-Time Kanban Pipeline**: Orders transition fluidly through operational lifecycle states: `PENDING` ➔ `PREPARING` ➔ `READY` ➔ `SERVED`.
- **Kitchen Dark Mode**: High-contrast `#090D16` deep slate canvas designed specifically for low-light, high-heat kitchen environments with state persistence.
- **Ergonomic Keyboard Shortcuts**: `Space` accepts the oldest pending ticket (`PENDING` ➔ `PREPARING`); `Enter` marks the active ticket as ready (`PREPARING` ➔ `READY`).
- **Item-Level Preparation Tracking**: Checkboxes on individual ticket items allow line cooks to mark components prepared as they clear the grill or station.
- **Dual-Tone Synthesized Audio Chimes**: Web Audio API generates distinct frequency harmonic alerts on ticket updates without reliance on external audio files.

### 2. Live Dining Room Floor Board & Bill Settlement (`/dashboard/floor`)
- **Real-Time Occupancy Grid**: Visual map of all restaurant tables displaying real-time floor states: `AVAILABLE`, `WAITING_FOOD`, `READY_TO_SERVE`, or `BILL_PENDING`.
- **Elapsed Table & Meal Timers**: Displays exact elapsed minutes since seating to identify slow kitchen throughput and optimize table turn velocity.
- **Interactive Split-Bill Calculator**: Built-in payment settlement modal calculating equal splits for 1 to 20 guests, complete with tip recommendations (`10%`, `15%`, `20%`) and per-person breakdowns.
- **Payment Method Recording**: Tracks settlement type (`CASH`, `CARD`, `ONLINE`), auto-transitions served orders to `COMPLETED`, and immediately frees tables.

### 3. Executive Performance Analytics (`/dashboard/analytics`)
- **Comprehensive KPI Strip**: Total Gross Revenue, Net Order Volume, Average Order Value (AOV), Average Customer Rating, and Sold-Out Menu count.
- **Daily Volume & Revenue Trends**: Interactive 7-day and 30-day time-series visualizations with daily averages and peak revenue indicators.
- **24-Hour Peak Ordering Heatmap**: Hourly order volume histogram identifying lunch and dinner rushes for staff scheduling optimization.
- **Menu Sales Velocity Leaderboard**: Ranked top 5 best-selling dishes with unit sales volume and revenue contributions.

### 4. Multi-Branch Operations & 1-Click Menu Cloning
- **Branch Switcher**: Seamlessly switch between multiple restaurant branches from the dark slate sidebar.
- **Instant Menu Cloning**: Provision new branches with automated menu duplication—copying all categories, dishes, prices, and preparation times into the new location within an atomic database transaction.
- **Multi-Currency Engine**: Full support for `USD` ($), `PKR` (Rs.), `INR` (₹), and `GBP` (£) with localized decimal and comma formatting across all customer and operator touchpoints.

### 5. Staff Role-Based Access Control (RBAC) & Audit Log (`/dashboard/team`)
- **Station Roles**: Scoped operational profiles for `KITCHEN` (KDS only), `WAITER` (Floor Board & Billing), `MANAGER` (Operations & Analytics), and `OWNER` (Full platform access).
- **Dedicated Staff Portal (`/staff-login`)**: Streamlined login allowing staff to access their station using their venue slug and 4-digit PIN.
- **Chronological Order Audit Feed**: Immutable event log tracking every order status transition, item prep toggle, cancellation (with required void reason), and payment settlement with operator attribution.

### 6. Frictionless Guest Experience & Smart Cart Upsells (`/m/:qrToken`)
- **Zero-Login Web Application**: Runs instantly in any mobile browser without app downloads or account creation.
- **Dynamic Smart Wait Estimates**: Accurately computes wait times based on dish prep times combined with live kitchen queue load.
- **"Pairs Well With Your Order" Upsell Carousel**: Historical co-occurrence recommendation engine suggesting high-margin drinks, sides, and desserts inside the slide-up cart drawer with 1-tap add actions.
- **Post-Meal Guest Feedback**: Post-service 1–5 star rating and optional comments feeding directly into restaurant analytics.

---

## 🏛️ System Architecture & Security Model

```mermaid
flowchart TD
    subgraph Clients["Client Surfaces"]
        Guest["Guest Smartphone\n(/m/:qrToken)\nZero-Login Web Client"]
        Staff["Staff Station Portal\n(/staff-login)\nKitchen / Waiter View"]
        Owner["Owner Dashboard\n(/dashboard/*)\nMulti-Branch OS"]
    end

    subgraph Edge["Vercel Global Edge"]
        Frontend["Dineeze React SPA\n- Vite + TypeScript\n- Tailwind CSS Architecture\n- Zustand State Hydration"]
    end

    subgraph Core["Render Web Service Cluster"]
        API["Node.js & Express REST API\n- Strict Multi-Tenant Enforcement\n- Server-Side Price Calculation\n- Scoped Staff RBAC"]
        Sockets["Socket.io Real-Time Engine\n- restaurant_{id} (Kitchen Broadcast)\n- order_{id} (Guest Status Sync)"]
    end

    subgraph Data["Neon Cloud Database"]
        DB[("Neon Lakebase PostgreSQL\n- Pooled Connection (Runtime)\n- Direct Connection (Migrations)\n- Foreign Key Isolation")]
    end

    subgraph Storage["Cloudinary Media CDN"]
        CDN["Cloudinary Media Storage\n- Zero Ephemeral Disk Writes\n- Direct Memory Buffer Streaming"]
    end

    Guest -->|HTTPS / WSS| Edge
    Staff -->|HTTPS / WSS| Edge
    Owner -->|HTTPS / WSS| Edge
    Edge -->|REST API| API
    Edge <-->|WebSocket Stream| Sockets
    API -->|Prisma Client| DB
    API -->|Buffer Stream| CDN
```

### Security & Reliability Architecture
- **Strict Multi-Tenant Isolation**: Every database resource (`Table`, `Category`, `Dish`, `Order`, `OrderItem`, `StaffMember`, `OrderAuditLog`) is strictly scoped by `restaurantId`. API middleware strictly enforces tenant ownership (`restaurant.ownerId === req.user.id` or matching staff credentials).
- **Tamper-Proof Server-Side Price Recalculation**: Incoming payloads on `POST /api/orders` specify dish IDs and quantities only. The server queries live prices directly from Neon PostgreSQL inside an interactive Prisma transaction, completely mitigating client-side price tampering.
- **Zero Ephemeral Storage Loss**: Deployed on serverless and ephemeral container architectures. Uploads bypass local disk and stream through memory buffers directly into Cloudinary CDN.
- **Cryptographic Table Access**: Table identification relies on opaque, collision-resistant tokens (`qrToken`) rather than auto-incrementing database identifiers.

---

## 💻 Self-Hosting & Environment Configuration

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **Database**: PostgreSQL 15+ (Hosted via Neon or self-managed)

### 1. Repository Setup
```bash
git clone https://github.com/yasirraeesit/dineeze.git
cd dineeze
npm install
```

### 2. Environment Configuration

#### Backend Service (`/server/.env`)
| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | Neon pooled PostgreSQL connection string | `postgresql://user:pass@ep-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | **Yes** | Neon unpooled PostgreSQL direct connection (DDL & migrations) | `postgresql://user:pass@ep-direct.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `PORT` | No | Express API server port | `5000` (Local) / `10000` (Render) |
| `JWT_SECRET` | **Yes** | Cryptographic key for signing operator access tokens | `your-secure-jwt-secret-key-32-chars` |
| `CLIENT_URL` | **Yes** | Primary frontend origin for CORS policies | `http://localhost:5173` |
| `FRONTEND_URL` | No | Secondary production origin for CORS allowlist | `https://dineeze.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud account identifier | `demo` *(fallback enabled)* |
| `CLOUDINARY_API_KEY` | No | Cloudinary API access key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API access secret | `sample_secret` |

#### Frontend Service (`/client/.env`)
| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | **Yes** | Base endpoint for Dineeze REST API | `http://localhost:5000` (Local) / `https://dineeze-backend.onrender.com` |
| `VITE_SOCKET_URL` | **Yes** | WebSocket endpoint for Socket.io real-time engine | `http://localhost:5000` (Local) / `https://dineeze-backend.onrender.com` |

### 3. Database Migration & Automated Tests
```bash
cd server
npx prisma db push
npm run seed
npm test
cd ..
```
*Executes the 10-step automated integration test suite validating cross-tenant isolation, price calculation, real-time WebSockets, public QR endpoints, wait time calculation, floor management, staff RBAC, and smart upsells.*

### 4. Running the Development Monorepo
```bash
# Terminal 1: Backend API & WebSocket Engine (Port 5000)
npm run dev:server

# Terminal 2: Vite Frontend SPA (Port 5173)
npm run dev:client
```

### 5. Production Compilation
```bash
# Validate and build full monorepo
npm run build:server
npm run build:client
```

---

## 🤝 Commercial & Support

For enterprise deployments, custom PMS/POS integrations, or hospitality partnership inquiries:

- **Product Inquiries**: [support@dineeze.com](mailto:support@dineeze.com)
- **Live Status & Issues**: [GitHub Issues](https://github.com/yasirraeesit/dineeze/issues)
- **Demo Platform**: [https://dineeze.vercel.app](https://dineeze.vercel.app)

---

<p align="center">
  <sub>© 2026 Dineeze Inc. Built with modern engineering for the global hospitality industry.</sub>
</p>
