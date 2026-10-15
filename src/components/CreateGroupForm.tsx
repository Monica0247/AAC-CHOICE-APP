"use client";

import { useRef } from "react";
import { createGroup } from "@/lib/actions/groups";
import { SubmitButton } from "@/components/SubmitButton";

export function CreateGroupForm({ profileId }: { profileId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createGroup(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <input type="hidden" name="profileId" value={profileId} />
      <input
        name="name"
        type="text"
        placeholder="e.g. Breakfast"
        required
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
      <SubmitButton pendingText="Adding…">Add group</SubmitButton>
    </form>
  );
}
