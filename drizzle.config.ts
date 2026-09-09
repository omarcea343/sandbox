import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

// Mirror the env files Next itself loads, in the same precedence order. Dokploy
// writes a plain .env on the server, while local development uses .env.local.
config({
    path: [".env.production.local", ".env.local", ".env.production", ".env"],
    quiet: true,
})

export default defineConfig({
    out: "./drizzle",
    schema: "./lib/db/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
})
