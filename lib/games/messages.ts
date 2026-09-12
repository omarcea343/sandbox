import { db } from "@/lib/db"
import { gameChatSessionsTable, gamesTable } from "@/lib/db/schema"
import type { UIMessage } from "ai"
import { eq } from "drizzle-orm"

// These run inside the `game-chat` agent, not in a request, so there's no
// Clerk session to scope them by. The org check lives at the boundary instead:
// a browser can only reach a game's session after `startGameChatSession` or
// `mintGameChatAccessToken` has confirmed the game belongs to its org, and both
// tokens they hand back are scoped to that one chat id.

export async function loadGameMessages(gameId: string) {
    const [game] = await db
        .select({ messages: gamesTable.messages })
        .from(gamesTable)
        .where(eq(gamesTable.id, gameId))
        .limit(1)

    return game?.messages ?? []
}

export async function saveGameMessages({
    gameId,
    messages,
}: {
    gameId: string
    messages: UIMessage[]
}) {
    await db.update(gamesTable).set({ messages }).where(eq(gamesTable.id, gameId))
}

// The thread and the stream cursor are read in parallel on the next page load,
// so they're written together: a refresh landing between two separate writes
// would see the finished assistant message alongside the previous turn's
// `lastEventId`, and resume would replay this turn's chunks on top of it.
export async function saveGameTurn({
    gameId,
    messages,
    publicAccessToken,
    lastEventId,
}: {
    gameId: string
    messages: UIMessage[]
    publicAccessToken: string
    lastEventId?: string
}) {
    await db.transaction(async (tx) => {
        await tx.update(gamesTable).set({ messages }).where(eq(gamesTable.id, gameId))

        await tx
            .insert(gameChatSessionsTable)
            .values({ gameId, publicAccessToken, lastEventId })
            .onConflictDoUpdate({
                target: gameChatSessionsTable.gameId,
                set: { publicAccessToken, lastEventId },
            })
    })
}

export async function deleteGameChatSessionRow(gameId: string) {
    await db.delete(gameChatSessionsTable).where(eq(gameChatSessionsTable.gameId, gameId))
}
