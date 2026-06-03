# React Doctor — false positives

Patterns documented here are suppressed on future scans. Each entry names the
rule, the code shape, and why the diagnostic is wrong for this codebase.

## `react-doctor/async-await-in-loop`

- **Provider-fallback loop that `return`s on first success.** A `for` loop that
  tries each configured AI provider in order and returns as soon as one
  succeeds (catching and continuing on failure) is sequential by design.
  Parallelizing would call every provider on every request, wasting quota and
  defeating the fallback. e.g. `src/lib/ai/categorize-filter.ts`.

- **Paginated lookup with early `return`/`break` on match.** A loop that pages
  through an external API (incrementing `offset`) and exits as soon as it finds
  a match must run in order — fanning out would fetch all pages even after the
  answer is found, and hammer rate-limited endpoints. e.g.
  `src/services/discord-bot.ts` (Clerk user lookup).

- **Awaits inside a single `db.transaction((tx) => …)`.** A single transaction
  runs on one connection; queries against `tx` cannot execute concurrently.
  Per-iteration awaits inside a transaction loop are required, not a waterfall.
  e.g. `src/services/ai-categorize.ts` (proposal upserts).

- **Loop calling a rate-limited external/AI API per item.** Sequential calls to
  an LLM provider or other throttled service (especially when paired with an
  explicit inter-call delay) are intentional backpressure, not an oversight.
  e.g. `src/services/ai-categorize.ts` (`categorizeAndStore` workers).

## `react-doctor/async-parallel`

- **Awaits inside a single `db.transaction((tx) => …)`.** Same reasoning as
  above — one transaction, one connection, no concurrency. Ordered writes
  (e.g. create a row, then reference its id) must stay sequential.
  e.g. `src/server/api/routers/shareToken.ts` (revoke → create → reassign).
