---
trigger: always_on
---

# Dineeze Architecture & Non-Negotiable Rules

This document outlines the core architecture and non-negotiable engineering rules for Dineeze. Every agent, developer, and feature implementation must strictly adhere to these principles.

## 1. Monorepo Structure
The repository is organized as a monorepo consisting of two primary packages:
- `/client`: Frontend built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and **Zustand** for state management.
- `/server`: Backend API and real-time engine built with **Node.js**, **Express**, **TypeScript**, **Prisma ORM** (targeting Neon PostgreSQL), and **Socket.io** for real-time order notifications.

No additional sub-apps or nested repositories should be created outside this standard `/client` and `/server` convention.

## 2. Strict Multi-Tenant Isolation
Dineeze is a multi-tenant platform where each restaurant's data is strictly partitioned.
- Every tenant resource (Categories, Dishes, Tables, Orders, Staff) **must** be scoped by `restaurantId`.
- Any authenticated mutation or access to restaurant-owned data **must** verify that the operating user is authorized:
  ```typescript
  if (restaurant.ownerId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden: Access denied to this restaurant" });
  }
  ```
- Cross-tenant queries without explicit `restaurantId` filtering in Prisma queries are strictly prohibited.

## 3. Server-Side Price & Total Recalculation
Never trust client prices on order creation:
- On `POST /api/orders`, the incoming payload provides dish IDs, quantities, table information, and optional notes.
- The server **must fetch live dish prices directly from Neon PostgreSQL via Prisma** and compute the subtotal and total server-side.
- Any client-submitted `price`, `unitPrice`, or `totalAmount` in the request body must be ignored or rejected to eliminate client-side price tampering.

## 4. Cloudinary Image Storage
- Render deploys web services with ephemeral local file storage; files saved to disk are destroyed upon restarts or redeployments.
- **All uploaded images** (restaurant logos, banners, dish photos) must be streamed/uploaded directly to **Cloudinary** using the Cloudinary Node SDK.
- Only store the returned secure HTTPS URLs in PostgreSQL. Never write uploads to local disk directories.

## 5. Design System & Customer Mobile Menu
All UI surfaces must adhere to the Dineeze design system:
- **Canvas / Background**: `#F8FAFC` (slate-50)
- **Navigation / Sidebar**: `#0F172A` (slate-900)
- **SaaS Accent**: `#10B981` (emerald-500)
- **Typography**:
  - Headings / Display: `Plus Jakarta Sans`
  - Body / UI: `Inter`
- **Customer Mobile Menu (`/m/:qrToken`)**:
  - Mobile-first layout locked to `max-w-md mx-auto` container with high-density touch targets and sticky bottom cart action.
  - Dynamically themed with each tenant's custom `restaurant.accentColor` (falling back to emerald `#10B981`).

