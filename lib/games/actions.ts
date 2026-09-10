"use server"

import { db } from "@/lib/db"
import { gamesTable } from "@/lib/db/schema"
import { auth } from "@clerk/nextjs/server"
import { refresh } from "next/cache"

const TITLE_MAX_LENGTH = 80

export async function createGame(prompt: string) {
    const { orgId } = await auth()

    if (!orgId) {
        throw new Error("An active organization is required to create a game.")
    }

    if (prompt.trim() === "") {
        throw new Error("Describe the game you want to build.")
    }

    const [game] = await db
        .insert(gamesTable)
        .values({ orgId, title: prompt.trim().slice(0, TITLE_MAX_LENGTH) })
        .returning()

    // Re-renders the server components for the current route, so the new game shows up
    // in the sidebar rendered by `app/(app)/layout.tsx`.
    refresh()

    return game
}
