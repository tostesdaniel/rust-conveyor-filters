import type { pooledDb } from "@/db/pooled-connection";

export type DbTransaction = Parameters<
  Parameters<typeof pooledDb.transaction>[0]
>[0];
