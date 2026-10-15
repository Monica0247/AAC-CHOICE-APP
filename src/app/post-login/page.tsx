import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function PostLogin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(session.user.role === "therapist" ? "/dashboard" : "/parent");
}
