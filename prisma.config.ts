import { defineConfig } from 'prisma/config'
import { existsSync, readFileSync } from 'node:fs'

// La CLI Prisma ne lit pas .env.local (convention Next.js) : on le charge ici
// pour que `npx prisma migrate/studio/db seed` fonctionnent en local.
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\n]*)["']?$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

// Datasource conditionnelle : `prisma generate` doit fonctionner SANS
// DATABASE_URL (build Vercel avant configuration de la base). Seules les
// commandes migrate/studio exigent la variable.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  ...(process.env.DATABASE_URL
    ? { datasource: { url: process.env.DATABASE_URL } }
    : {}),
})
