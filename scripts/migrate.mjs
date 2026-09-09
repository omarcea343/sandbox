import { config } from "dotenv"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"

config({ path: ".env.local" })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

try {
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" })
    console.log("migrations applied")
} finally {
    await pool.end()
}
