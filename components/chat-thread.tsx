"use client"

import { ChatComposer } from "@/components/chat-composer"
import { ChatPromptProvider } from "@/components/chat-prompt"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import {
    MessageScroller,
    MessageScrollerButton,
    MessageScrollerContent,
    MessageScrollerItem,
    MessageScrollerProvider,
    MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import Image from "next/image"

// Placeholder transcript until the thread is wired up to real messages.
const MESSAGES = [
    {
        id: "1",
        role: "user",
        content: "Voxel survival",
    },
    {
        id: "2",
        role: "assistant",
        content:
            "Nice pick. I'll start with a chunked voxel world you can mine and place blocks in, a day/night cycle, and a hunger bar. Do you want hostile mobs from the start, or a peaceful build-first sandbox?",
    },
    {
        id: "3",
        role: "user",
        content: "Peaceful for now, but leave room for mobs later.",
    },
    {
        id: "4",
        role: "assistant",
        content:
            "Got it — I'm scaffolding the spawner system but leaving it switched off, so you can flip it on later without a rewrite. First playable build coming up.",
    },
    {
        id: "5",
        role: "user",
        content: "How big is the world going to be?",
    },
    {
        id: "6",
        role: "assistant",
        content:
            "Terrain generates infinitely around you in 16×16×128 chunks, streaming in and out as you walk. Render distance defaults to 8 chunks, which stays smooth on most laptops.",
    },
    {
        id: "7",
        role: "user",
        content: "Perfect. Can I place torches to light up caves?",
    },
    {
        id: "8",
        role: "assistant",
        content:
            "Yes — torches are in the starting inventory and cast a warm falloff light that updates as you dig. Give it a try in the preview and tell me what to change.",
    },
] as const

// Temporary stand-in until the thread is wired up to the chat route.
function sendMessage(prompt: string) {
    console.log(prompt)
}

export function ChatThread() {
    return (
        <div className="flex h-svh flex-col">
            <MessageScrollerProvider>
                <MessageScroller className="flex-1">
                    <MessageScrollerViewport>
                        <MessageScrollerContent className="mx-auto w-full max-w-3xl px-4 py-8">
                            {MESSAGES.map((message) => {
                                const isAssistant = message.role === "assistant"

                                return (
                                    <MessageScrollerItem key={message.id} messageId={message.id}>
                                        <Message align={isAssistant ? "start" : "end"}>
                                            {isAssistant && (
                                                <MessageAvatar className="size-8 self-start rounded-lg bg-transparent">
                                                    <Image
                                                        src="/logo.svg"
                                                        alt="Sandbox"
                                                        width={32}
                                                        height={32}
                                                        className="size-8"
                                                    />
                                                </MessageAvatar>
                                            )}
                                            <MessageContent>
                                                <Bubble
                                                    variant={isAssistant ? "ghost" : "secondary"}
                                                    align={isAssistant ? "start" : "end"}
                                                >
                                                    <BubbleContent>{message.content}</BubbleContent>
                                                </Bubble>
                                            </MessageContent>
                                        </Message>
                                    </MessageScrollerItem>
                                )
                            })}
                        </MessageScrollerContent>
                    </MessageScrollerViewport>
                    <MessageScrollerButton />
                </MessageScroller>
            </MessageScrollerProvider>

            <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4">
                <ChatPromptProvider>
                    <ChatComposer onSubmitAction={sendMessage} />
                </ChatPromptProvider>
            </div>
        </div>
    )
}
