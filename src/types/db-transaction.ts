import type { db } from "@/db";

export type DbTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];
