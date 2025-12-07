import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { invariantResponse } from '@epic-web/invariant'
import { lookup as getMimeType } from 'mime-types'
import { http, HttpResponse } from 'msw'

// Ensure we have a valid URL by explicitly creating it from the import.meta.url
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures')
const FIXTURES_IMAGES_DIR = path.join(FIXTURES_DIR, 'images')

// Determine storage directory based on environment
// Test mode: use fixtures directory
// Dev mode: use .storage directory (temp folder)
function getMockStorageDir() {
	const isTest = process.env.NODE_ENV === 'test'
	if (isTest) {
		return path.join(FIXTURES_DIR, 'uploaded')
	}
	// Dev mode with mocks: use .storage temp folder
	return path.join(process.cwd(), '.storage', 'uploaded')
}
const STORAGE_ENDPOINT = process.env.AWS_ENDPOINT_URL_S3
const STORAGE_BUCKET = process.env.BUCKET_NAME
const STORAGE_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID

function validateAuth(headers: Headers) {
	const authHeader = headers.get('Authorization')
	const amzDate = headers.get('X-Amz-Date')
	const amzContentSha256 = headers.get('X-Amz-Content-SHA256')

	if (!authHeader || !amzDate || !amzContentSha256) return false
	if (!authHeader.startsWith('AWS4-HMAC-SHA256')) return false
	if (amzContentSha256 !== 'UNSIGNED-PAYLOAD') return false

	// For mocking purposes, we'll just verify the credential contains our access key
	// A full validation would verify the signature, but that's complex and unnecessary for tests
	if (authHeader.includes(`Credential=${STORAGE_ACCESS_KEY}/`)) return true

	return false
}

function assertKey(key: any): asserts key is Array<string> {
	invariantResponse(
		Array.isArray(key) && key.length && key.every((k) => typeof k === 'string'),
		'Key must contain a directory',
	)
}

export const handlers = [
	http.put(
		`${STORAGE_ENDPOINT}/${STORAGE_BUCKET}/:key*`,
		async ({ request, params }) => {
			if (!validateAuth(request.headers)) {
				return new HttpResponse('Unauthorized', { status: 401 })
			}
			const { key } = params

			assertKey(key)

			const storageDir = getMockStorageDir()
			const filePath = path.join(storageDir, ...key)
			const parentDir = path.dirname(filePath)
			await fs.mkdir(parentDir, { recursive: true })

			const fileBuffer = Buffer.from(await request.arrayBuffer())
			await fs.writeFile(filePath, fileBuffer)

			return new HttpResponse(null, { status: 201 })
		},
	),

	http.get(
		`${STORAGE_ENDPOINT}/${STORAGE_BUCKET}/:key*`,
		async ({ request, params }) => {
			const { key } = params
			assertKey(key)

			const storageDir = getMockStorageDir()
			const filePath = path.join(storageDir, ...key)
			try {
				// Check tests/fixtures/images directory first
				const testFixturesPath = path.join(FIXTURES_IMAGES_DIR, ...key)
				let file: Buffer
				try {
					file = await fs.readFile(testFixturesPath)
				} catch {
					// If not found in test fixtures, try original path
					file = await fs.readFile(filePath)
				}

				const contentType =
					getMimeType(key.at(-1) || '') || 'application/octet-stream'

				// Handle Range requests for video seeking and metadata
				const rangeHeader = request.headers.get('range')
				if (rangeHeader) {
					// Parse range header (e.g., "bytes=0-1023" or "bytes=1024-")
					const matches = rangeHeader.match(/bytes=(\d+)-(\d*)/)
					if (matches) {
						const start = parseInt(matches[1], 10)
						const end = matches[2] ? parseInt(matches[2], 10) : file.length - 1

						// Ensure valid range
						if (
							start >= 0 &&
							start < file.length &&
							end >= start &&
							end < file.length
						) {
							const chunk = file.subarray(start, end + 1)
							const contentRange = `bytes ${start}-${end}/${file.length}`

							return new HttpResponse(chunk, {
								status: 206, // Partial Content
								headers: {
									'Content-Type': contentType,
									'Content-Length': chunk.length.toString(),
									'Content-Range': contentRange,
									'Accept-Ranges': 'bytes',
									'Cache-Control': 'public, max-age=31536000, immutable',
								},
							})
						}
					}
					// Invalid range, return full file
				}

				// Full file response
				return new HttpResponse(file, {
					headers: {
						'Content-Type': contentType,
						'Content-Length': file.length.toString(),
						'Accept-Ranges': 'bytes',
						'Cache-Control': 'public, max-age=31536000, immutable',
					},
				})
			} catch {
				return new HttpResponse('Not found', { status: 404 })
			}
		},
	),
]
