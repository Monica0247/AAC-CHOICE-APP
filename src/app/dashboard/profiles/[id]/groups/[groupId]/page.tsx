import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { Group } from "@/models/Group";
import { getCardsForGroup } from "@/lib/data";
import { AppHeader } from "@/components/AppHeader";
import { CreateCardForm } from "@/components/CreateCardForm";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { deleteCard } from "@/lib/actions/cards";

export default async function GroupPage({
  params,
}: PageProps<"/dashboard/profiles/[id]/groups/[groupId]">) {
  const { id, groupId } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "therapist") redirect("/login");

  await connectToDatabase();
  const profile = await Profile.findOne({ _id: id, therapistId: session.user.id }).lean();
  if (!profile) notFound();

  const group = await Group.findOne({ _id: groupId, profileId: id }).lean();
  if (!group) notFound();

  const cards = await getCardsForGroup(groupId);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader userName={session.user.name ?? session.user.email ?? ""} homeHref="/dashboard" />

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        <div>
          <Link href={`/dashboard/profiles/${id}`} className="text-sm text-indigo-600 hover:underline">
            ← {profile.name}
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
            {cards.length >= 2 && (
              <Link
                href={`/play/${groupId}`}
                target="_blank"
                className="inline-flex items-center rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                ▶ Preview choice screen
              </Link>
            )}
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Cards</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add at least two cards so {profile.name} has a choice to make.
          </p>

          {cards.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No cards yet. Add one below.
            </p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {cards.map((card) => (
                <li
                  key={card._id.toString()}
                  className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <Image
                    src={card.imageUrl}
                    alt={card.label}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{card.label}</p>
                      <audio controls src={card.audioUrl} className="mt-2 h-8 w-full" />
                    </div>
                    <form action={deleteCard} className="mt-2 self-end">
                      <input type="hidden" name="cardId" value={card._id.toString()} />
                      <input type="hidden" name="groupId" value={groupId} />
                      <ConfirmSubmitButton confirmMessage={`Delete "${card.label}"?`}>
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">Add a card</h3>
            <div className="mt-4">
              <CreateCardForm groupId={groupId} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
