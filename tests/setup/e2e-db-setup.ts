// This file must be imported before any Prisma imports in e2e tests
// It sets up the DATABASE_URL to use the shared e2e database

import path from 'node:path'

const E2E_DATABASE_PATH = path.join(process.cwd(), 'tests', 'prisma', 'e2e.db')
const E2E_DATABASE_URL = `file:${E2E_DATABASE_PATH}`

// Set DATABASE_URL before any Prisma imports
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('base.db')) {
	process.env.DATABASE_URL = E2E_DATABASE_URL
}
