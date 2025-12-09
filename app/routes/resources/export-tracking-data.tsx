import { invariantResponse } from '@epic-web/invariant'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { generateTrackingDataCSV } from '#app/routes/videos/$videoId.tsx'
import { type Route } from './+types/export-tracking-data'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const url = new URL(request.url)
	const videoId = url.searchParams.get('videoId')

	invariantResponse(videoId, 'videoId query parameter is required', {
		status: 400,
	})

	// Verify video exists and user owns it
	const video = await prisma.video.findFirst({
		select: { id: true, userId: true, filename: true },
		where: { id: videoId },
	})

	invariantResponse(video, 'Video not found', { status: 404 })
	invariantResponse(
		video.userId === userId,
		'You do not have permission to export tracking data for this video',
		{ status: 403 },
	)

	// Fetch tracking points
	const trackingPoints = await prisma.trackingPoint.findMany({
		where: { videoId: video.id },
		select: {
			frame: true,
			x: true,
			y: true,
			trackingObjectId: true,
		},
		orderBy: [{ trackingObjectId: 'asc' }, { frame: 'asc' }],
	})

	// Validate that tracking points exist
	invariantResponse(
		trackingPoints.length > 0,
		'No tracking points found. Please add tracking points before exporting.',
		{ status: 400 },
	)

	// Fetch scale if it exists
	const scale = await prisma.videoScale.findUnique({
		where: { videoId: video.id },
		select: {
			pixelsPerMeter: true,
		},
	})

	// Generate CSV
	const csv = generateTrackingDataCSV(trackingPoints, scale)

	// Return CSV as response with appropriate headers
	const filename = `${video.filename.replace(/\.[^/.]+$/, '')}_tracking_data.csv`
	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename="${filename}"`,
		},
	})
}
