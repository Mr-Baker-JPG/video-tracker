import fs from 'node:fs/promises'
import path from 'node:path'
import { invariantResponse } from '@epic-web/invariant'
import { getSignedGetRequestInfo } from '#app/utils/storage.server.ts'
import { type Route } from './+types/videos'

// Helper to get local storage directory for dev/test mode
// - Test mode: uses tests/fixtures/uploaded (MSW mock storage)
// - Dev mode: uses .storage/uploaded (local temp folder)
// - Production: uses Tigris (returns null to fetch via signed URLs)
function getLocalStorageDir() {
	const isTest = process.env.NODE_ENV === 'test'
	const isDev = process.env.NODE_ENV === 'development'
	const useMocks = process.env.MOCKS === 'true'

	if (isTest) {
		// Test mode: use fixtures directory (MSW mock storage)
		return path.join(process.cwd(), 'tests', 'fixtures', 'uploaded')
	}

	if (isDev && useMocks) {
		// Dev mode: use local temp folder for file storage
		return path.join(process.cwd(), '.storage', 'uploaded')
	}

	// Production: use Tigris (return null to fetch via signed URLs)
	return null
}

async function serveVideoFromFilesystem(
	objectKey: string,
	rangeHeader: string | null,
) {
	const localStorageDir = getLocalStorageDir()
	if (!localStorageDir) {
		return null
	}

	const filePath = path.join(localStorageDir, objectKey)
	try {
		// Verify file exists before trying to read
		await fs.access(filePath)
		const file = await fs.readFile(filePath)
		const fileStats = await fs.stat(filePath)

		// Handle Range requests
		if (rangeHeader) {
			const matches = rangeHeader.match(/bytes=(\d+)-(\d*)/)
			if (matches) {
				const start = parseInt(matches[1] ?? '0', 10)
				const end = matches[2] ? parseInt(matches[2], 10) : file.length - 1

				if (
					start >= 0 &&
					start < file.length &&
					end >= start &&
					end < file.length
				) {
					const chunk = file.subarray(start, end + 1)
					const contentRange = `bytes ${start}-${end}/${file.length}`

					return new Response(Buffer.from(chunk), {
						status: 206, // Partial Content
						headers: {
							'Content-Type': 'video/mp4',
							'Content-Length': chunk.length.toString(),
							'Content-Range': contentRange,
							'Accept-Ranges': 'bytes',
							'Cache-Control': 'public, max-age=31536000, immutable',
						},
					})
				}
			}
		}

		// Full file response
		return new Response(Buffer.from(file), {
			headers: {
				'Content-Type': 'video/mp4',
				'Content-Length': fileStats.size.toString(),
				'Accept-Ranges': 'bytes',
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		})
	} catch {
		return null
	}
}

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const searchParams = url.searchParams

	const objectKey = searchParams.get('objectKey')
	invariantResponse(objectKey, 'objectKey query parameter is required', {
		status: 400,
	})

	// Check for range request (needed for video seeking and metadata)
	const rangeHeader = request.headers.get('range')

	// In dev/test mode, try to serve from local filesystem first
	// This bypasses Tigris and serves directly from local storage
	const localStorageDir = getLocalStorageDir()
	if (localStorageDir) {
		const filesystemResponse = await serveVideoFromFilesystem(
			objectKey,
			rangeHeader,
		)
		if (filesystemResponse) {
			return filesystemResponse
		}
	}

	const { url: signedUrl, headers: signedHeaders } =
		getSignedGetRequestInfo(objectKey)

	if (rangeHeader) {
		// Forward range request to storage
		const videoResponse = await fetch(signedUrl, {
			headers: {
				...signedHeaders,
				Range: rangeHeader,
			},
		})

		invariantResponse(
			videoResponse.status === 206 || videoResponse.ok,
			'Failed to fetch video',
			{ status: videoResponse.status },
		)

		const contentType = videoResponse.headers.get('content-type') || 'video/mp4'
		const contentRange = videoResponse.headers.get('content-range')
		const contentLength = videoResponse.headers.get('content-length')
		const acceptRanges = videoResponse.headers.get('accept-ranges') || 'bytes'

		const headers = new Headers({
			'Content-Type': contentType,
			'Cache-Control': 'public, max-age=31536000, immutable',
			'Accept-Ranges': acceptRanges,
		})

		if (contentRange) {
			headers.set('Content-Range', contentRange)
		}
		if (contentLength) {
			headers.set('Content-Length', contentLength)
		}

		return new Response(videoResponse.body, {
			status: videoResponse.status,
			headers,
		})
	}

	// Non-range request: fetch full video
	const videoResponse = await fetch(signedUrl, {
		headers: signedHeaders,
	})

	invariantResponse(videoResponse.ok, 'Failed to fetch video', {
		status: videoResponse.status,
	})

	const videoBlob = await videoResponse.blob()
	const contentType = videoResponse.headers.get('content-type') || 'video/mp4'
	const contentLength = videoResponse.headers.get('content-length')

	const headers = new Headers({
		'Content-Type': contentType,
		'Cache-Control': 'public, max-age=31536000, immutable',
		'Accept-Ranges': 'bytes',
	})

	if (contentLength) {
		headers.set('Content-Length', contentLength)
	}

	return new Response(videoBlob, {
		headers,
	})
}
