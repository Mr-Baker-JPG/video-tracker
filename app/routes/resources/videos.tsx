import { invariantResponse } from '@epic-web/invariant'
import { getSignedGetRequestInfo } from '#app/utils/storage.server.ts'
import { type Route } from './+types/videos'

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const searchParams = url.searchParams

	const objectKey = searchParams.get('objectKey')
	invariantResponse(objectKey, 'objectKey query parameter is required', {
		status: 400,
	})

	const { url: signedUrl, headers: signedHeaders } =
		getSignedGetRequestInfo(objectKey)

	// Check for range request (needed for video seeking and metadata)
	const rangeHeader = request.headers.get('range')

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
