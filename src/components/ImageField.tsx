"use client";

import { useState } from "react";

export function ImageField() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">Photo</label>
      <input
        type="file"
        name="image"
        accept="image/*"
        required
        onChange={handleChange}
        className="block text-sm text-slate-600"
      />
      {previewUrl && (
        // Local blob preview — next/image's optimizer doesn't support blob: URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Preview"
          className="mt-2 h-32 w-32 rounded-lg border border-slate-200 object-cover"
        />
      )}
    </div>
  );
}
