import { db } from "@/lib/db"
import { gamesTable } from "@/lib/db/schema"
import { auth } from "@clerk/nextjs/server"
import { and, desc, eq } from "drizzle-orm"

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

    if (!orgId) {
        return undefined
    }

    const [game] = await db
        .select()
        .from(gamesTable)
        .where(and(eq(gamesTable.id, id), eq(gamesTable.orgId, orgId)))
        .limit(1)

    return game
}
