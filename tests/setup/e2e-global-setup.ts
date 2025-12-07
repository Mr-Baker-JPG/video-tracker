import { execaCommand } from 'execa'
import fsExtra from 'fs-extra'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const E2E_DATABASE_PATH = path.join(
	path.dirname(path.dirname(__dirname)),
	'tests',
	'prisma',
	'e2e.db',
)

async function globalSetup() {
	// Ensure the database directory exists
	await fsExtra.ensureDir(path.dirname(E2E_DATABASE_PATH))

	// Always reset the database for e2e tests to ensure a clean state
	await execaCommand('npx prisma migrate reset --force --skip-seed', {
		stdio: 'inherit',
		env: {
			...process.env,
			DATABASE_URL: `file:${E2E_DATABASE_PATH}`,
		},
	})
}

export default globalSetup
