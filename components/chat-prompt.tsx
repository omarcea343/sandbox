"use client"

import { createContext, useContext, useMemo, useState } from "react"

type ChatPromptContextValue = {
    prompt: string
    setPrompt: (prompt: string) => void
}

const ChatPromptContext = createContext<ChatPromptContextValue | null>(null)

// Shares the composer's draft prompt so the suggestions can live outside of it.
function ChatPromptProvider({ children }: { children: React.ReactNode }) {
    const [prompt, setPrompt] = useState("")
    const value = useMemo(() => ({ prompt, setPrompt }), [prompt])

    return <ChatPromptContext value={value}>{children}</ChatPromptContext>
}

function useChatPrompt() {
    const context = useContext(ChatPromptContext)

    if (!context) {
        throw new Error("useChatPrompt must be used within a <ChatPromptProvider>.")
    }

    return context
}

export { ChatPromptProvider, useChatPrompt }
