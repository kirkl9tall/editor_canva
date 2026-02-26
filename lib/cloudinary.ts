import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadToCloudinary(
  buffer: Buffer,
  format: string = "png"
): Promise<string> {
  // Fallback: return base64 data URL when Cloudinary is not configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    const mime = format === "pdf" ? "application/pdf" : `image/${format}`
    return `data:${mime};base64,${buffer.toString("base64")}`
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "generated-images", format, resource_type: "auto" },
      (error, result) => {
        if (error) reject(error)
        else resolve(result!.secure_url)
      }
    )
    uploadStream.end(buffer)
  })
}

export { cloudinary }
