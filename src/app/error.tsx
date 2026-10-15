"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
        <p className="text-sm text-slate-500">
          We hit an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
