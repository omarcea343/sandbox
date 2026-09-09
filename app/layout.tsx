import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Geist, Geist_Mono } from "next/font/google"
import { Metadata } from "next/types"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
})

export const metadata: Metadata = {
    title: {
        default: "Sandbox - Build 3D games with AI",
        template: "%s | Sandbox",
    },
    description:
        "Describe a game and watch it come to life. Sandbox is an agentic three.js game builder that plans the scene, writes the code, and strams playable worlds from plain English.",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
        >
            <body>
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    )
}
