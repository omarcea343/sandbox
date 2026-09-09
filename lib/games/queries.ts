import { db } from "@/lib/db"
import { gamesTable } from "@/lib/db/schema"
import { auth } from "@clerk/nextjs/server"
import { desc, eq } from "drizzle-orm"

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
