"use client";

import { useActionState, useState } from "react";
import { createCard, type CardActionState } from "@/lib/actions/cards";
import { SubmitButton } from "@/components/SubmitButton";
import { ImageField } from "@/components/ImageField";
import { AudioField } from "@/components/AudioField";

const initialState: CardActionState = undefined;

export function CreateCardForm({ groupId }: { groupId: string }) {
  const [state, formAction] = useActionState(createCard, initialState);
  const [resetCount, setResetCount] = useState(0);

  // Remount the (uncontrolled) fields below whenever a new successful
  // submission comes back, so the label/photo/audio clear for the next card.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) {
      setResetCount((c) => c + 1);
    }
  }

  return (
    <form key={resetCount} action={formAction} className="space-y-4">
      <input type="hidden" name="groupId" value={groupId} />

      <div>
        <label htmlFor="label" className="block text-sm font-medium text-slate-700">
          Label
        </label>
        <input
          id="label"
          name="label"
          type="text"
          required
          placeholder="e.g. Toast"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      <ImageField />
      <AudioField />

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Card added.</p>
      )}

      <SubmitButton pendingText="Uploading…">Add card</SubmitButton>
    </form>
  );
}
