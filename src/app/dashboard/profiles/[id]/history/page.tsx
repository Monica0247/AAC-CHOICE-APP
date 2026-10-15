import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { getChoiceCountsForProfile, getChoiceHistoryForProfile } from "@/lib/data";
import { AppHeader } from "@/components/AppHeader";

type PopulatedCard = { _id: unknown; label: string } | null;

export default async function HistoryPage({ params }: PageProps<"/dashboard/profiles/[id]/history">) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "therapist") redirect("/login");

  await connectToDatabase();
  const profile = await Profile.findOne({ _id: id, therapistId: session.user.id }).lean();
  if (!profile) notFound();

  const [history, counts] = await Promise.all([
    getChoiceHistoryForProfile(id),
    getChoiceCountsForProfile(id),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader userName={session.user.name ?? session.user.email ?? ""} homeHref="/dashboard" />

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        <div>
          <Link href={`/dashboard/profiles/${id}`} className="text-sm text-indigo-600 hover:underline">
            ← {profile.name}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Choice history</h1>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Most chosen</h2>
          {counts.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No choices recorded yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {counts.map((c) => (
                <li key={c.cardId} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-slate-900">{c.label}</span>
                  <span className="text-sm text-slate-500">
                    chosen {c.count} time{c.count === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Recent choices</h2>
          {history.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No choices recorded yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {history.map((log) => {
                const chosen = log.chosenCardId as PopulatedCard;
                const options = (log.optionCardIds as PopulatedCard[]).filter(Boolean);
                const other = options.filter((o) => o && chosen && o._id?.toString() !== chosen._id?.toString());

                return (
                  <li key={log._id.toString()} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        {chosen?.label ?? "(card removed)"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(log.createdAt as Date).toLocaleString()}
                      </span>
                    </div>
                    {other.length > 0 && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        over {other.map((o) => o!.label).join(", ")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
