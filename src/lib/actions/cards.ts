"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { Group } from "@/models/Group";
import { Card } from "@/models/Card";
import { deleteCardMedia, isOwnUpload, signUpload, type UploadSignature } from "@/lib/cloudinary";

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

export async function getCardUploadSignature(groupId: string): Promise<UploadSignature | null> {
  try {
    await requireOwnedGroup(groupId);
  } catch {
    return null;
  }
  return signUpload();
}

// Receives only the Cloudinary URLs/IDs — the files themselves are uploaded
// by the browser directly to Cloudinary (see signUpload).
export async function createCard(_prevState: CardActionState, formData: FormData): Promise<CardActionState> {
  const field = (name: string) => formData.get(name)?.toString().trim() ?? "";
  const groupId = field("groupId");
  const label = field("label");
  const imageUrl = field("imageUrl");
  const imagePublicId = field("imagePublicId");
  const audioUrl = field("audioUrl");
  const audioPublicId = field("audioPublicId");

  if (!groupId || !label) return { error: "Label is required." };
  if (!imageUrl || !imagePublicId) return { error: "A photo is required." };
  if (!audioUrl || !audioPublicId) {
    return { error: "An audio recording or upload is required." };
  }
  if (!isOwnUpload(imageUrl, imagePublicId) || !isOwnUpload(audioUrl, audioPublicId)) {
    return { error: "Upload failed. Please try again." };
  }

  let profileId: string;
  try {
    const { profile } = await requireOwnedGroup(groupId);
    profileId = profile._id.toString();
  } catch {
    return { error: "Not authorized." };
  }

  await Card.create({ groupId, label, imageUrl, audioUrl, imagePublicId, audioPublicId });
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
