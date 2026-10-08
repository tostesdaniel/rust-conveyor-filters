import { type AppRouter } from "@/server/api/root";
import {
  defaultShouldDehydrateQuery,
  environmentManager,
  QueryClient,
} from "@tanstack/react-query";
import { isTRPCClientError } from "@trpc/client";
import SuperJSON from "superjson";

const MAX_RETRIES = 3;

function shouldRetry(failureCount: number, error: unknown) {
  if (environmentManager.isServer()) return false;

  const status = isTRPCClientError<AppRouter>(error)
    ? error.data?.httpStatus
    : undefined;
  if (status !== undefined && status >= 400 && status < 500) return false;

  return failureCount < MAX_RETRIES;
}

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
        retry: shouldRetry,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
