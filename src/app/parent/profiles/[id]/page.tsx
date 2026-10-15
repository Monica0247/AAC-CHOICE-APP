import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAccessibleProfile, getGroupsForProfile } from "@/lib/data";
import { AppHeader } from "@/components/AppHeader";

export default async function ParentProfilePage({
  params,
}: PageProps<"/parent/profiles/[id]">) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "parent") redirect("/login");

  const profile = await getAccessibleProfile(id, session.user);
  if (!profile) notFound();

  const groups = await getGroupsForProfile(id);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader userName={session.user.name ?? session.user.email ?? ""} homeHref="/parent" />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/parent" className="text-sm text-indigo-600 hover:underline">
          ← All profiles
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{profile.name}</h1>

        {groups.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No groups have been set up yet.
          </p>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <li key={group._id.toString()}>
                <Link
                  href={`/play/${group._id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition"
                >
                  <span className="text-lg font-semibold text-slate-900">▶ {group.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
