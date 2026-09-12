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
import {
    deleteGameChatSession,
    mintGameChatAccessToken,
    startGameChatSession,
} from "@/lib/games/actions"
import type { gameChat } from "@/trigger/chat"
import { useChat } from "@ai-sdk/react"
import type { ChatSessionPersistedState } from "@trigger.dev/sdk/chat"
import { useTriggerChatTransport } from "@trigger.dev/sdk/chat/react"
import type { UIMessage } from "ai"
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
    initialSession,
    initialPrompt,
}: {
    gameId: string
    initialMessages: UIMessage[]
    initialSession?: ChatSessionPersistedState
    initialPrompt?: string
}) {
    // The chat id is the game id, so the agent knows which game's thread to load
    // and save. The transport talks to the `game-chat` agent directly; the two
    // actions it calls are the only server-side steps left, and both check that
    // this game belongs to the caller's org. `gameChat` is imported as a type
    // only, so none of the task's dependencies reach the browser bundle.
    const transport = useTriggerChatTransport<typeof gameChat>({
        task: "game-chat",
        accessToken: ({ chatId }) => mintGameChatAccessToken(chatId),
        startSession: ({ chatId, clientData }) => startGameChatSession({ chatId, clientData }),
        // Hydrated from the session row, so a reloaded tab reconnects without a
        // round-trip to create a session.
        sessions: initialSession ? { [gameId]: initialSession } : undefined,
        onSessionChange: (id, session) => {
            if (!session) {
                // Fire and forget: the row is only a reconnection shortcut, so a
                // failed cleanup shouldn't surface as an unhandled rejection.
                deleteGameChatSession(id).catch(() => {})
            }
        },
    })

    const { messages, sendMessage, status, error } = useChat({
        id: gameId,
        messages: initialMessages,
        transport,
        // Reconnects to a response that was still streaming when the page was
        // reloaded, picking up from the stored `lastEventId` rather than
        // replaying what's already rendered. A brand new thread has nothing to
        // reconnect to.
        resume: initialMessages.length > 0,
    })

    // The prompt that created the game is handed over in the URL rather than
    // sent from the home page, because the thread it belongs to doesn't exist
    // until the game row does. Sending it from here puts it through the same
    // transport as every other message, so the agent persists it.
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
