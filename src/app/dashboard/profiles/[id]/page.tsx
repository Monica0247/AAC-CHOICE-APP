import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { getGroupsForProfile, getParentsForProfile } from "@/lib/data";
import { AppHeader } from "@/components/AppHeader";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { InviteParentForm } from "@/components/InviteParentForm";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { deleteGroup } from "@/lib/actions/groups";
import { deleteProfile, removeParent } from "@/lib/actions/profiles";

export default async function ProfilePage({ params }: PageProps<"/dashboard/profiles/[id]">) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "therapist") redirect("/login");

  await connectToDatabase();
  const profile = await Profile.findOne({ _id: id, therapistId: session.user.id }).lean();
  if (!profile) notFound();

  const [groups, parents] = await Promise.all([
    getGroupsForProfile(id),
    getParentsForProfile(profile.parentIds),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader userName={session.user.name ?? session.user.email ?? ""} homeHref="/dashboard" />

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        <div>
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
            ← All profiles
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
            <form action={deleteProfile}>
              <input type="hidden" name="profileId" value={id} />
              <ConfirmSubmitButton confirmMessage={`Delete ${profile.name} and all their groups? This cannot be undone.`}>
                Delete profile
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Groups</h2>
          <p className="mt-1 text-sm text-slate-500">
            A group holds the photo cards {profile.name} chooses between, e.g. &ldquo;breakfast&rdquo;.
          </p>

          {groups.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No groups yet. Add one below.
            </p>
          ) : (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {groups.map((group) => (
                <li
                  key={group._id.toString()}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <Link
                    href={`/dashboard/profiles/${id}/groups/${group._id}`}
                    className="font-semibold text-slate-900 hover:text-indigo-600"
                  >
                    {group.name}
                  </Link>
                  <form action={deleteGroup}>
                    <input type="hidden" name="groupId" value={group._id.toString()} />
                    <input type="hidden" name="profileId" value={id} />
                    <ConfirmSubmitButton confirmMessage={`Delete group "${group.name}"?`}>
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">Add a group</h3>
            <div className="mt-4">
              <CreateGroupForm profileId={id} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Parents with access</h2>
          <p className="mt-1 text-sm text-slate-500">
            Invited parents can view and use {profile.name}&rsquo;s groups, but can&rsquo;t edit them.
          </p>

          {parents.length > 0 && (
            <ul className="mt-4 divide-y divide-slate-100">
              {parents.map((parent) => (
                <li key={parent._id.toString()} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{parent.name}</p>
                    <p className="text-xs text-slate-500">{parent.email}</p>
                  </div>
                  <form action={removeParent}>
                    <input type="hidden" name="profileId" value={id} />
                    <input type="hidden" name="parentId" value={parent._id.toString()} />
                    <ConfirmSubmitButton confirmMessage={`Remove ${parent.name}'s access?`}>
                      Remove
                    </ConfirmSubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4">
            <InviteParentForm profileId={id} />
          </div>
        </section>
      </main>
    </div>
  );
}
