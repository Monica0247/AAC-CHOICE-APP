import { Schema, model, models, type InferSchemaType } from "mongoose";

const ProfileSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: null },
    therapistId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    parentIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export type ProfileDoc = InferSchemaType<typeof ProfileSchema>;

export const Profile = models.Profile ?? model("Profile", ProfileSchema);
