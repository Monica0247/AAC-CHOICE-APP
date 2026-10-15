import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { Group } from "@/models/Group";
import { Card } from "@/models/Card";
import { User } from "@/models/User";
import { ChoiceLog } from "@/models/ChoiceLog";
import type { Session } from "next-auth";

export async function getProfilesForTherapist(therapistId: string) {
  await connectToDatabase();
  return Profile.find({ therapistId }).sort({ createdAt: -1 }).lean();
}

export async function getProfilesForParent(parentId: string) {
  await connectToDatabase();
  return Profile.find({ parentIds: parentId }).sort({ createdAt: -1 }).lean();
}

export async function getGroupsForProfile(profileId: string) {
  await connectToDatabase();
  return Group.find({ profileId }).sort({ createdAt: -1 }).lean();
}

export async function getCardsForGroup(groupId: string) {
  await connectToDatabase();
  return Card.find({ groupId }).sort({ createdAt: 1 }).lean();
}

export async function getParentsForProfile(parentIds: unknown[]) {
  if (!parentIds?.length) return [];
  await connectToDatabase();
  return User.find({ _id: { $in: parentIds } }).select("name email").lean();
}

/**
 * A profile is visible to the therapist who owns it and any parent linked to it.
 * Returns null when not found or the session user has no access.
 */
export async function getAccessibleProfile(profileId: string, user: Session["user"]) {
  await connectToDatabase();
  const profile = await Profile.findById(profileId).lean();
  if (!profile) return null;

  const isOwner = user.role === "therapist" && profile.therapistId.toString() === user.id;
  const isLinkedParent =
    user.role === "parent" &&
    profile.parentIds.some((id: Types.ObjectId) => id.toString() === user.id);

  if (!isOwner && !isLinkedParent) return null;
  return profile;
}

export async function getAccessibleGroup(groupId: string, user: Session["user"]) {
  await connectToDatabase();
  const group = await Group.findById(groupId).lean();
  if (!group) return null;

  const profile = await getAccessibleProfile(group.profileId.toString(), user);
  if (!profile) return null;

  return { group, profile };
}

export async function getChoiceHistoryForProfile(profileId: string, { limit = 50 }: { limit?: number } = {}) {
  await connectToDatabase();
  return ChoiceLog.find({ profileId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("chosenCardId", "label imageUrl")
    .populate("optionCardIds", "label")
    .lean();
}

export async function getChoiceCountsForProfile(profileId: string) {
  await connectToDatabase();
  const counts = await ChoiceLog.aggregate([
    { $match: { profileId: new Types.ObjectId(profileId) } },
    { $group: { _id: "$chosenCardId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const cards = await Card.find({ _id: { $in: counts.map((c) => c._id) } })
    .select("label")
    .lean();
  const labelById = new Map(cards.map((card) => [card._id.toString(), card.label]));

  return counts.map((c) => ({
    cardId: c._id.toString(),
    label: labelById.get(c._id.toString()) ?? "(card removed)",
    count: c.count as number,
  }));
}
