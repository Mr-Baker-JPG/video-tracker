// tools/playwright-mcp.ts
import { createConnection } from '@playwright/mcp'
async function main() {
	const server = await createConnection({
		browser: {
			browserName: 'chromium', // "chromium" | "firefox" | "webkit"
			launchOptions: {
				headless: false, // set to true for fully headless automation
			},
		},
	})
	process.on('SIGINT', async () => {
		await server.close()
		process.exit(0)
	})
}
main().catch((err) => {
	console.error('Playwright MCP server failed to start:', err)
	process.exit(1)
})
