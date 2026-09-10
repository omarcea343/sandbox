import { ChatThread } from "@/components/chat-thread"
import { getGame } from "@/lib/games/queries"
import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

export default async function GamePage({ params, searchParams }: PageProps<"/games/[id]">) {
    await auth.protect({ unauthenticatedUrl: "/sign-in" })

    const { id } = await params
    const { prompt } = await searchParams
    const game = await getGame(id)

    if (!game) {
        notFound()
    }

    return (
        <ChatThread
            gameId={game.id}
            initialMessages={game.messages}
            // Set by `createGame` when it redirects here from the home page.
            // Repeating the param drops it, since only one prompt can be sent.
            initialPrompt={typeof prompt === "string" ? prompt : undefined}
        />
    )
}
