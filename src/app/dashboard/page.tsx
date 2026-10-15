import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfilesForTherapist } from "@/lib/data";
import { AppHeader } from "@/components/AppHeader";
import { CreateProfileForm } from "@/components/CreateProfileForm";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "therapist") redirect("/login");

  const profiles = await getProfilesForTherapist(session.user.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader userName={session.user.name ?? session.user.email ?? ""} homeHref="/dashboard" />

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        <section>
          <h1 className="text-2xl font-bold text-slate-900">Your profiles</h1>
          <p className="mt-1 text-sm text-slate-500">
            Each profile is a person you support — create their choice groups and cards here.
          </p>

          {profiles.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No profiles yet. Add your first one below.
            </p>
          ) : (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {profiles.map((profile) => (
                <li key={profile._id.toString()}>
                  <Link
                    href={`/dashboard/profiles/${profile._id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition"
                  >
                    <span className="text-lg font-semibold text-slate-900">{profile.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Add a profile</h2>
          <p className="mt-1 text-sm text-slate-500">
            For example, the name of the person you&rsquo;re supporting.
          </p>
          <div className="mt-4">
            <CreateProfileForm />
          </div>
        </section>
      </main>
    </div>
  );
}
