import type { UIMessage } from "ai";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const gamesTable = pgTable(
  "games",
  {
    id: uuid().primaryKey().defaultRandom(),
    orgId: text().notNull(),
    title: text().notNull(),
    // The full chat thread for the game, stored in the `useChat` UI message
    // format so it can be handed straight back to the client.
    messages: jsonb().$type<UIMessage[]>().notNull().default([]),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("games_org_id_created_at_idx").on(table.orgId, table.createdAt)],
);

export type Game = typeof gamesTable.$inferSelect;
