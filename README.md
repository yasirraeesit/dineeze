# Dineeze 🍽️

> Modern multi-tenant contactless QR dining & real-time Kitchen Display System (KDS) platform built with React, Node.js, Socket.io, and Neon PostgreSQL.

---

## 🌐 Live Deployments

| Component | Platform | URL | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | Vercel | [https://dineeze.vercel.app](https://dineeze.vercel.app) | Production |
| **Backend API & WebSockets** | Render | [https://dineeze-backend.onrender.com](https://dineeze-backend.onrender.com) | Production |
| **Database** | Neon | Serverless PostgreSQL (AWS us-east-2) | Production |

### 🔑 Demo Account
- **Dashboard Login**: [https://dineeze.vercel.app/login](https://dineeze.vercel.app/login)
- **Email**: `owner@thespicekitchen.com`
- **Password**: `Password123!`
- **Sample Mobile QR Menu**: [https://dineeze.vercel.app/m/table-1-spice-kitchen](https://dineeze.vercel.app/m/table-1-spice-kitchen)

---

## 🏗️ Architecture & Core Rules

Dineeze is structured as an npm monorepo with two core packages:

- `/client`: Frontend single-page app built with React 18, Vite, TypeScript, Tailwind CSS, and Zustand.
- `/server`: Backend REST API and WebSocket engine built with Node.js, Express, TypeScript, Prisma ORM, and Socket.io.

### Non-Negotiable System Principles

1. **Strict Multi-Tenant Isolation**: Every database resource (tables, categories, dishes, orders) is scoped by `restaurantId`. Cross-tenant mutations verify that `restaurant.ownerId === req.user.id`.
2. **Server-Side Price Recalculation**: `POST /api/orders` ignores client-submitted prices and re-fetches verified item prices from Neon PostgreSQL to calculate subtotals and totals.
3. **Cloudinary Media Streaming**: Uploads stream through memory buffers to Cloudinary CDN to prevent ephemeral disk loss on serverless runtimes.
4. **Design System Tokens**: Canvas background (`#F8FAFC`), dark slate navigation (`#0F172A`), and emerald accent (`#10B981`) with tenant dynamic theme overrides.

---

## 🚀 Features

- **Contactless Mobile Menu**: Zero app downloads required; guests scan table QR codes to view dishes, customize modifiers, and submit orders.
- **Real-Time Kitchen Display System (KDS)**: Low-latency Socket.io room broadcasts with Web Audio alerts for incoming orders and prep status transitions (`PENDING` ➔ `PREPARING` ➔ `READY`).
- **Table QR Tent Generator**: Printable SVG and PDF table markers with embedded tenant branding and table tokens.
- **Menu Builder**: Fast in-stock toggling, category sorting, price configurations, and image uploads.
- **Custom Brand Theming**: Dynamic primary accent color picker with live phone preview.

---

## 💻 Local Development

### Prerequisites
- Node.js 20+
- npm 10+
- A Neon PostgreSQL project connection string

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yasirraeesit/dineeze.git
   cd dineeze
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in `/server`:
   ```env
   DATABASE_URL="your-neon-pooled-connection-string"
   DIRECT_URL="your-neon-unpooled-connection-string"
   PORT=5000
   JWT_SECRET="your-secure-jwt-secret"
   CLIENT_URL="http://localhost:5173"
   FRONTEND_URL="http://localhost:5173"
   CLOUDINARY_CLOUD_NAME="demo"
   CLOUDINARY_API_KEY="123456789012345"
   CLOUDINARY_API_SECRET="sample_secret"
   ```

   Create a `.env` file in `/client`:
   ```env
   VITE_API_URL="http://localhost:5000"
   VITE_SOCKET_URL="http://localhost:5000"
   ```

4. **Initialize Database Schema & Seed Data**:
   ```bash
   cd server
   npx prisma db push
   npm run seed
   cd ..
   ```

5. **Start Development Servers**:
   ```bash
   npm run dev:server
   npm run dev:client
   ```

---

## 🧪 Testing

Run backend automated integration tests:
```bash
npm run test --workspace=server
```

Verify client production build:
```bash
npm run build:client
```
