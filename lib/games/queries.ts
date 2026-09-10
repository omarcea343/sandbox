import { db } from "@/lib/db"
import { gamesTable } from "@/lib/db/schema"
import { auth } from "@clerk/nextjs/server"
import { and, desc, eq } from "drizzle-orm"

// Postgres rejects a malformed uuid with an error rather than an empty result,
// so ids coming from the URL are checked before they reach the query.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function listGames() {
    const { orgId } = await auth()

    if (!orgId) {
        return []
    }

    return db
        .select()
        .from(gamesTable)
        .where(eq(gamesTable.orgId, orgId))
        .orderBy(desc(gamesTable.createdAt))
}

export async function getGame(id: string) {
    const { orgId } = await auth()

    if (!orgId || !UUID_PATTERN.test(id)) {
        return undefined
    }

    const [game] = await db
        .select()
        .from(gamesTable)
        .where(and(eq(gamesTable.id, id), eq(gamesTable.orgId, orgId)))
        .limit(1)

    return game
}
