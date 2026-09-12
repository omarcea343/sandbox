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

// The live Trigger.dev chat session behind a game's thread, written by the
// agent's `onTurnComplete` hook and read back on page load so a reloaded tab
// resumes the stream instead of re-creating a session. Kept in its own table
// because it's ephemeral credential state, not part of the game record.
export const gameChatSessionsTable = pgTable("gameChatSessions", {
  // One session per game, keyed by the game id — the same value the transport
  // uses as its `chatId`.
  gameId: uuid()
    .primaryKey()
    .references(() => gamesTable.id, { onDelete: "cascade" }),
  // Session-scoped PAT, so the browser never needs the environment secret key
  // to reconnect. Re-minted by the agent each turn.
  publicAccessToken: text().notNull(),
  // Cursor into the durable response stream. This is what replaces the
  // resumable-stream setup: the transport resubscribes from here rather than
  // replaying chunks it already rendered.
  lastEventId: text(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Game = typeof gamesTable.$inferSelect;
export type GameChatSession = typeof gameChatSessionsTable.$inferSelect;
