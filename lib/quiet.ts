// Runs a background server action (heartbeat, read receipts, call log) without the full-page loading card.
export async function quiet<T>(f: () => Promise<T>): Promise<T> {
  const w = window as unknown as { __kqQuiet?: number }; w.__kqQuiet = (w.__kqQuiet ?? 0) + 1;
  try { return await f(); } finally { w.__kqQuiet = Math.max(0, (w.__kqQuiet ?? 1) - 1); }
}
