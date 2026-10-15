export type CardData = {
  id: string;
  label: string;
  imageUrl: string;
  audioUrl: string;
};

export function pickPair(cards: CardData[]): CardData[] {
  if (cards.length <= 2) return cards;
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}
