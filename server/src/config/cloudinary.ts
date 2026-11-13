import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "123456789012345",
  api_secret: process.env.CLOUDINARY_API_SECRET || "sample_secret",
});

export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder = "dineeze"
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    // If running in development without live Cloudinary keys, provide placeholder
    if (
      !process.env.CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_API_KEY === "your_api_key" ||
      process.env.CLOUDINARY_API_KEY === "123456789012345"
    ) {
      console.warn("⚠️ Using fallback demo image URL (Cloudinary credentials not configured).");
      return resolve({
        secure_url: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80`,
        public_id: `demo_${Date.now()}`,
      });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    stream.end(fileBuffer);
  });
};

export default cloudinary;

