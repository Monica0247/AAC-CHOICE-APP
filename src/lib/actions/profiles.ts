"use server";

import crypto from "crypto";
import mongoose, { type Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { Group } from "@/models/Group";
import { Card } from "@/models/Card";
import { ChoiceLog } from "@/models/ChoiceLog";
import { User } from "@/models/User";
import { deleteCardMedia } from "@/lib/cloudinary";

async function requireTherapist() {
  const session = await auth();
  if (!session?.user || session.user.role !== "therapist") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function createProfile(formData: FormData) {
  const therapist = await requireTherapist();
  const name = formData.get("name")?.toString().trim();
  if (!name) throw new Error("Name is required");

  await connectToDatabase();
  await Profile.create({ name, therapistId: therapist.id, parentIds: [] });
  revalidatePath("/dashboard");
}

export async function deleteProfile(formData: FormData) {
  const therapist = await requireTherapist();
  const profileId = formData.get("profileId")?.toString();
  if (!profileId) throw new Error("Missing profile id");

  await connectToDatabase();
  const profile = await Profile.findOne({ _id: profileId, therapistId: therapist.id });
  if (!profile) throw new Error("Not found");

  const session = await mongoose.startSession();
  let cards: Array<{ imagePublicId?: string | null; audioPublicId?: string | null }> = [];
  try {
    await session.withTransaction(async () => {
      const groups = await Group.find({ profileId: profile._id }).session(session).select("_id");
      const groupIds = groups.map((g) => g._id);
      cards = await Card.find({ groupId: { $in: groupIds } }).session(session).lean();
      await Card.deleteMany({ groupId: { $in: groupIds } }).session(session);
      await ChoiceLog.deleteMany({ profileId: profile._id }).session(session);
      await Group.deleteMany({ profileId: profile._id }).session(session);
      await Profile.deleteOne({ _id: profile._id }).session(session);
    });
  } finally {
    await session.endSession();
  }

  await Promise.all(cards.map((card) => deleteCardMedia(card)));

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export type InviteState = { error?: string; inviteUrl?: string; message?: string } | undefined;

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function newInvite() {
  return {
    inviteToken: crypto.randomBytes(24).toString("hex"),
    inviteTokenExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
  };
}

export async function inviteParent(_prevState: InviteState, formData: FormData): Promise<InviteState> {
  const therapist = await requireTherapist();
  const profileId = formData.get("profileId")?.toString();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const name = formData.get("name")?.toString().trim();

  if (!profileId || !email || !name) {
    return { error: "Name and email are required." };
  }

  await connectToDatabase();
  const profile = await Profile.findOne({ _id: profileId, therapistId: therapist.id });
  if (!profile) return { error: "Profile not found." };

  let parent = await User.findOne({ email });
  if (!parent) {
    parent = await User.create({
      name,
      email,
      role: "parent",
      ...newInvite(),
      invitedBy: therapist.id,
    });
  } else if (parent.role !== "parent") {
    return { error: "That email belongs to a therapist account." };
  } else if (!parent.passwordHash) {
    // Invited before but never activated: issue a fresh link so a lost or
    // stale one doesn't leave the therapist with nothing to share.
    Object.assign(parent, newInvite());
    await parent.save();
  }

  const alreadyLinked = profile.parentIds.some(
    (id: Types.ObjectId) => id.toString() === parent!._id.toString()
  );
  if (!alreadyLinked) {
    profile.parentIds.push(parent._id);
    await profile.save();
  }

  revalidatePath(`/dashboard/profiles/${profileId}`);

  if (parent.inviteToken) {
    return { inviteUrl: `/invite/${parent.inviteToken}` };
  }
  return {
    message: alreadyLinked
      ? `${parent.name} already has access to this profile.`
      : `${parent.name} already has an account and now has access to this profile. They can sign in with their existing password.`,
  };
}

export async function removeParent(formData: FormData) {
  const therapist = await requireTherapist();
  const profileId = formData.get("profileId")?.toString();
  const parentId = formData.get("parentId")?.toString();
  if (!profileId || !parentId) throw new Error("Missing fields");

  await connectToDatabase();
  const profile = await Profile.findOne({ _id: profileId, therapistId: therapist.id });
  if (!profile) throw new Error("Not found");

  profile.parentIds = profile.parentIds.filter(
    (id: Types.ObjectId) => id.toString() !== parentId
  );
  await profile.save();

  revalidatePath(`/dashboard/profiles/${profileId}`);
}
