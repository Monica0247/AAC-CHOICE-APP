"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recordChoice } from "@/lib/actions/choice-log";
import { pickPair, type CardData } from "@/lib/pick-pair";
import { flushPendingChoices, queuePendingChoice } from "@/lib/offline-queue";

export function PlayScreen({
  groupId,
  groupName,
  cards,
  initialPair,
  exitHref,
}: {
  groupId: string;
  groupName: string;
  cards: CardData[];
  initialPair: CardData[];
  exitHref: string;
}) {
  const [pair, setPair] = useState(initialPair);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [isPreloading, setIsPreloading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload every card's media once while online, so the service worker's
  // cache is warm before the child starts tapping and a dropped connection
  // mid-session doesn't break already-loaded cards.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      cards.flatMap((card) => [
        fetch(card.imageUrl, { cache: "force-cache" }).catch(() => {}),
        fetch(card.audioUrl, { cache: "force-cache" }).catch(() => {}),
      ])
    ).finally(() => {
      if (!cancelled) setIsPreloading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [cards]);

  // Retry any choices that failed to record while offline, both on mount
  // and whenever the browser regains connectivity.
  useEffect(() => {
    flushPendingChoices(recordChoice);
    const handleOnline = () => flushPendingChoices(recordChoice);
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  function handleChoose(card: CardData) {
    if (chosenId) return;
    setChosenId(card.id);

    if (audioRef.current) {
      audioRef.current.src = card.audioUrl;
      audioRef.current.play().catch(() => {});
    }

    const choice = {
      groupId,
      chosenCardId: card.id,
      optionCardIds: pair.map((c) => c.id),
    };
    recordChoice(choice).catch(() => {
      queuePendingChoice({ ...choice, ts: Date.now() });
    });
  }

  function handleTryAgain() {
    setChosenId(null);
    setPair(pickPair(cards));
  }

  function handleCardTap(card: CardData) {
    if (chosenId) {
      handleTryAgain();
    } else {
      handleChoose(card);
    }
  }

  if (isPreloading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-900 text-slate-300">
        <p className="text-lg font-medium">Preparing session…</p>
        <p className="text-sm text-slate-500">Loading photos and sounds for {groupName}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <div className="flex items-center justify-between px-4 py-2">
        <Link
          href={exitHref}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          ✕ Exit
        </Link>
        <span className="text-sm font-medium text-slate-400">{groupName}</span>
        <span className="w-16" aria-hidden="true" />
      </div>

      <audio ref={audioRef} />

      <div className="flex flex-1 flex-col gap-3 p-3 sm:flex-row">
        {pair.map((card) => {
          const isChosen = chosenId === card.id;
          const isDimmed = chosenId !== null && !isChosen;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardTap(card)}
              aria-label={card.label}
              className={`relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border-4 transition-all duration-300 ${
                isChosen ? "border-green-400 scale-[1.02]" : "border-transparent"
              } ${isDimmed ? "opacity-40" : "opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.imageUrl} alt={card.label} className="h-full w-full object-cover" />
              <span className="absolute bottom-0 w-full bg-black/60 px-4 py-3 text-center text-2xl font-bold text-white">
                {card.label}
              </span>
              {isChosen && (
                <span className="absolute top-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-2xl text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
