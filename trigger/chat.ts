import { loadGameMessages, saveGameMessages, saveGameTurn } from "@/lib/games/messages"
import { deepSeek } from "@ai-sdk/deepseek"
import { chat, upsertIncomingMessage } from "@trigger.dev/sdk/ai"
import { streamText } from "ai"

export const gameChat = chat.agent({
    id: "game-chat",

    // The game row stays authoritative for history, exactly as the route
    // handler had it: the client only ever sends the new message, and the rest
    // of the thread is loaded here. `upsertIncomingMessage` appends that new
    // user message (and no-ops on continuations), so the write below is the
    // one the next page load has to be able to read.
    hydrateMessages: async ({ chatId, trigger, incomingMessages }) => {
        const messages = await loadGameMessages(chatId)

        if (upsertIncomingMessage(messages, { trigger, incomingMessages })) {
            await saveGameMessages({ gameId: chatId, messages })
        }

        return messages
    },

    // Both writes go in one transaction — see `saveGameTurn`.
    onTurnComplete: async ({ chatId, uiMessages, chatAccessToken, lastEventId }) => {
        await saveGameTurn({
            gameId: chatId,
            messages: uiMessages,
            publicAccessToken: chatAccessToken,
            lastEventId,
        })
    },

    // `messages` arrives as `ModelMessage[]`, so there's no `convertToModelMessages`
    // here, and the returned result is piped to the frontend automatically.
    run: async ({ messages, signal }) =>
        streamText({
            // Spread first, so the explicit options below still win. This is what
            // wires up `prepareStep` for compaction, steering and background
            // injection — omitting it fails silently.
            ...chat.toStreamTextOptions(),
            model: deepSeek("deepseek-v4-flash"),
            messages,
            // Without this the Stop signal updates the UI while the model keeps
            // generating server-side.
            abortSignal: signal,
        }),
})
