"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { recordChoice } from "@/lib/actions/choice-log";
import { pickPair, type CardData } from "@/lib/pick-pair";

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function handleChoose(card: CardData) {
    if (chosenId) return;
    setChosenId(card.id);

    if (audioRef.current) {
      audioRef.current.src = card.audioUrl;
      audioRef.current.play().catch(() => {});
    }

    recordChoice({
      groupId,
      chosenCardId: card.id,
      optionCardIds: pair.map((c) => c.id),
    }).catch(() => {});
  }

  function handleTryAgain() {
    setChosenId(null);
    setPair(pickPair(cards));
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
              onClick={() => handleChoose(card)}
              disabled={chosenId !== null}
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

      {chosenId && (
        <div className="flex justify-center p-4">
          <button
            type="button"
            onClick={handleTryAgain}
            className="rounded-2xl bg-indigo-600 px-8 py-4 text-xl font-bold text-white hover:bg-indigo-700"
          >
            🔄 Choose again
          </button>
        </div>
      )}
    </div>
  );
}
