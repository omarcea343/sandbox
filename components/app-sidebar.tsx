"use client"

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { CoinsIcon, MessageSquareIcon, SquarePenIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Empty, EmptyDescription } from "@/components/ui/empty"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import type { Game } from "@/lib/db/schema"

export function AppSidebar({
    games,
    ...props
}: React.ComponentProps<typeof Sidebar> & { games: Pick<Game, "id" | "title">[] }) {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="flex-row items-center justify-between group-data-[collapsible=icon]:justify-center">
                <SidebarMenuButton
                    className="w-fit group-data-[collapsible=icon]:hidden"
                    render={<Link href="/" />}
                >
                    <Image
                        src="/logo.svg"
                        alt="Sandbox"
                        width={20}
                        height={20}
                        className="size-5"
                    />
                    <span className="font-logo text-base">Sandbox</span>
                </SidebarMenuButton>
                <SidebarTrigger />
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={pathname === "/"}
                                    tooltip="New game"
                                    render={<Link href="/" />}
                                >
                                    <SquarePenIcon />
                                    <span>New game</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Recents</SidebarGroupLabel>
                    <SidebarGroupContent>
                        {games.length === 0 ? (
                            <Empty className="border p-2 group-data-[collapsible=icon]:hidden">
                                <EmptyDescription className="text-xs">
                                    Your games will live here.
                                </EmptyDescription>
                            </Empty>
                        ) : (
                            <SidebarMenu className="group-data-[collapsible=icon]:hidden">
                                {games.map((game) => (
                                    <SidebarMenuItem key={game.id}>
                                        <SidebarMenuButton tooltip={game.title}>
                                            <span className="truncate">{game.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        )}
                        <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Recents">
                                    <MessageSquareIcon />
                                    <span>Recents</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Credits: $1.00">
                            <CoinsIcon />
                            <span>Credits</span>
                        </SidebarMenuButton>
                        <SidebarMenuBadge>$1.00</SidebarMenuBadge>
                    </SidebarMenuItem>
                </SidebarMenu>
                <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                    <div className="flex min-w-0 grow group-data-[collapsible=icon]:hidden">
                        <OrganizationSwitcher
                            appearance={{
                                elements: {
                                    rootBox: "min-w-0 grow",
                                    organizationSwitcherTrigger: "w-full! justify-between!",
                                    organizationPreview: "min-w-0 max-w-none!",
                                    organizationPreviewTextContainer: "min-w-0",
                                    organizationPreviewMainIdentifier: "truncate",
                                },
                            }}
                        />
                    </div>
                    <UserButton />
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
