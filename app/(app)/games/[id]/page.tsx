import { ChatThread } from "@/components/chat-thread"
import { auth } from "@clerk/nextjs/server"

export default async function GamePage() {
    await auth.protect({ unauthenticatedUrl: "/sign-in" })

    return <ChatThread />
}
