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
import Image from "next/image"

function AssistantAvatar() {
    return (
        <MessageAvatar className="size-8 self-start rounded-lg bg-transparent">
            <Image src="/logo.svg" alt="Sandbox" width={32} height={32} className="size-8" />
        </MessageAvatar>
    )
}

export function ChatThread() {
    // The transport defaults to POSTing to `/api/chat`, which is where the
    // route handler lives, so it does not need to be configured here.
    const { messages, sendMessage, status, error } = useChat()

    return (
        <div className="flex h-svh flex-col">
            <MessageScrollerProvider>
                <MessageScroller className="flex-1">
                    <MessageScrollerViewport>
                        <MessageScrollerContent className="mx-auto w-full max-w-3xl px-4 py-8">
                            {messages.map((message) => {
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

                            {status === "submitted" && (
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
