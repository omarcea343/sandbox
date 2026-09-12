CREATE TABLE "gameChatSessions" (
	"gameId" uuid PRIMARY KEY,
	"publicAccessToken" text NOT NULL,
	"lastEventId" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gameChatSessions" ADD CONSTRAINT "gameChatSessions_gameId_games_id_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE;