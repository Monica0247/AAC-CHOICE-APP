"use client";

import { useRef, useState } from "react";

export function AudioField() {
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setFileOnInput(file: File) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    if (inputRef.current) {
      inputRef.current.files = dataTransfer.files;
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        setFileOnInput(new File([blob], "recording.webm", { type: blob.type }));
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
    } catch {
      setError("Couldn't access the microphone. Check your browser permissions.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Audio (say the name of the picture)
      </label>
      <div className="flex flex-wrap items-center gap-3">
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            🎙 Record
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
          >
            ⏹ Stop recording
          </button>
        )}
        <span className="text-sm text-slate-400">or</span>
        <input
          ref={inputRef}
          type="file"
          name="audio"
          accept="audio/*"
          onChange={handleFileChange}
          className="text-sm text-slate-600"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {previewUrl && <audio controls src={previewUrl} className="mt-2 w-full max-w-xs" />}
    </div>
  );
}
