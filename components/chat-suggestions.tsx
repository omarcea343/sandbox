"use client"

import { useChatPrompt } from "@/components/chat-prompt"
import { Button } from "@/components/ui/button"
import { SUGGESTIONS } from "@/lib/games/suggestions"

export function ChatSuggestions() {
    const { setPrompt } = useChatPrompt()

    return (
        <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map(({ icon: Icon, label }) => (
                <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    className="rounded-full font-normal text-muted-foreground"
                    onClick={() => setPrompt(label)}
                >
                    <Icon />
                    {label}
                </Button>
            ))}
        </div>
    )
}
