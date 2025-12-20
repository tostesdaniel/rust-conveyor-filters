import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

import { bookmarkRouter } from "./routers/bookmark";
import { categoryRouter } from "./routers/category";
import { feedbackRouter } from "./routers/feedback";
import { filterRouter } from "./routers/filter";
import { sharedFilterRouter } from "./routers/sharedFilter";
import { shareTokenRouter } from "./routers/shareToken";
import { statsRouter } from "./routers/stats";

/**
 * Primary router for the server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  filter: filterRouter,
  bookmark: bookmarkRouter,
  category: categoryRouter,
  stats: statsRouter,
  shareToken: shareTokenRouter,
  sharedFilter: sharedFilterRouter,
  feedback: feedbackRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.filter.getAll();
 *       ^? Filter[]
 */
export const createCaller = createCallerFactory(appRouter);
