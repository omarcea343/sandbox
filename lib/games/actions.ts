"use server"

import { db } from "@/lib/db"
import { gamesTable } from "@/lib/db/schema"
import { deepSeek } from "@ai-sdk/deepseek"
import { auth } from "@clerk/nextjs/server"
import { generateText } from "ai"
import { refresh } from "next/cache"

const TITLE_MAX_LENGTH = 80

async function generateTitle(prompt: string) {
    try {
        const { text } = await generateText({
            model: deepSeek("deepseek-v4-flash"),
            instructions:
                "You name games. Reply with a single short title, at most 6 words, " +
                "for the game described by the user. No quotes, no punctuation at the end, " +
                "no explanation.",
            prompt,
        })

        const title = text.trim()

        // The model occasionally ignores the length instruction, and an empty
        // response would violate the not-null title column.
        return title === "" ? null : title.slice(0, TITLE_MAX_LENGTH)
    } catch {
        // A failed generation shouldn't stop the game from being created.
        return null
    }
}

export async function createGame(prompt: string) {
    const { orgId } = await auth()

    if (!orgId) {
        throw new Error("An active organization is required to create a game.")
    }

    if (prompt.trim() === "") {
        throw new Error("Describe the game you want to build.")
    }

    const title = (await generateTitle(prompt.trim())) ?? prompt.trim().slice(0, TITLE_MAX_LENGTH)

    const [game] = await db.insert(gamesTable).values({ orgId, title }).returning()

    // Re-renders the server components for the current route, so the new game shows up
    // in the sidebar rendered by `app/(app)/layout.tsx`.
    refresh()

    return game
}
