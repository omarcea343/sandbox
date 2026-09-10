import { saveGameMessages } from "@/lib/games/messages"
import { getGame } from "@/lib/games/queries"
import { deepSeek } from "@ai-sdk/deepseek"
import { auth } from "@clerk/nextjs/server"
import {
    convertToModelMessages,
    createIdGenerator,
    createUIMessageStreamResponse,
    streamText,
    toUIMessageStream,
    validateUIMessages,
    type UIMessage,
} from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
    const { orgId } = await auth()

    if (!orgId) {
        return new Response("Unauthorized", { status: 401 })
    }

    // The client only sends the new message; the rest of the thread is loaded
    // from the game row, so the stored history stays authoritative.
    const { id, message }: { id: string; message: UIMessage } = await req.json()

    const game = await getGame(id)

    if (!game) {
        return new Response("Not Found", { status: 404 })
    }

    const messages = await validateUIMessages({ messages: [...game.messages, message] })

    const result = streamText({
        model: deepSeek("deepseek-v4-flash"),
        messages: await convertToModelMessages(messages),
    })

    // Removes the backpressure on the model stream so the thread is still saved
    // when the client disconnects mid-response.
    result.consumeStream()

    return createUIMessageStreamResponse({
        stream: toUIMessageStream({
            stream: result.stream,
            originalMessages: messages,
            // Without this the response message is stored without an id, which
            // breaks the React keys when the thread is loaded back.
            generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
            onEnd: ({ messages }) => saveGameMessages({ gameId: game.id, orgId, messages }),
        }),
    })
}
