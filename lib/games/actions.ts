"use server"

import { db } from "@/lib/db"
import { gamesTable } from "@/lib/db/schema"
import { deleteGameChatSessionRow } from "@/lib/games/messages"
import { getGame } from "@/lib/games/queries"
import type { gameChat } from "@/trigger/chat"
import { deepSeek } from "@ai-sdk/deepseek"
import { auth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import { chat, type ChatStartSessionParams } from "@trigger.dev/sdk/ai"
import { generateText } from "ai"
import { refresh } from "next/cache"
import { redirect } from "next/navigation"

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

    const description = prompt.trim()

    if (description === "") {
        throw new Error("Describe the game you want to build.")
    }

    const title = (await generateTitle(description)) ?? description.slice(0, TITLE_MAX_LENGTH)

    const [game] = await db.insert(gamesTable).values({ orgId, title }).returning()

    // Re-renders the server components for the current route, so the new game shows up
    // in the sidebar rendered by `app/(app)/layout.tsx`.
    refresh()

    // There's no thread to send the prompt to until the game row exists, so it
    // rides along in the URL and `<ChatThread>` sends it as the first message.
    // `redirect` throws, so nothing after this runs.
    redirect(`/games/${game.id}?prompt=${encodeURIComponent(description)}`)
}

// The chat id is the game id, and it arrives from the browser, so being signed
// in isn't enough on its own: every action below re-runs the org-scoped lookup
// the route handler used to do per request before handing out anything.
async function assertGameAccess(gameId: string) {
    const game = await getGame(gameId)

    if (!game) {
        throw new Error("Game not found.")
    }

    return game
}

const startSession = chat.createStartSessionAction<typeof gameChat>("game-chat")

// Creates the session and triggers its first run, then returns a session-scoped
// token. Idempotent on (environment, gameId).
export async function startGameChatSession(params: ChatStartSessionParams<typeof gameChat>) {
    await assertGameAccess(params.chatId)

    return startSession(params)
}

// A pure mint, called by the transport when its cached token expires. Scoped to
// the one chat, and run here rather than in the browser so TRIGGER_SECRET_KEY
// never leaves the server.
export async function mintGameChatAccessToken(chatId: string) {
    await assertGameAccess(chatId)

    return triggerAuth.createPublicToken({
        scopes: {
            read: { sessions: chatId },
            write: { sessions: chatId },
        },
        expirationTime: "1h",
    })
}

// The transport calls this when a run ends, so a stale token isn't handed back
// to the next page load. Cleanup, so a game that's already gone (its session row
// went with it) is a no-op rather than an error the caller has to handle.
export async function deleteGameChatSession(chatId: string) {
    const game = await getGame(chatId)

    if (!game) {
        return
    }

    await deleteGameChatSessionRow(chatId)
}
