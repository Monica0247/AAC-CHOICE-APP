import { Schema, model, models, type InferSchemaType } from "mongoose";

const ChoiceLogSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    profileId: { type: Schema.Types.ObjectId, ref: "Profile", required: true, index: true },
    chosenCardId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    optionCardIds: [{ type: Schema.Types.ObjectId, ref: "Card" }],
  },
  { timestamps: true }
);

export type ChoiceLogDoc = InferSchemaType<typeof ChoiceLogSchema>;

export const ChoiceLog = models.ChoiceLog ?? model("ChoiceLog", ChoiceLogSchema);
