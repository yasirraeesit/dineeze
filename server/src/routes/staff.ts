import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../prisma";
import { authenticateJWT, verifyRestaurantOwner } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.use(authenticateJWT);

const createStaffSchema = z.object({
  restaurantId: z.string().min(1, "Restaurant ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email is required"),
  pinOrPassword: z.string().min(4, "PIN or password must be at least 4 characters"),
  role: z.enum(["MANAGER", "KITCHEN", "WAITER"]).default("WAITER"),
});

const updateStaffStatusSchema = z.object({
  isActive: z.boolean(),
});

// List staff members for a restaurant
router.get("/", verifyRestaurantOwner, async (req: Request, res: Response) => {
  const restaurantId = req.query.restaurantId as string;

  try {
    const staff = await prisma.staffMember.findMany({
      where: { restaurantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        restaurantId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ staff });
  } catch (error) {
    console.error("List staff error:", error);
    return res.status(500).json({ error: "Failed to list staff members" });
  }
});

// Create/Invite a new staff member (Owner only)
router.post("/", verifyRestaurantOwner, validateBody(createStaffSchema), async (req: Request, res: Response) => {
  // Only owners can provision staff
  if (req.user!.isStaff) {
    return res.status(403).json({ error: "Forbidden: Only restaurant owners can manage staff members" });
  }

  const { restaurantId, name, email, pinOrPassword, role } = req.body;

  try {
    const existing = await prisma.staffMember.findFirst({
      where: {
        restaurantId,
        email: email.toLowerCase(),
      },
    });

    if (existing) {
      return res.status(409).json({ error: "A staff member with this email already exists in this restaurant" });
    }

    const pinOrPasswordHash = await bcrypt.hash(pinOrPassword, 10);

    const staff = await prisma.staffMember.create({
      data: {
        restaurantId,
        name,
        email: email.toLowerCase(),
        pinOrPasswordHash,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        restaurantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({ staff, message: "Staff member added successfully" });
  } catch (error) {
    console.error("Create staff error:", error);
    return res.status(500).json({ error: "Failed to create staff member" });
  }
});

// Toggle staff active/inactive status
router.patch("/:id/status", validateBody(updateStaffStatusSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const staff = await prisma.staffMember.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Verify owner authorization
    if (req.user!.isStaff || staff.restaurant.ownerId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden: Only restaurant owners can update staff status" });
    }

    const updated = await prisma.staffMember.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        restaurantId: true,
        updatedAt: true,
      },
    });

    return res.json({ staff: updated, message: `Staff member marked ${isActive ? "active" : "inactive"}` });
  } catch (error) {
    console.error("Update staff status error:", error);
    return res.status(500).json({ error: "Failed to update staff status" });
  }
});

// Delete a staff member
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const staff = await prisma.staffMember.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Verify owner authorization
    if (req.user!.isStaff || staff.restaurant.ownerId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden: Only restaurant owners can remove staff members" });
    }

    await prisma.staffMember.delete({
      where: { id },
    });

    return res.json({ message: "Staff member removed successfully" });
  } catch (error) {
    console.error("Delete staff error:", error);
    return res.status(500).json({ error: "Failed to delete staff member" });
  }
});

export default router;

