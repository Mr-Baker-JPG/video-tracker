import { invariantResponse } from '@epic-web/invariant'
import { VideoPlayer } from '#app/components/video-player.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getVideoSrc } from '#app/utils/misc.tsx'
import { type Route } from './+types/$videoId.ts'

export async function loader({ params, request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)

	const video = await prisma.video.findUnique({
		where: { id: params.videoId },
		select: {
			id: true,
			filename: true,
			url: true,
			duration: true,
			uploadedAt: true,
			userId: true,
		},
	})

	invariantResponse(video, 'Video not found', { status: 404 })
	invariantResponse(
		video.userId === userId,
		'You do not have permission to view this video',
		{ status: 403 },
	)

	const videoSrc = getVideoSrc(video.url)

	return { video, videoSrc }
}

export default function VideoRoute({ loaderData }: Route.ComponentProps) {
	return (
		<div className="mx-auto max-w-4xl">
			<h1 className="text-h1 mb-8">{loaderData.video.filename}</h1>
			<VideoPlayer src={loaderData.videoSrc} />
		</div>
	)
}
