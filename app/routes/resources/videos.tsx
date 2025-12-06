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

	// Fetch the video from storage
	const videoResponse = await fetch(signedUrl, {
		headers: signedHeaders,
	})

	invariantResponse(videoResponse.ok, 'Failed to fetch video', {
		status: videoResponse.status,
	})

	const videoBlob = await videoResponse.blob()
	const contentType = videoResponse.headers.get('content-type') || 'video/mp4'

	return new Response(videoBlob, {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	})
}
