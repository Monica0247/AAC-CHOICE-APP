import { Schema, model, models, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    role: { type: String, enum: ["therapist", "parent"], required: true },
    inviteToken: { type: String, default: null, index: { sparse: true } },
    inviteTokenExpiresAt: { type: Date, default: null },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// TTL: once an invite expires, the (still-unactivated) parent doc is
// dropped — setParentPassword must null this out on activation, or an
// activated account would get deleted a week after signup too.
UserSchema.index({ inviteTokenExpiresAt: 1 }, { expireAfterSeconds: 0 });

export type UserDoc = InferSchemaType<typeof UserSchema>;

export const User = models.User ?? model("User", UserSchema);
