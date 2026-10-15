import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : "";
  const registered = params.registered === "1";
  const activated = params.activated === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>

        {registered && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Account created — you can log in now.
          </p>
        )}
        {activated && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Password set — you can log in now.
          </p>
        )}

        <LoginForm callbackUrl={callbackUrl} />

        <p className="text-center text-sm text-slate-500">
          Are you a therapist?{" "}
          <Link href="/register" className="font-medium text-indigo-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
