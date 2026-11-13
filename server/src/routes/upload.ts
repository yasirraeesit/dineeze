import { Router, Request, Response } from "express";
import multer from "multer";
import { uploadToCloudinary } from "../config/cloudinary";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();
router.use(authenticateJWT);

// Configure multer with memory storage (ZERO local disk writes)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.post("/", upload.single("image"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  const folder = (req.body.folder as string) || "dineeze";

  try {
    const result = await uploadToCloudinary(req.file.buffer, folder);
    return res.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
  }
});

export default router;

