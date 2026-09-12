"use client"

import { useChatPrompt } from "@/components/chat-prompt"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupTextarea,
} from "@/components/ui/input-group"
import { ArrowUpIcon, ChevronDownIcon, Grid3x3Icon, Loader2Icon, SquareIcon } from "lucide-react"
import { useRef } from "react"
import { useFormStatus } from "react-dom"

function SendButton({
    disabled,
    responding,
    onStopAction,
}: {
    disabled: boolean
    responding: boolean
    onStopAction?: () => void
}) {
    const { pending } = useFormStatus()

    // While a response is in flight the same button stops it instead. It leaves
    // the form (`type="button"`), so the one control can't both queue a second
    // message and cancel the first, and it stays enabled while the composer's
    // `disabled` — which is what a streaming response sets — blocks sending.
    if (responding && onStopAction) {
        return (
            <InputGroupButton
                type="button"
                variant="default"
                size="icon-sm"
                className="ml-auto rounded-full"
                aria-label="Stop"
                onClick={onStopAction}
            >
                <SquareIcon className="fill-current" />
            </InputGroupButton>
        )
    }

    return (
        <InputGroupButton
            type="submit"
            variant="default"
            size="icon-sm"
            className="ml-auto rounded-full"
            aria-label="Send"
            disabled={disabled || pending}
        >
            {pending ? <Loader2Icon className="animate-spin" /> : <ArrowUpIcon />}
        </InputGroupButton>
    )
}

type ChatComposerProps = {
    // Named with the `Action` suffix so a Server Function can be passed straight
    // through from a Server Component. Receives the current prompt.
    onSubmitAction: (prompt: string) => void | Promise<unknown>
    // Cancels the response that's currently being generated. Together with
    // `responding` this turns the send button into a stop button; callers that
    // have nothing to cancel — the home page's create-game form — leave both out
    // and keep a plain send button.
    onStopAction?: () => void
    // Blocks submitting while the caller is busy, e.g. a response is streaming.
    disabled?: boolean
    // Whether a response is currently being generated.
    responding?: boolean
}

export function ChatComposer({
    onSubmitAction,
    onStopAction,
    disabled = false,
    responding = false,
}: ChatComposerProps) {
    const formRef = useRef<HTMLFormElement>(null)
    const { prompt, setPrompt } = useChatPrompt()

    return (
        <form
            ref={formRef}
            action={async () => {
                await onSubmitAction(prompt)
                setPrompt("")
            }}
            className="w-full"
        >
            <InputGroup className="bg-popover">
                <InputGroupTextarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault()

                            if (!disabled) {
                                formRef.current?.requestSubmit()
                            }
                        }
                    }}
                    placeholder="Describe the game you want to build…"
                    rows={1}
                    className="field-sizing-content max-h-48 min-h-10"
                />
                <InputGroupAddon align="block-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <InputGroupButton>
                                    <Grid3x3Icon />
                                    Kimi K3
                                    <ChevronDownIcon />
                                </InputGroupButton>
                            }
                        />
                        <DropdownMenuContent>
                            <DropdownMenuItem>Kimi K3</DropdownMenuItem>
                            <DropdownMenuItem>Kimi K2 Thinking</DropdownMenuItem>
                            <DropdownMenuItem>Claude Opus 5</DropdownMenuItem>
                            <DropdownMenuItem>Gemini 3 Pro</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <SendButton
                        disabled={disabled || prompt.trim() === ""}
                        responding={responding}
                        onStopAction={onStopAction}
                    />
                </InputGroupAddon>
            </InputGroup>
        </form>
    )
}
