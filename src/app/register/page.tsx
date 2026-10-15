import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Therapist sign up</h1>
          <p className="text-sm text-slate-500">
            Create an account to manage profiles and choice boards.
          </p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
