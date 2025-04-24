import { db } from "@/db";
import { auth } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";
import SuperJSON from "superjson";
import { z, ZodError } from "zod";

import { checkUserOwnsFilter } from "@/lib/filters";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    auth: await auth(),
    db,
    ...opts,
  };
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: SuperJSON,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * It can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

const authMiddleware = t.middleware(({ next, ctx }) => {
  const { userId } = ctx.auth;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId,
    },
  });
});

export const publicProcedure = t.procedure.use(timingMiddleware);
export const authenticatedProcedure = t.procedure.use(authMiddleware);

export const ownsFilterProcedure = (filterId: z.ZodNumber) => {
  return authenticatedProcedure
    .input(z.object({ filterId }))
    .use(async ({ next, ctx, input }) => {
      const ownsFilter = await checkUserOwnsFilter(input.filterId, ctx.userId);

      if (!ownsFilter) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this filter",
        });
      }

      return next({
        ctx: {
          ...ctx,
          filter: ownsFilter,
        },
      });
    });
};
