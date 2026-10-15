import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadToCloudinary(file: File, kind: "image" | "audio") {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: "aac-choice-app",
    // Cloudinary serves audio through its video pipeline.
    resource_type: kind === "audio" ? "video" : "image",
  });

  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteFromCloudinary(publicId: string, kind: "image" | "audio") {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: kind === "audio" ? "video" : "image",
  });
}

// Best-effort: never blocks a card/group/profile delete on Cloudinary's
// availability. Cards uploaded before imagePublicId/audioPublicId existed
// are silently skipped rather than backfilled.
export async function deleteCardMedia(card: {
  imagePublicId?: string | null;
  audioPublicId?: string | null;
}) {
  await Promise.all([
    card.imagePublicId
      ? deleteFromCloudinary(card.imagePublicId, "image").catch((error) =>
          console.error("Cloudinary cleanup failed (image)", error)
        )
      : null,
    card.audioPublicId
      ? deleteFromCloudinary(card.audioPublicId, "audio").catch((error) =>
          console.error("Cloudinary cleanup failed (audio)", error)
        )
      : null,
  ]);
}
