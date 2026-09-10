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
import { Spinner } from "@/components/ui/spinner"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import Image from "next/image"
import { useEffect, useRef } from "react"

// Text is the only part kind this thread renders. This predicate gates both
// which messages are rendered and whether the pending spinner is shown, so if
// reasoning or tool parts are ever rendered too, widen it here rather than at
// the call sites: if the two disagree, a response that only has the newly
// rendered parts either shows a second avatar next to the spinner or replaces
// the spinner with an empty bubble.
function hasText(message: UIMessage) {
    return message.parts.some((part) => part.type === "text" && part.text !== "")
}

function AssistantAvatar() {
    return (
        <MessageAvatar className="size-8 self-start rounded-lg bg-transparent">
            <Image src="/logo.svg" alt="Sandbox" width={32} height={32} className="size-8" />
        </MessageAvatar>
    )
}

export function ChatThread({
    gameId,
    initialMessages,
    initialPrompt,
}: {
    gameId: string
    initialMessages: UIMessage[]
    initialPrompt?: string
}) {
    // The chat id is the game id, so the route handler knows which game's thread
    // to load and save.
    const { messages, sendMessage, status, error } = useChat({
        id: gameId,
        messages: initialMessages,
        // The api defaults to `/api/chat`, which is where the route handler
        // lives, so only the request body needs configuring here: the thread is
        // already persisted, so only the new message has to go over the wire.
        transport: new DefaultChatTransport({
            prepareSendMessagesRequest: ({ id, messages }) => ({
                body: { id, message: messages[messages.length - 1] },
            }),
        }),
    })

    // The prompt that created the game is handed over in the URL rather than
    // sent from the home page, because the thread it belongs to doesn't exist
    // until the game row does. Sending it from here puts it through the same
    // transport as every other message, so the route handler persists it.
    const hasSentInitialPrompt = useRef(false)

    useEffect(() => {
        // A thread that already has messages ignores the prompt: it can only be
        // a stale or hand-written URL, and appending it would send a message the
        // user didn't just type.
        if (!initialPrompt || initialMessages.length > 0 || hasSentInitialPrompt.current) {
            return
        }

        hasSentInitialPrompt.current = true
        sendMessage({ text: initialPrompt })

        // Drops the prompt from the URL without a re-render, so reloading
        // mid-response doesn't send it a second time and the address matches
        // the sidebar's link to this game.
        window.history.replaceState(null, "", `/games/${gameId}`)
    }, [gameId, initialMessages, initialPrompt, sendMessage])

    // The response message is pushed into `messages` as soon as the stream
    // starts, but it carries no text until the model gets past its reasoning.
    // Holding those messages back keeps the spinner up for that whole stretch,
    // instead of swapping it for an empty bubble.
    const visibleMessages = messages.filter(hasText)
    const lastMessage = messages[messages.length - 1]
    const isAwaitingResponse =
        (status === "submitted" || status === "streaming") &&
        (lastMessage?.role !== "assistant" || !hasText(lastMessage))

    return (
        <div className="flex h-svh flex-col">
            <MessageScrollerProvider>
                <MessageScroller className="flex-1">
                    <MessageScrollerViewport>
                        <MessageScrollerContent className="mx-auto w-full max-w-3xl px-4 py-8">
                            {visibleMessages.map((message) => {
                                const isAssistant = message.role === "assistant"

                                return (
                                    <MessageScrollerItem key={message.id} messageId={message.id}>
                                        <Message align={isAssistant ? "start" : "end"}>
                                            {isAssistant && <AssistantAvatar />}
                                            <MessageContent>
                                                <Bubble
                                                    variant={isAssistant ? "ghost" : "secondary"}
                                                    align={isAssistant ? "start" : "end"}
                                                >
                                                    <BubbleContent>
                                                        {message.parts.map((part, index) =>
                                                            part.type === "text" ? (
                                                                <span key={index}>{part.text}</span>
                                                            ) : null
                                                        )}
                                                    </BubbleContent>
                                                </Bubble>
                                            </MessageContent>
                                        </Message>
                                    </MessageScrollerItem>
                                )
                            })}

                            {isAwaitingResponse && (
                                <MessageScrollerItem>
                                    <Message align="start">
                                        <AssistantAvatar />
                                        <MessageContent>
                                            <Bubble variant="ghost" align="start">
                                                <BubbleContent>
                                                    <Spinner />
                                                </BubbleContent>
                                            </Bubble>
                                        </MessageContent>
                                    </Message>
                                </MessageScrollerItem>
                            )}

                            {error && (
                                <MessageScrollerItem>
                                    <Message align="start">
                                        <AssistantAvatar />
                                        <MessageContent>
                                            <Bubble variant="ghost" align="start">
                                                <BubbleContent className="text-destructive">
                                                    Something went wrong. Please try again.
                                                </BubbleContent>
                                            </Bubble>
                                        </MessageContent>
                                    </Message>
                                </MessageScrollerItem>
                            )}
                        </MessageScrollerContent>
                    </MessageScrollerViewport>
                    <MessageScrollerButton />
                </MessageScroller>
            </MessageScrollerProvider>

            <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4">
                <ChatPromptProvider>
                    <ChatComposer
                        // Not awaited: `sendMessage` only settles once the response
                        // has finished streaming, and the composer clears the draft
                        // once this resolves.
                        onSubmitAction={(prompt) => {
                            sendMessage({ text: prompt })
                        }}
                        disabled={status !== "ready"}
                    />
                </ChatPromptProvider>
            </div>
        </div>
    )
}
