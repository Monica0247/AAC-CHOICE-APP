"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { Group } from "@/models/Group";
import { Card } from "@/models/Card";
import { deleteCardMedia, uploadToCloudinary } from "@/lib/cloudinary";

export type CardActionState = { error?: string; success?: boolean } | undefined;

async function requireOwnedGroup(groupId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "therapist") {
    throw new Error("Unauthorized");
  }
  await connectToDatabase();
  const group = await Group.findById(groupId);
  if (!group) throw new Error("Not found");
  const profile = await Profile.findOne({ _id: group.profileId, therapistId: session.user.id });
  if (!profile) throw new Error("Not found");
  return { group, profile };
}

export async function createCard(_prevState: CardActionState, formData: FormData): Promise<CardActionState> {
  const groupId = formData.get("groupId")?.toString();
  const label = formData.get("label")?.toString().trim();
  const imageFile = formData.get("image");
  const audioFile = formData.get("audio");

  if (!groupId || !label) return { error: "Label is required." };
  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return { error: "A photo is required." };
  }
  if (!(audioFile instanceof File) || audioFile.size === 0) {
    return { error: "An audio recording or upload is required." };
  }

  let profileId: string;
  try {
    const { profile } = await requireOwnedGroup(groupId);
    profileId = profile._id.toString();
  } catch {
    return { error: "Not authorized." };
  }

  let image: { url: string; publicId: string };
  let audio: { url: string; publicId: string };
  try {
    [image, audio] = await Promise.all([
      uploadToCloudinary(imageFile, "image"),
      uploadToCloudinary(audioFile, "audio"),
    ]);
  } catch (error) {
    console.error("Cloudinary upload failed", error);
    return { error: "Upload failed. Check your internet connection and the Cloudinary settings in .env.local." };
  }

  await Card.create({
    groupId,
    label,
    imageUrl: image.url,
    audioUrl: audio.url,
    imagePublicId: image.publicId,
    audioPublicId: audio.publicId,
  });
  revalidatePath(`/dashboard/profiles/${profileId}/groups/${groupId}`);
  return { success: true };
}

export async function deleteCard(formData: FormData) {
  const cardId = formData.get("cardId")?.toString();
  const groupId = formData.get("groupId")?.toString();
  if (!cardId || !groupId) throw new Error("Missing fields");

  const { profile } = await requireOwnedGroup(groupId);
  const card = await Card.findOneAndDelete({ _id: cardId, groupId }).lean();
  if (card) await deleteCardMedia(card);
  revalidatePath(`/dashboard/profiles/${profile._id}/groups/${groupId}`);
}
