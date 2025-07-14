"use server";

import { getCategories as getCategoriesDb } from "@/data";
import { createServerAction } from "zsa";

export const getCategories = createServerAction().handler(
  async () => await getCategoriesDb(),
);
