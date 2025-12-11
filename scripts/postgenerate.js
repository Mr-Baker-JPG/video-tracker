const fs = require('fs')
const path = require('path')

const clientDir = path.join(
	process.cwd(),
	'node_modules/@prisma/client/.prisma/client',
)
const runtimeDir = path.join(
	process.cwd(),
	'node_modules/@prisma/client/runtime',
)
const sqlDir = path.join(process.cwd(), 'node_modules/.prisma/client/sql')

// Create default.js and default.d.ts for .prisma/client
if (fs.existsSync(clientDir)) {
	const defaultJs = path.join(clientDir, 'default.js')
	const defaultDts = path.join(clientDir, 'default.d.ts')
	fs.writeFileSync(
		defaultJs,
		"const c=require('./client.ts');module.exports=c;",
	)
	fs.writeFileSync(defaultDts, "export*from'./client';")
}

// Create library.mjs for runtime
if (fs.existsSync(runtimeDir)) {
	const libraryMjs = path.join(runtimeDir, 'library.mjs')
	fs.writeFileSync(
		libraryMjs,
		"export{makeTypedQueryFactory}from'./client.mjs';",
	)
}

// Fix imports in generated SQL files
if (fs.existsSync(sqlDir)) {
	const files = fs.readdirSync(sqlDir).filter((f) => f.endsWith('.mjs'))
	files.forEach((f) => {
		const filePath = path.join(sqlDir, f)
		let content = fs.readFileSync(filePath, 'utf8')
		content = content.replace(
			/from\s+["']@prisma\/client\/runtime\/library["']/g,
			"from '@prisma/client/runtime/library.mjs'",
		)
		fs.writeFileSync(filePath, content)
	})
}
