"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { Group } from "@/models/Group";
import { Card } from "@/models/Card";
import { ChoiceLog } from "@/models/ChoiceLog";
import { deleteCardMedia } from "@/lib/cloudinary";

async function requireOwnedProfile(profileId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "therapist") {
    throw new Error("Unauthorized");
  }
  await connectToDatabase();
  const profile = await Profile.findOne({ _id: profileId, therapistId: session.user.id });
  if (!profile) throw new Error("Not found");
  return profile;
}

export async function createGroup(formData: FormData) {
  const profileId = formData.get("profileId")?.toString();
  const name = formData.get("name")?.toString().trim();
  if (!profileId || !name) throw new Error("Missing fields");

  await requireOwnedProfile(profileId);
  await Group.create({ name, profileId });
  revalidatePath(`/dashboard/profiles/${profileId}`);
}

export async function deleteGroup(formData: FormData) {
  const groupId = formData.get("groupId")?.toString();
  const profileId = formData.get("profileId")?.toString();
  if (!groupId || !profileId) throw new Error("Missing fields");

  await requireOwnedProfile(profileId);

  const session = await mongoose.startSession();
  let cards: Array<{ imagePublicId?: string | null; audioPublicId?: string | null }> = [];
  try {
    await session.withTransaction(async () => {
      cards = await Card.find({ groupId }).session(session).lean();
      await Card.deleteMany({ groupId }).session(session);
      await ChoiceLog.deleteMany({ groupId }).session(session);
      await Group.deleteOne({ _id: groupId, profileId }).session(session);
    });
  } finally {
    await session.endSession();
  }

  await Promise.all(cards.map((card) => deleteCardMedia(card)));

  revalidatePath(`/dashboard/profiles/${profileId}`);
  redirect(`/dashboard/profiles/${profileId}`);
}
