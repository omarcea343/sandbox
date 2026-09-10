import { ChatComposer } from "@/components/chat-composer"
import { ChatPromptProvider } from "@/components/chat-prompt"
import { ChatSuggestions } from "@/components/chat-suggestions"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import Image from "next/image"

export default function Page() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-8">
            <Empty className="flex-none">
                <EmptyHeader>
                    <EmptyMedia>
                        <Image src="/logo.svg" alt="Logo" width={48} height={48} />
                    </EmptyMedia>
                    <EmptyTitle className="text-2xl">What should we build today?</EmptyTitle>
                    <EmptyDescription>
                        Build your own racers, shooters, puzzles and whole worlds using your own
                        words. If you can describe it, you can play it.
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="max-w-2xl gap-6">
                    <ChatPromptProvider>
                        <ChatComposer />
                        <ChatSuggestions />
                    </ChatPromptProvider>
                </EmptyContent>
            </Empty>
        </div>
    )
}
