"use server";

import { db } from "@/db";
import { createServerAction } from "zsa";

export const getCategories = createServerAction().handler(
  async () => await db.query.categories.findMany(),
);
