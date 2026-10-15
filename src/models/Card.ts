import { Schema, model, models, type InferSchemaType } from "mongoose";

const CardSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    label: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    audioUrl: { type: String, required: true },
    imagePublicId: { type: String, default: null },
    audioPublicId: { type: String, default: null },
  },
  { timestamps: true }
);

export type CardDoc = InferSchemaType<typeof CardSchema>;

export const Card = models.Card ?? model("Card", CardSchema);
