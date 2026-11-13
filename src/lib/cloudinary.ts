import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const UPLOAD_FOLDER = "aac-choice-app";

export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

// Files are uploaded by the browser straight to Cloudinary, because Vercel
// rejects function request bodies over 4.5 MB (FUNCTION_PAYLOAD_TOO_LARGE),
// which a phone photo + recording easily exceeds. The server only signs the
// upload and later receives the resulting URLs.
export function signUpload(): UploadSignature {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = UPLOAD_FOLDER;
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    timestamp,
    folder,
    signature,
  };
}

// Guards createCard against arbitrary URLs: only accept media that lives in
// this app's folder on this app's Cloudinary account.
export function isOwnUpload(url: string, publicId: string) {
  const prefix = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;
  return url.startsWith(prefix) && publicId.startsWith(`${UPLOAD_FOLDER}/`) && url.includes(publicId);
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
