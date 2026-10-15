"use server";

import { auth } from "@/auth";
import { getAccessibleGroup } from "@/lib/data";
import { Card } from "@/models/Card";
import { ChoiceLog } from "@/models/ChoiceLog";

export async function recordChoice(input: {
  groupId: string;
  chosenCardId: string;
  optionCardIds: string[];
}) {
  const session = await auth();
  if (!session?.user) return;

  const accessible = await getAccessibleGroup(input.groupId, session.user);
  if (!accessible) return;

  const card = await Card.findOne({ _id: input.chosenCardId, groupId: input.groupId });
  if (!card) return;

  await ChoiceLog.create({
    groupId: input.groupId,
    profileId: accessible.profile._id,
    chosenCardId: input.chosenCardId,
    optionCardIds: input.optionCardIds,
  });
}
