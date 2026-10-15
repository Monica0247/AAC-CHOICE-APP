"use client";

import { useActionState } from "react";
import { inviteParent, type InviteState } from "@/lib/actions/profiles";
import { SubmitButton } from "@/components/SubmitButton";

const initialState: InviteState = undefined;

export function InviteParentForm({ profileId }: { profileId: string }) {
  const [state, formAction] = useActionState(inviteParent, initialState);

  return (
    <div>
      <h3 className="font-semibold text-slate-900">Invite a parent</h3>
      <form action={formAction} className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="profileId" value={profileId} />
        <input
          name="name"
          type="text"
          placeholder="Parent's name"
          required
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <input
          name="email"
          type="email"
          placeholder="Parent's email"
          required
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <SubmitButton pendingText="Inviting…">Invite</SubmitButton>
      </form>

      {state?.error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {state?.inviteUrl && (
        <div className="mt-3 rounded-lg bg-indigo-50 px-3 py-3 text-sm text-indigo-900">
          <p className="font-medium">Share this link with them to set up their account:</p>
          <p className="mt-1 break-all font-mono text-xs">
            {typeof window !== "undefined" ? window.location.origin : ""}
            {state.inviteUrl}
          </p>
        </div>
      )}
    </div>
  );
}
