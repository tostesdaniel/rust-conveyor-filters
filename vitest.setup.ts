// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument,
// toHaveAttribute, …). Safe in both `node` and `jsdom` environments — it only
// augments the matcher registry. React Testing Library auto-registers its
// afterEach cleanup when imported, so only files that render get torn down.
import "@testing-library/jest-dom/vitest";
