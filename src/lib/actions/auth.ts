"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export type FormState = { error?: string } | undefined;

// Next's redirect() throws a control-flow error carrying this digest prefix;
// it must propagate, not be swallowed by the catch-all below. isRedirectError
// isn't part of the public next/navigation API in this Next.js version.
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function registerTherapist(_prevState: FormState, formData: FormData): Promise<FormState> {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  await connectToDatabase();
  const existing = await User.findOne({ email });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name, email, passwordHash, role: "therapist" });

  redirect("/login?registered=1");
}

export async function setParentPassword(_prevState: FormState, formData: FormData): Promise<FormState> {
  const token = formData.get("token")?.toString();
  const password = formData.get("password")?.toString();

  if (!token || !password) {
    return { error: "Missing invite token." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  await connectToDatabase();
  const user = await User.findOne({ inviteToken: token, role: "parent" });
  if (!user) {
    return { error: "This invite link is invalid or has already been used." };
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.inviteToken = null;
  user.inviteTokenExpiresAt = null;
  await user.save();

  redirect("/login?activated=1");
}

export async function loginAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const callbackUrl = formData.get("callbackUrl")?.toString();

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl && callbackUrl !== "/" ? callbackUrl : "/post-login",
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    console.error("loginAction failed", error);
    return { error: "Something went wrong. Please try again in a moment." };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
