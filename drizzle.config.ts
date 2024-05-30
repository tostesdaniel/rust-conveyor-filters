import { defineConfig } from "drizzle-kit";

import { loadEnvConfig } from "@next/env";
import { cwd } from "process";

loadEnvConfig(cwd());

export default defineConfig({
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
console.log(process.env.DATABASE_URL!);
