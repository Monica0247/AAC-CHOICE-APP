import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfilesForParent } from "@/lib/data";
import { AppHeader } from "@/components/AppHeader";

export default async function ParentHomePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "parent") redirect("/login");

  const profiles = await getProfilesForParent(session.user.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader userName={session.user.name ?? session.user.email ?? ""} homeHref="/parent" />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Your profiles</h1>
        <p className="mt-1 text-sm text-slate-500">
          Profiles a therapist has shared with you.
        </p>

        {profiles.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No profiles have been shared with you yet.
          </p>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {profiles.map((profile) => (
              <li key={profile._id.toString()}>
                <Link
                  href={`/parent/profiles/${profile._id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition"
                >
                  <span className="text-lg font-semibold text-slate-900">{profile.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
