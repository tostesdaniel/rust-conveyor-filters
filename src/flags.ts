import { unstable_flag as flag } from "@vercel/flags/next";

export const migrateAuthorIdsFlag = flag({
  key: "migrate-author-ids",
  description:
    "Enable the migration of author IDs from the development instance to the production instance of Clerk.",
  decide: () => process.env.MIGRATE_AUTHOR_IDS === "1",
  options: [
    { value: false, label: "Off" },
    { value: true, label: "On" },
  ],
});
