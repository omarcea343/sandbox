import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const gamesTable = pgTable(
  "games",
  {
    id: uuid().primaryKey().defaultRandom(),
    orgId: text().notNull(),
    title: text().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("games_org_id_created_at_idx").on(table.orgId, table.createdAt)],
);
