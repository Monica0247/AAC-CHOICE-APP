"use client";

import { useActionState, useState } from "react";
import { createCard, getCardUploadSignature, type CardActionState } from "@/lib/actions/cards";
import type { UploadSignature } from "@/lib/cloudinary";
import { SubmitButton } from "@/components/SubmitButton";
import { ImageField } from "@/components/ImageField";
import { AudioField } from "@/components/AudioField";

const initialState: CardActionState = undefined;

async function uploadDirect(file: File, kind: "image" | "audio", sig: UploadSignature) {
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("folder", sig.folder);
  body.append("signature", sig.signature);
  // Cloudinary serves audio through its video pipeline.
  const resourceType = kind === "audio" ? "video" : "image";
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`,
    { method: "POST", body }
  );
  if (!res.ok) throw new Error(`Cloudinary ${kind} upload failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { secure_url: string; public_id: string };
  return { url: json.secure_url, publicId: json.public_id };
}

// Runs in the browser: uploads the files straight to Cloudinary, then calls
// the server action with only the resulting URLs (Vercel caps function
// request bodies at 4.5 MB, so the files can't go through the server).
async function submitCard(prevState: CardActionState, formData: FormData): Promise<CardActionState> {
  const groupId = formData.get("groupId")?.toString() ?? "";
  const imageFile = formData.get("image");
  const audioFile = formData.get("audio");

  if (!(imageFile instanceof File) || imageFile.size === 0) return { error: "A photo is required." };
  if (!(audioFile instanceof File) || audioFile.size === 0) {
    return { error: "An audio recording or upload is required." };
  }

  const sig = await getCardUploadSignature(groupId);
  if (!sig) return { error: "Not authorized." };

  let image: { url: string; publicId: string };
  let audio: { url: string; publicId: string };
  try {
    [image, audio] = await Promise.all([
      uploadDirect(imageFile, "image", sig),
      uploadDirect(audioFile, "audio", sig),
    ]);
  } catch (error) {
    console.error(error);
    return { error: "Upload failed. Check your internet connection and try again." };
  }

  const payload = new FormData();
  payload.set("groupId", groupId);
  payload.set("label", formData.get("label")?.toString() ?? "");
  payload.set("imageUrl", image.url);
  payload.set("imagePublicId", image.publicId);
  payload.set("audioUrl", audio.url);
  payload.set("audioPublicId", audio.publicId);
  return createCard(prevState, payload);
}

export function CreateCardForm({ groupId }: { groupId: string }) {
  const [state, formAction] = useActionState(submitCard, initialState);
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
