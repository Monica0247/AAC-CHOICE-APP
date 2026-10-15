"use server";

import crypto from "crypto";
import type { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { Group } from "@/models/Group";
import { Card } from "@/models/Card";
import { ChoiceLog } from "@/models/ChoiceLog";
import { User } from "@/models/User";

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

  const groups = await Group.find({ profileId: profile._id }).select("_id");
  const groupIds = groups.map((g) => g._id);
  await Card.deleteMany({ groupId: { $in: groupIds } });
  await ChoiceLog.deleteMany({ profileId: profile._id });
  await Group.deleteMany({ profileId: profile._id });
  await profile.deleteOne();

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export type InviteState = { error?: string; inviteUrl?: string } | undefined;

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
    const inviteToken = crypto.randomBytes(24).toString("hex");
    parent = await User.create({
      name,
      email,
      role: "parent",
      inviteToken,
      invitedBy: therapist.id,
    });
  } else if (parent.role !== "parent") {
    return { error: "That email belongs to a therapist account." };
  }

  const alreadyLinked = profile.parentIds.some(
    (id: Types.ObjectId) => id.toString() === parent!._id.toString()
  );
  if (!alreadyLinked) {
    profile.parentIds.push(parent._id);
    await profile.save();
  }

  revalidatePath(`/dashboard/profiles/${profileId}`);

  return {
    inviteUrl: parent.inviteToken ? `/invite/${parent.inviteToken}` : undefined,
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
