"use client";

import { useRef } from "react";
import { createProfile } from "@/lib/actions/profiles";
import { SubmitButton } from "@/components/SubmitButton";

export function CreateProfileForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createProfile(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <input
        name="name"
        type="text"
        placeholder="e.g. Juan"
        required
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
      <SubmitButton pendingText="Adding…">Add profile</SubmitButton>
    </form>
  );
}
