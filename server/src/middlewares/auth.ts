import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  isStaff?: boolean;
  staffId?: string;
  restaurantId?: string;
  actorName?: string;
  actorRole?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "dineeze-super-secret-jwt-key-2026";

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
  }
};

/**
 * Strict Multi-Tenant Isolation Middleware:
 * Verifies that the authenticated user owns or is authorized staff for the requested restaurant.
 */
export const verifyRestaurantOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
  }

  const restaurantId =
    req.params.restaurantId ||
    req.params.id ||
    req.body.restaurantId ||
    (req.query.restaurantId as string);

  if (!restaurantId) {
    return res.status(400).json({ error: "Bad Request: restaurantId parameter is required" });
  }

  try {
    // If authenticated via Staff JWT
    if (req.user.isStaff) {
      if (req.user.restaurantId !== restaurantId) {
        return res.status(403).json({
          error: "Forbidden: Access denied to this restaurant. Multi-tenant violation.",
        });
      }
      return next();
    }

    // Owner JWT: verify ownership of the restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    if (restaurant.ownerId !== req.user.id) {
      return res.status(403).json({
        error: "Forbidden: Access denied to this restaurant. Multi-tenant violation.",
      });
    }

    next();
  } catch (error) {
    console.error("verifyRestaurantOwner error:", error);
    return res.status(500).json({ error: "Internal server error verifying tenant access" });
  }
};

/**
 * Role-Based Access Control Middleware:
 * Ensures the authenticated user or staff member has one of the allowed roles.
 * System owners are always permitted.
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: User not authenticated" });
    }

    // System owners have blanket access across all owner capabilities
    if (!req.user.isStaff && req.user.role === "OWNER") {
      return next();
    }

    // Staff member role verification
    if (req.user.isStaff && allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: `Forbidden: Role '${req.user.role}' is not authorized for this resource`,
    });
  };
};

