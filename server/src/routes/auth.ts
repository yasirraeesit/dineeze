import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../prisma";
import { authenticateJWT } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dineeze-super-secret-jwt-key-2026";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const staffLoginSchema = z.object({
  restaurantIdentifier: z.string().min(1, "Restaurant slug or ID is required").optional(),
  restaurantSlug: z.string().optional(),
  restaurantId: z.string().optional(),
  email: z.string().email("Valid staff email is required"),
  pinOrPassword: z.string().min(4, "PIN or password is required"),
});

router.post("/register", validateBody(registerSchema), async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  try {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: "OWNER",
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

router.post("/login", validateBody(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        restaurants: {
          select: {
            id: true,
            name: true,
            slug: true,
            accentColor: true,
            currency: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      restaurants: user.restaurants,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Failed to log in" });
  }
});

router.post("/staff-login", validateBody(staffLoginSchema), async (req: Request, res: Response) => {
  const { email, pinOrPassword } = req.body;
  const identifier = req.body.restaurantIdentifier || req.body.restaurantSlug || req.body.restaurantId;

  if (!identifier) {
    return res.status(400).json({ error: "Restaurant slug or ID is required" });
  }

  try {
    // 1. Locate restaurant branch
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier.toLowerCase() },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        currency: true,
        accentColor: true,
        logoUrl: true,
        isActive: true,
      },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant branch not found" });
    }

    if (!restaurant.isActive) {
      return res.status(403).json({ error: "This restaurant branch is currently inactive" });
    }

    // 2. Locate staff member in this restaurant
    const staff = await prisma.staffMember.findFirst({
      where: {
        restaurantId: restaurant.id,
        email: email.toLowerCase(),
      },
    });

    if (!staff) {
      return res.status(401).json({ error: "Invalid staff credentials or account does not exist" });
    }

    if (!staff.isActive) {
      return res.status(403).json({ error: "Your staff account has been deactivated. Please contact your manager." });
    }

    // 3. Verify PIN or Password
    const isValid = await bcrypt.compare(pinOrPassword, staff.pinOrPasswordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid staff credentials" });
    }

    // 4. Issue scoped JWT
    const token = jwt.sign(
      {
        id: staff.id,
        staffId: staff.id,
        email: staff.email,
        role: staff.role,
        isStaff: true,
        restaurantId: restaurant.id,
        actorName: staff.name,
        actorRole: staff.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantSlug: restaurant.slug,
      },
      restaurant,
    });
  } catch (error) {
    console.error("Staff login error:", error);
    return res.status(500).json({ error: "Failed to log in staff member" });
  }
});

router.get("/me", authenticateJWT, async (req: Request, res: Response) => {
  try {
    // If authenticated via staff JWT
    if (req.user!.isStaff) {
      const staff = await prisma.staffMember.findUnique({
        where: { id: req.user!.id },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
              accentColor: true,
              currency: true,
              logoUrl: true,
            },
          },
        },
      });

      if (!staff || !staff.isActive) {
        return res.status(401).json({ error: "Staff member session expired or account deactivated" });
      }

      return res.json({
        user: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          isStaff: true,
          restaurantId: staff.restaurantId,
          restaurants: [staff.restaurant],
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        restaurants: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    console.error("Auth me error:", error);
    return res.status(500).json({ error: "Failed to fetch session" });
  }
});

export default router;

