"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PlayError({
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
      <p className="text-sm text-slate-500">
        This choice board couldn&rsquo;t load. Please try again.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-base font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          ← Back
        </Link>
      </div>
    </main>
  );
}
