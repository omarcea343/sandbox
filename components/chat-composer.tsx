"use client"

import { Button } from "@/components/ui/button"
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
import { createGame } from "@/lib/games/actions"
import {
    ArrowUpIcon,
    CarIcon,
    ChevronDownIcon,
    CrosshairIcon,
    Gamepad2Icon,
    Grid3x3Icon,
    Loader2Icon,
    PickaxeIcon,
    PlaneIcon,
    SwordsIcon,
    ZapIcon,
} from "lucide-react"
import { useRef, useState } from "react"
import { useFormStatus } from "react-dom"

const SUGGESTIONS = [
    { icon: PickaxeIcon, label: "Voxel survival" },
    { icon: SwordsIcon, label: "Ink samurai duel" },
    { icon: ZapIcon, label: "Comic-book firefight" },
    { icon: PlaneIcon, label: "Realistic battlefield" },
    { icon: CrosshairIcon, label: "Fight-first shooter" },
    { icon: CarIcon, label: "Jungle expedition drive" },
    { icon: Gamepad2Icon, label: "Sunny kingdom platformer" },
]

function SendButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus()

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

export function ChatComposer() {
    const formRef = useRef<HTMLFormElement>(null)
    const [prompt, setPrompt] = useState("")

    return (
        <form
            ref={formRef}
            action={async (formData) => {
                await createGame(formData)
                setPrompt("")
            }}
            className="flex w-full flex-col items-center gap-6"
        >
            <InputGroup className="bg-popover">
                <InputGroupTextarea
                    name="prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault()
                            formRef.current?.requestSubmit()
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
                    <SendButton disabled={prompt.trim() === ""} />
                </InputGroupAddon>
            </InputGroup>

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
        </form>
    )
}
