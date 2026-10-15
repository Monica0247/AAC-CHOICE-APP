export type CardData = {
  id: string;
  label: string;
  imageUrl: string;
  audioUrl: string;
};

export function pickPair(cards: CardData[]): CardData[] {
  if (cards.length <= 2) return cards;

  // Partial Fisher-Yates: only need the first two slots to be uniformly
  // random, not the whole array shuffled.
  const pool = [...cards];
  for (let i = 0; i < 2; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 2);
}
