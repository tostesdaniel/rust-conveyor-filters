import type { PineCadence, PineCreative } from "./pine";

/**
 * One node in the woven render list: either a real filter card or a sponsored
 * Pine band. Discriminated on `kind` so the grid can render each branch.
 */
export type WovenItem<T> =
  | { kind: "filter"; filter: T }
  | { kind: "band"; key: string; creativeIndex: number };

/**
 * Interleave sponsored Pine bands into a flat filter list at the configured
 * cadence. Pure and deterministic: identical inputs always yield identical
 * output, so re-renders and pagination never reshuffle existing nodes.
 */
export function weaveBands<T>(
  filters: T[],
  cadence: PineCadence,
  creativeCount: number,
): WovenItem<T>[] {
  const filterItem = (filter: T): WovenItem<T> => ({ kind: "filter", filter });

  // With no creative to show, a band would have nothing to render, so emit
  // a plain filter list rather than bands with an undefined creative.
  if (creativeCount < 1) {
    return filters.map(filterItem);
  }

  const woven: WovenItem<T>[] = [];
  let filtersSeen = 0;
  let bandOrdinal = 0;
  // Threshold (in real filters) at which the next band lands. Each successive
  // gap grows by growthStep, so bands fall after filters 6, 16, 30, 48, 70, …
  let nextBandAt = cadence.firstOffset;

  for (const filter of filters) {
    woven.push({ kind: "filter", filter });
    filtersSeen += 1;

    if (filtersSeen === nextBandAt) {
      woven.push({
        kind: "band",
        key: `pine-band-${bandOrdinal}`,
        creativeIndex: bandOrdinal % creativeCount,
      });
      bandOrdinal += 1;
      nextBandAt += cadence.firstOffset + bandOrdinal * cadence.growthStep;
    }
  }

  return woven;
}

type WovenGridConfig = {
  enabled: boolean;
  cadence: PineCadence;
  creatives: PineCreative[];
};

/**
 * Config-aware planner for the live `/filters` grid. When `enabled` is false it
 * reports zero creatives, so the planner emits a plain filter list and no band
 * renders; otherwise it weaves bands at the pure {@link weaveBands} cadence.
 */
export function planWovenGrid<T>(
  filters: T[],
  config: WovenGridConfig,
): WovenItem<T>[] {
  const creativeCount = config.enabled ? config.creatives.length : 0;
  return weaveBands(filters, config.cadence, creativeCount);
}
