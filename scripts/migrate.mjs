import { config } from "dotenv"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"

// Mirror the env files Next itself loads, in the same precedence order, so the
// migration connects to the same database `next start` will.
config({
    path: [".env.production.local", ".env.local", ".env.production", ".env"],
    quiet: true,
})

const url = process.env.DATABASE_URL

if (!url) {
    console.error("DATABASE_URL is not set - refusing to fall back to localhost")
    process.exit(1)
}

const { hostname, port, pathname } = new URL(url)
console.log(`migrating ${pathname.slice(1)} at ${hostname}:${port || 5432}`)

const pool = new Pool({ connectionString: url })

try {
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" })
    console.log("migrations applied")
} finally {
    await pool.end()
}
