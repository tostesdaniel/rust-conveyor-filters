import type { db } from "@/db/client";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
