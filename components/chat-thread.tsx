"use client"

import { ChatComposer } from "@/components/chat-composer"
import { ChatPromptProvider } from "@/components/chat-prompt"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
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
import { CornerDownRightIcon } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

// Text is the only part kind this thread renders. This predicate gates both
// which messages are rendered and whether the pending spinner is shown, so if
// reasoning or tool parts are ever rendered too, widen it here rather than at
// the call sites: if the two disagree, a response that only has the newly
// rendered parts either shows a second avatar next to the spinner or replaces
// the spinner with an empty bubble.
function hasText(message: UIMessage) {
    return message.parts.some((part) => part.type === "text" && part.text !== "")
}

// What the Continue button sends. It's a real message — the model only picks
// the stopped response back up if it's asked to — but it's the app talking, not
// the user, so it's marked and then kept out of the thread: a stop-and-continue
// should read as one answer, not as a conversation about continuing. The mark
// rides along on the message, so it still applies to a thread loaded from the
// database rather than only to the one that sent it.
const CONTINUE_PROMPT =
    "Continue your previous response from where it stopped. Don't repeat yourself or start over."
const CONTINUE_METADATA = { continued: true }

function isContinuePrompt(message: UIMessage) {
    return (
        message.role === "user" &&
        typeof message.metadata === "object" &&
        message.metadata !== null &&
        "continued" in message.metadata &&
        message.metadata.continued === true
    )
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

    const { messages, sendMessage, status, stop, error } = useChat({
        id: gameId,
        messages: initialMessages,
        transport,
        // Reconnects to a response that was still streaming when the page was
        // reloaded, picking up from the stored `lastEventId` rather than
        // replaying what's already rendered. A brand new thread has nothing to
        // reconnect to.
        resume: initialMessages.length > 0,
    })

    // A stopped response leaves the thread mid-sentence, and nothing on the
    // persisted messages marks it as truncated, so whether the Continue button
    // belongs on screen is tracked here rather than derived from `messages`.
    // That means it lives as long as the tab does: reloading after a stop drops
    // the button, and the user picks the thread back up by typing.
    const [wasStopped, setWasStopped] = useState(false)

    // `stop()` on its own only tears down this tab's stream. The transport
    // doesn't treat a subscription it reconnected to — which is what `resume`
    // above sets up after a reload — as owning the turn, so the run would keep
    // generating server-side. `stopGeneration` sends the stop signal over the
    // session's input channel instead, which reaches the agent either way; the
    // agent aborts its `streamText` call and stays alive for the next message.
    // `stop()` is still needed to move the local status back to `ready`.
    const stopResponse = useCallback(() => {
        // Fire and forget, like the session cleanup above: the run is aborted
        // server-side or it isn't, and a rejected signal shouldn't surface as an
        // unhandled rejection on top of the response the user is trying to stop.
        transport.stopGeneration(gameId).catch(() => {})
        stop()
        setWasStopped(true)
    }, [gameId, stop, transport])

    // Continuing is an ordinary turn: the run the stop aborted is still alive
    // and waiting, and it already has the truncated response in its history, so
    // all it needs is the instruction to pick that response back up. Asking for
    // it outright rather than re-running the turn on the history as it stands
    // is what stops the model from starting its answer over.
    const continueResponse = useCallback(() => {
        setWasStopped(false)
        sendMessage({ text: CONTINUE_PROMPT, metadata: CONTINUE_METADATA })
    }, [sendMessage])

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
    const visibleMessages = messages.filter(
        (message) => hasText(message) && !isContinuePrompt(message)
    )
    const lastMessage = messages[messages.length - 1]
    const isResponding = status === "submitted" || status === "streaming"
    const isAwaitingResponse =
        isResponding && (lastMessage?.role !== "assistant" || !hasText(lastMessage))
    // Only offered once the turn has actually settled, and never over an error:
    // the error bubble already asks the user to try again.
    const canContinue = wasStopped && status === "ready"

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

                            {canContinue && (
                                <MessageScrollerItem>
                                    <Message align="start">
                                        {/* Lines up under the stopped response
                                            rather than beside it: the avatar is
                                            2rem and `Message` adds a 0.5rem gap,
                                            and a ghost bubble has no padding of
                                            its own. */}
                                        <MessageContent className="ps-10">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-fit"
                                                onClick={continueResponse}
                                            >
                                                <CornerDownRightIcon />
                                                Continue
                                            </Button>
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
                            // Typing rather than continuing answers the stopped
                            // response, so the button goes away with it.
                            setWasStopped(false)
                            sendMessage({ text: prompt })
                        }}
                        onStopAction={stopResponse}
                        disabled={status !== "ready"}
                        // Narrower than `disabled`, which also covers `error`:
                        // there's only something to stop while a turn is in
                        // flight, and the button reads as a stop control exactly
                        // then.
                        responding={isResponding}
                    />
                </ChatPromptProvider>
            </div>
        </div>
    )
}
