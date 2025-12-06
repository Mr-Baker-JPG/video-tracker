import { createConnection } from '@playwright/mcp'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

async function main() {
	const server = await createConnection({
		browser: {
			browserName: 'chromium', // "chromium" | "firefox" | "webkit"
			launchOptions: {
				headless: false, // set to true for fully headless automation
			},
		},
	})

	const transport = new StdioServerTransport()
	await server.connect(transport)
	await transport.start()
}

main().catch((err) => {
	console.error('Playwright MCP server failed to start:', err)
	process.exit(1)
})
