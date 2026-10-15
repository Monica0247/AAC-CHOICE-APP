import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAccessibleGroup, getCardsForGroup } from "@/lib/data";
import { pickPair } from "@/lib/pick-pair";
import { PlayScreen } from "@/components/PlayScreen";

export default async function PlayPage({ params }: PageProps<"/play/[groupId]">) {
  const { groupId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const accessible = await getAccessibleGroup(groupId, session.user);
  if (!accessible) notFound();

  const cards = await getCardsForGroup(groupId);
  const exitHref = session.user.role === "therapist" ? "/dashboard" : "/parent";

  if (cards.length < 2) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <p className="text-lg font-semibold text-slate-700">
          &ldquo;{accessible.group.name}&rdquo; needs at least two cards before it can be played.
        </p>
        <Link href={exitHref} className="text-indigo-600 hover:underline">
          ← Back
        </Link>
      </main>
    );
  }

  const cardsForClient = cards.map((card) => ({
    id: card._id.toString(),
    label: card.label,
    imageUrl: card.imageUrl,
    audioUrl: card.audioUrl,
  }));

  return (
    <PlayScreen
      groupId={groupId}
      groupName={accessible.group.name}
      cards={cardsForClient}
      initialPair={pickPair(cardsForClient)}
      exitHref={exitHref}
    />
  );
}
