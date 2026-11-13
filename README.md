# Dineeze — Dining Made Effortless.

<p align="center">
  <strong>The Next-Generation Contactless Ordering & Real-Time Kitchen Display OS for Modern Hospitality.</strong>
  <br />
  Turn any customer smartphone into a branded ordering terminal and any kitchen screen into an intelligent, low-latency dispatch display.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production_Ready-10B981?style=for-the-badge&logo=statuspage&logoColor=white" alt="Production Ready" />
  <img src="https://img.shields.io/badge/Architecture-Multi--Tenant_SaaS-0F172A?style=for-the-badge" alt="Multi-Tenant SaaS" />
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
| **Kitchen KDS & Admin** | [dineeze.vercel.app/login](https://dineeze.vercel.app/login) | Restaurant Operator | **Email:** `owner@thespicekitchen.com`<br />**Password:** `Password123!` |
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

---

## 🚀 Core Product Capabilities

```
+-----------------------------------------------------------------------------------+
|                                 DINEEZE PLATFORM                                  |
+-----------------------------------------------------------------------------------+
|  [Guest Smartphone]           [Operator Dashboard]           [Kitchen Display]    |
|   - Zero-App Browser Menu      - 2-Min Onboarding             - Live Kanban Board |
|   - Real-Time Cart             - Brand Accent Studio          - Web Audio Chimes  |
|   - Live Prep Tracker          - In-Stock Toggle Sync         - Urgency Timers    |
|   - Dietary Badges             - Canvas QR Tent Generator     - Room Partitioning |
+-----------------------------------------------------------------------------------+
```

### 1. Merchant Onboarding & Brand Studio
- **120-Second Onboarding**: Provision full restaurant tenants with custom subdomain slugs (`/m/:slug`), local currency formats, and automated table generation.
- **Dynamic Theme Engine**: Injects merchant brand palette into mobile guest views via CSS variables (`--tenant-accent`), ensuring on-brand digital presence.
- **Enterprise Media Pipeline**: Direct-to-Cloudinary memory streaming for high-resolution dish photography, covers, and brand assets.

### 2. Live Kitchen Display System (KDS)
- **Real-Time Kanban Pipeline**: Orders transition fluidly through operational lifecycle states: `PENDING` ➔ `PREPARING` ➔ `READY` ➔ `SERVED`.
- **Synthesized Audio Chimes**: Dual-frequency harmonic audio cues sound instantly through browser Web Audio upon order arrival, eliminating missed tickets.
- **Elapsed Urgency Timers**: Visual warning indicators flag aging orders to enforce table turn and service speed SLA targets.

### 3. Print-Ready Table-Tent QR Generator
- **HTML5 Canvas Vector Generator**: Dynamically generates high-resolution vector QR table tents embedded with individual table tokens and guest Wi-Fi details.
- **Instant Token Rotation**: Revoke or re-generate specific table access credentials in one click to manage dining room security.

### 4. Zero-Login Guest Experience (`/m/:qrToken`)
- **Frictionless Web Architecture**: 100% web-native, responsive layout optimized for single-handed mobile navigation with touch targets exceeding 44×44px.
- **Instant Sold-Out Synchronization**: Real-time availability toggles prevent guests from ordering 86'd items.
- **Live Status Feed**: Diners monitor their ticket progress live over dedicated WebSocket channels without page reloads.

---

## 🏛️ System Architecture & Security Model

```mermaid
flowchart TD
    subgraph Clients["Client Surfaces"]
        Guest["Guest Smartphone\n(/m/:qrToken)\nZero-Login Web Client"]
        Staff["Kitchen / Operator\n(/dashboard)\nKDS Kanban & Admin"]
    end

    subgraph Edge["Vercel Global Edge"]
        Frontend["Dineeze React SPA\n- Vite + TypeScript\n- Tailwind CSS Architecture\n- Zustand State Hydration"]
    end

    subgraph Core["Render Web Service Cluster"]
        API["Node.js & Express REST API\n- Strict Multi-Tenant Enforcement\n- Server-Side Price Calculation"]
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
    Edge -->|REST API| API
    Edge <-->|WebSocket Stream| Sockets
    API -->|Prisma Client| DB
    API -->|Buffer Stream| CDN
```

### Security & Reliability Architecture
- **Strict Multi-Tenant Isolation**: Every database record (`Table`, `Category`, `Dish`, `Order`, `OrderItem`) is strictly scoped by `restaurantId`. API middleware strictly enforces tenant ownership (`restaurant.ownerId === req.user.id`).
- **Tamper-Proof Server-Side Price Recalculation**: Incoming payloads on `POST /api/orders` specify dish IDs and quantities only. The server queries live prices directly from Neon PostgreSQL inside an interactive Prisma transaction, completely mitigating client-side price tampering.
- **Zero Ephemeral Storage Loss**: Deployed on serverless and ephemeral container architectures. Uploads bypass local disk and stream through memory buffers into Cloudinary CDN.
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

### 3. Database Migration & Seeding
```bash
cd server
npx prisma db push
npm run seed
cd ..
```
*Seeds the database with **The Spice Kitchen**, 6 provisioned tables, 3 categories, and 8 artisan dishes under operator `owner@thespicekitchen.com`.*

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

## 🗺️ Product Roadmap

- [ ] **Hardware Bridge**: Direct ESC/POS thermal receipt and kitchen ticket printer forwarding over local network.
- [ ] **Split-Table Billing**: Native guest payment splitting (equal split, by-item, or custom amounts) with Stripe Terminal & Apple Pay.
- [ ] **Multi-Branch Analytics**: Centralized hospitality group metrics (table turn speed, gross order value, peak item sales velocity).
- [ ] **Automated Guest Messaging**: WhatsApp and SMS order status alerts when food leaves the kitchen pass.
- [ ] **Offline POS Fallback**: Local SQLite cache sync for uninterrupted ordering during internet dropouts.

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
