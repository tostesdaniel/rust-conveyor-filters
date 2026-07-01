/**
 * Per-visit 50/50 (or `share`-weighted) roll deciding whether a non-ad-free
 * visitor sees the Pine card instead of the donate card in the sidebar slot.
 *
 * Rolled once on first client read and cached at module scope, so the choice
 * stays stable for the whole page visit, including in-SPA navigation back to
 * `/filters`, and re-rolls only on a full page reload. The roll never runs on
 * the server: callers read it inside an effect so SSR keeps painting the donate
 * card (no hydration mismatch).
 */
let cached: boolean | null = null;

export function rollPineBucket(share: number): boolean {
  if (cached === null) {
    cached = Math.random() < share;
  }
  return cached;
}
