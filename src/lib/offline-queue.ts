const STORAGE_KEY = "pendingChoiceLogs";

export type PendingChoice = {
  groupId: string;
  chosenCardId: string;
  optionCardIds: string[];
  ts: number;
};

function readQueue(): PendingChoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingChoice[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — the
    // choice is lost, same as before this retry queue existed.
  }
}

export function queuePendingChoice(entry: PendingChoice) {
  writeQueue([...readQueue(), entry]);
}

export async function flushPendingChoices(
  recordChoice: (input: {
    groupId: string;
    chosenCardId: string;
    optionCardIds: string[];
  }) => Promise<void>
) {
  const queue = readQueue();
  if (queue.length === 0) return;

  const remaining: PendingChoice[] = [];
  for (const entry of queue) {
    try {
      await recordChoice(entry);
    } catch {
      remaining.push(entry);
    }
  }
  writeQueue(remaining);
}
