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
import {
    ArrowUpIcon,
    CarIcon,
    ChevronDownIcon,
    CrosshairIcon,
    Gamepad2Icon,
    Grid3x3Icon,
    PickaxeIcon,
    PlaneIcon,
    SwordsIcon,
    ZapIcon,
} from "lucide-react"

const SUGGESTIONS = [
    { icon: PickaxeIcon, label: "Voxel survival" },
    { icon: SwordsIcon, label: "Ink samurai duel" },
    { icon: ZapIcon, label: "Comic-book firefight" },
    { icon: PlaneIcon, label: "Realistic battlefield" },
    { icon: CrosshairIcon, label: "Fight-first shooter" },
    { icon: CarIcon, label: "Jungle expedition drive" },
    { icon: Gamepad2Icon, label: "Sunny kingdom platformer" },
]

export function ChatComposer() {
    return (
        <div className="flex w-full flex-col items-center gap-6">
            <InputGroup className="bg-popover">
                <InputGroupTextarea
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
                    <InputGroupButton
                        variant="default"
                        size="icon-sm"
                        className="ml-auto rounded-full"
                        aria-label="Send"
                    >
                        <ArrowUpIcon />
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>

            <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map(({ icon: Icon, label }) => (
                    <Button
                        key={label}
                        variant="outline"
                        size="sm"
                        className="rounded-full font-normal text-muted-foreground"
                    >
                        <Icon />
                        {label}
                    </Button>
                ))}
            </div>
        </div>
    )
}
