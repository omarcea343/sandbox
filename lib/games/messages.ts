import { db } from "@/lib/db"
import { gamesTable } from "@/lib/db/schema"
import type { UIMessage } from "ai"
import { and, eq } from "drizzle-orm"

// `orgId` is passed in rather than read from `auth()` because this runs from the
// chat route's `onEnd` callback, after the request has already been answered.
export async function saveGameMessages({
    gameId,
    orgId,
    messages,
}: {
    gameId: string
    orgId: string
    messages: UIMessage[]
}) {
    await db
        .update(gamesTable)
        .set({ messages })
        .where(and(eq(gamesTable.id, gameId), eq(gamesTable.orgId, orgId)))
}
