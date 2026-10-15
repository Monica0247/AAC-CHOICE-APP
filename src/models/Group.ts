import { Schema, model, models, type InferSchemaType } from "mongoose";

const GroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    profileId: { type: Schema.Types.ObjectId, ref: "Profile", required: true, index: true },
  },
  { timestamps: true }
);

export type GroupDoc = InferSchemaType<typeof GroupSchema>;

export const Group = models.Group ?? model("Group", GroupSchema);
