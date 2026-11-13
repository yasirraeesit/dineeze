# Dineeze Foundation & Monorepo Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Dineeze monorepo foundation (`/server` and `/client`), configure dependencies, database schema with Prisma, seed dataset, Tailwind design tokens, and verify that compilation and Prisma validation pass cleanly.

**Architecture:** Monorepo with React 18 + Vite frontend and Node.js + Express backend with Prisma ORM targeting Neon PostgreSQL. Enforces multi-tenant isolation, server-side pricing, Cloudinary asset storage, and a slate/emerald design system.

**Tech Stack:** React, Vite, TypeScript, Tailwind CSS, Zustand, Lucide React, Socket.io (client & server), Express, Prisma, PostgreSQL, Zod, Cloudinary, bcryptjs, jsonwebtoken.

**Spec:** `docs/SPEC.md`

## Global Constraints

- Monorepo with `/client` and `/server` root folders.
- Strict multi-tenant isolation scoped by `restaurantId` and verified via `req.user.id === restaurant.ownerId`.
- Server-side price recalculation from Neon PostgreSQL on `POST /api/orders` (never trust client prices).
- Upload all images to Cloudinary (never Render ephemeral local disk).
- Design system: `#F8FAFC` canvas, `#0F172A` slate sidebar, `#10B981` emerald SaaS accent, `Plus Jakarta Sans` + `Inter`, and `max-w-md mx-auto` mobile-first `/m/:qrToken` customer menu with dynamic `restaurant.accentColor`.
- Scaffolding boundary: Stop after scaffolding and verifying `npm install` and `npx prisma validate` pass cleanly (do not write feature routes or UI screens yet).

## Review Focus

1. Neon PostgreSQL connection strings (`DATABASE_URL` with pooling and `DIRECT_URL` for migrations) must be correctly declared in Prisma schema and `.env.example`.
2. Prisma models must enforce referential integrity with cascading deletes where appropriate (e.g. deleting a restaurant cascades to its categories, dishes, tables, and orders).
3. Tailwind configuration must define custom colors (`canvas`, `sidebar`, `accent`) and font families (`font-sans`, `font-display`).
4. Seed script must be fully self-contained using `tsx` or `ts-node` and populate the exact demo tenant ("The Spice Kitchen"), 6 tables, 3 categories, and 8 dishes.
5. All packages must install without peer-dependency conflicts or broken scripts.

---

### Task 1: Server Configuration & Package Manifest

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/.env.example`

**Interfaces:**
- Produces: Backend build toolchain and dependency declarations (`express`, `@prisma/client`, `socket.io`, `cors`, `dotenv`, `cloudinary`, `jsonwebtoken`, `bcryptjs`, `zod`, `tsx`, `prisma`, `typescript`).

- [ ] **Step 1: Create `server/package.json`**
Define scripts (`dev`, `build`, `start`, `prisma:generate`, `prisma:validate`, `seed`) and dependencies.

- [ ] **Step 2: Create `server/tsconfig.json`**
Configure target `ES2022`, module `NodeNext` or `CommonJS`, strict mode `true`, `esModuleInterop: true`, `skipLibCheck: true`.

- [ ] **Step 3: Create `server/.env.example`**
Include `DATABASE_URL`, `DIRECT_URL`, `PORT=5000`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLIENT_URL=http://localhost:5173`.

---

### Task 2: Prisma Schema Definition

**Files:**
- Create: `server/prisma/schema.prisma`

**Interfaces:**
- Consumes: Database connection environment variables (`DATABASE_URL`, `DIRECT_URL`).
- Produces: PostgreSQL models for `User`, `Restaurant`, `Table`, `Category`, `Dish`, `Order`, `OrderItem`, and status Enums.

- [ ] **Step 1: Define datasource and generator in `server/prisma/schema.prisma`**
Use `provider = "postgresql"` and `generator client { provider = "prisma-client-js" }`.

- [ ] **Step 2: Define Models & Enums**
Define `Role` (`OWNER`, `STAFF`, `ADMIN`), `OrderStatus` (`PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `SERVED`, `COMPLETED`, `CANCELLED`), `PaymentStatus` (`UNPAID`, `PAID`).
Define models with strict relation fields: `User`, `Restaurant`, `Table`, `Category`, `Dish`, `Order`, `OrderItem`.

---

### Task 3: Prisma Seed Script

**Files:**
- Create: `server/prisma/seed.ts`

**Interfaces:**
- Consumes: `@prisma/client`, `bcryptjs`.
- Produces: Executable database seed populating "The Spice Kitchen", Chef Marco owner, 6 tables with QR tokens, 3 categories, and 8 dishes.

- [ ] **Step 1: Implement `server/prisma/seed.ts`**
Create owner user (`owner@thespicekitchen.com`), restaurant ("The Spice Kitchen", `#10B981`), 6 tables with tokens, 3 categories, and 8 dishes matching `docs/SPEC.md`.

---

### Task 4: Client Configuration & Package Manifest

**Files:**
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/tsconfig.node.json`
- Create: `client/vite.config.ts`
- Create: `client/.env.example`

**Interfaces:**
- Produces: Frontend build toolchain with React 18, Vite, TypeScript, Tailwind, Zustand, Lucide React, Socket.io-client, QRCode.react.

- [ ] **Step 1: Create `client/package.json`**
Declare Vite, React, Zustand, Lucide, Socket.io-client, QRCode.react, Tailwind CSS, PostCSS, Autoprefixer.

- [ ] **Step 2: Create `client/tsconfig.json` and `client/tsconfig.node.json`**
Configure strict JSX, DOM types, bundler resolution.

- [ ] **Step 3: Create `client/vite.config.ts` and `client/.env.example`**
Configure `@vitejs/plugin-react` and proxy or client port `5173`. Provide `VITE_API_URL` and `VITE_SOCKET_URL`.

---

### Task 5: Client Styling, Fonts, and Tailwind Design Tokens

**Files:**
- Create: `client/tailwind.config.js`
- Create: `client/postcss.config.js`
- Create: `client/index.html`
- Create: `client/src/index.css`

**Interfaces:**
- Produces: CSS custom properties and utility classes:
  - Canvas: `#F8FAFC`
  - Sidebar: `#0F172A`
  - SaaS Accent: `#10B981`
  - Display font: `Plus Jakarta Sans`
  - Body font: `Inter`

- [ ] **Step 1: Create `client/tailwind.config.js` and `client/postcss.config.js`**
Extend colors (`canvas: '#F8FAFC'`, `sidebar: '#0F172A'`, `accent: '#10B981'`) and fonts.

- [ ] **Step 2: Create `client/index.html`**
Preconnect and load Google Fonts (`Plus Jakarta Sans` and `Inter`). Set page title to "Dineeze | Smart Dining Platform".

- [ ] **Step 3: Create `client/src/index.css`**
Include Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`) and base styling defaults.

---

### Task 6: Client Starter Entrypoint

**Files:**
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/src/vite-env.d.ts`

**Interfaces:**
- Produces: Minimal compile-ready entrypoint rendering placeholder UI with design tokens and icons.

- [ ] **Step 1: Create `client/src/vite-env.d.ts`**
Declare Vite client types.

- [ ] **Step 2: Create `client/src/App.tsx` and `client/src/main.tsx`**
Render a starter placeholder showcasing the design system tokens without building out full feature routes.

---

### Task 7: Root Package Manifest & Workspace Orchestration

**Files:**
- Create: `package.json` (root)
- Create: `.gitignore`

**Interfaces:**
- Produces: Root monorepo workspace scripts: `npm run dev`, `npm run build`, `npm run seed`.

- [ ] **Step 1: Create root `package.json` with npm workspaces (`["client", "server"]`)**
- [ ] **Step 2: Create `.gitignore` for node_modules, dist, .env, etc.**

---

### Task 8: Verification & Validation

**Files:**
- Run: `npm install` in `/server`
- Run: `npx prisma validate` in `/server`
- Run: `npm install` in `/client`
- Run: `npm run build` in `/client`

**Interfaces:**
- Produces: Verified clean installation and Prisma schema validation without warnings or errors.

- [ ] **Step 1: Install server dependencies and validate Prisma schema**
- [ ] **Step 2: Install client dependencies and verify build**
- [ ] **Step 3: Confirm no feature routes or UI screens were implemented ahead of plan**

