"use client";

import { useActionState } from "react";
import { setParentPassword, type FormState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

const initialState: FormState = undefined;

export function SetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(setParentPassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Choose a password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton className="w-full" pendingText="Saving…">
        Set password
      </SubmitButton>
    </form>
  );
}
