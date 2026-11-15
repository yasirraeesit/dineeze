import express, { Request, Response, NextFunction } from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// Import routes
import authRoutes from "./routes/auth";
import restaurantRoutes from "./routes/restaurants";
import menuRoutes from "./routes/menu";
import tableRoutes from "./routes/tables";
import uploadRoutes from "./routes/upload";
import publicRoutes from "./routes/public";
import orderRoutes from "./routes/orders";
import analyticsRoutes from "./routes/analytics";
import staffRoutes from "./routes/staff";

export const app = express();
export const server = http.createServer(app);

// Allowed Frontend Origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean) as string[];

// Configure CORS
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or listed origins
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in development, can restrict in strict prod
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Socket.io Server
export const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

// Singleton accessor for Socket.io
export const getIO = (): SocketIOServer => {
  return io;
};

// Real-Time Socket Connection Handlers
io.on("connection", (socket) => {
  // Join restaurant kitchen display / dashboard room
  socket.on("join_restaurant", (restaurantId: string) => {
    if (restaurantId) {
      socket.join(`restaurant_${restaurantId}`);
    }
  });

  // Leave restaurant room
  socket.on("leave_restaurant", (restaurantId: string) => {
    if (restaurantId) {
      socket.leave(`restaurant_${restaurantId}`);
    }
  });

  // Join public order tracking room (Customer mobile app)
  socket.on("join_order", (orderId: string) => {
    if (orderId) {
      socket.join(`order_${orderId}`);
    }
  });

  // Leave order tracking room
  socket.on("leave_order", (orderId: string) => {
    if (orderId) {
      socket.leave(`order_${orderId}`);
    }
  });

  socket.on("disconnect", () => {
    // Clean disconnection
  });
});

// 1. Health check endpoint for Render cron pings
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 2. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);

// Public Customer Menu & Ordering Routes (NO auth middleware)
app.use("/api/public/menu", publicRoutes);
app.use("/api/menu", publicRoutes); // Public QR token menu endpoint: GET /api/menu/:qrToken
app.use("/api/menu", menuRoutes);   // Protected owner menu management: /api/menu/categories, /api/menu/items

app.use("/api/tables", tableRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/staff", staffRoutes);

// 3. Centralized 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// 4. Centralized Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ error: message });
});

