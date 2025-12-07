import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { data } from 'react-router'
import { z } from 'zod'
import { VideoPlayer } from '#app/components/video-player.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getVideoSrc } from '#app/utils/misc.tsx'
import { type Route } from './+types/$videoId.ts'

const FPS = 30 // Frames per second for time calculation

const CreateTrackingPointSchema = z.object({
	intent: z.literal('create-tracking-point'),
	videoId: z.string(),
	frame: z.coerce.number().int().min(0),
	x: z.coerce.number().min(0),
	y: z.coerce.number().min(0),
	trackingObjectId: z.string().optional(), // Optional: if provided, continue tracking that object
})

const SaveScaleSchema = z.object({
	intent: z.literal('save-scale'),
	videoId: z.string(),
	startX: z.coerce.number().min(0),
	startY: z.coerce.number().min(0),
	endX: z.coerce.number().min(0),
	endY: z.coerce.number().min(0),
	distanceMeters: z.coerce.number().positive(),
})

const ExportTrackingDataSchema = z.object({
	intent: z.literal('export-tracking-data'),
	videoId: z.string(),
})

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

	const trackingPoints = await prisma.trackingPoint.findMany({
		where: { videoId: video.id },
		select: {
			id: true,
			frame: true,
			x: true,
			y: true,
			trackingObjectId: true,
		},
		orderBy: [{ trackingObjectId: 'asc' }, { frame: 'asc' }],
	})

	const scale = await prisma.videoScale.findUnique({
		where: { videoId: video.id },
		select: {
			id: true,
			startX: true,
			startY: true,
			endX: true,
			endY: true,
			distanceMeters: true,
			pixelsPerMeter: true,
		},
	})

	const videoSrc = getVideoSrc(video.url)

	return { video, videoSrc, trackingPoints, scale }
}

export function generateTrackingDataCSV(
	trackingPoints: Array<{
		frame: number
		x: number
		y: number
		trackingObjectId: string
	}>,
	scale: { pixelsPerMeter: number } | null,
): string {
	// CSV header
	const hasScale = scale !== null
	const headers = [
		'trackingObjectId',
		'frame',
		'time (seconds)',
		'x (pixels)',
		'y (pixels)',
	]
	if (hasScale) {
		headers.push('x (meters)', 'y (meters)')
	}

	// Generate CSV rows
	const rows = trackingPoints.map((point) => {
		const time = point.frame / FPS
		const row = [
			point.trackingObjectId,
			point.frame.toString(),
			time.toFixed(6),
			point.x.toFixed(2),
			point.y.toFixed(2),
		]
		if (hasScale && scale) {
			const xMeters = point.x / scale.pixelsPerMeter
			const yMeters = point.y / scale.pixelsPerMeter
			row.push(xMeters.toFixed(6), yMeters.toFixed(6))
		}
		return row.join(',')
	})

	// Combine header and rows
	return [headers.join(','), ...rows].join('\n')
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()

	const intent = formData.get('intent')

	if (intent === 'export-tracking-data') {
		const submission = parseWithZod(formData, {
			schema: ExportTrackingDataSchema,
		})

		if (submission.status !== 'success') {
			return data(
				{ result: submission.reply() },
				{ status: submission.status === 'error' ? 400 : 200 },
			)
		}

		const { videoId } = submission.value

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

	if (intent === 'save-scale') {
		const submission = parseWithZod(formData, {
			schema: SaveScaleSchema,
		})

		if (submission.status !== 'success') {
			return data(
				{ result: submission.reply() },
				{ status: submission.status === 'error' ? 400 : 200 },
			)
		}

		const { videoId, startX, startY, endX, endY, distanceMeters } =
			submission.value

		// Verify video exists and user owns it
		const video = await prisma.video.findFirst({
			select: { id: true, userId: true },
			where: { id: videoId },
		})

		invariantResponse(video, 'Video not found', { status: 404 })
		invariantResponse(
			video.userId === userId,
			'You do not have permission to set scale for this video',
			{ status: 403 },
		)

		// Calculate pixel length of the line
		const pixelLength = Math.sqrt(
			Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2),
		)

		// Calculate pixels per meter
		const pixelsPerMeter = pixelLength / distanceMeters

		// Check if scale already exists
		const existingScale = await prisma.videoScale.findUnique({
			where: { videoId },
		})

		let scale
		if (existingScale) {
			// Update existing scale
			scale = await prisma.videoScale.update({
				where: { id: existingScale.id },
				data: {
					startX,
					startY,
					endX,
					endY,
					distanceMeters,
					pixelsPerMeter,
				},
				select: {
					id: true,
					startX: true,
					startY: true,
					endX: true,
					endY: true,
					distanceMeters: true,
					pixelsPerMeter: true,
				},
			})
		} else {
			// Create new scale
			scale = await prisma.videoScale.create({
				data: {
					videoId,
					startX,
					startY,
					endX,
					endY,
					distanceMeters,
					pixelsPerMeter,
				},
				select: {
					id: true,
					startX: true,
					startY: true,
					endX: true,
					endY: true,
					distanceMeters: true,
					pixelsPerMeter: true,
				},
			})
		}

		return data({ success: true, scale })
	}

	// Handle tracking point creation (existing logic)
	const submission = parseWithZod(formData, {
		schema: CreateTrackingPointSchema,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { videoId, frame, x, y, trackingObjectId } = submission.value

	// Verify video exists and user owns it
	const video = await prisma.video.findFirst({
		select: { id: true, userId: true },
		where: { id: videoId },
	})

	invariantResponse(video, 'Video not found', { status: 404 })
	invariantResponse(
		video.userId === userId,
		'You do not have permission to add tracking points to this video',
		{ status: 403 },
	)

	// Determine tracking object ID: use provided one, or generate new one
	let finalTrackingObjectId = trackingObjectId
	if (!finalTrackingObjectId) {
		// Generate a new tracking object ID (using cuid-like format)
		finalTrackingObjectId = `obj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
	}

	// Check if a point already exists for this tracking object at this frame
	const existingPoint = await prisma.trackingPoint.findFirst({
		where: {
			videoId,
			trackingObjectId: finalTrackingObjectId,
			frame,
		},
	})

	let trackingPoint
	if (existingPoint) {
		// Update existing point
		trackingPoint = await prisma.trackingPoint.update({
			where: { id: existingPoint.id },
			data: {
				x,
				y,
			},
			select: {
				id: true,
				frame: true,
				x: true,
				y: true,
				trackingObjectId: true,
			},
		})
	} else {
		// Create new tracking point
		trackingPoint = await prisma.trackingPoint.create({
			data: {
				videoId,
				frame,
				x,
				y,
				trackingObjectId: finalTrackingObjectId,
			},
			select: {
				id: true,
				frame: true,
				x: true,
				y: true,
				trackingObjectId: true,
			},
		})
	}

	return data({ success: true, trackingPoint })
}

export default function VideoRoute({ loaderData }: Route.ComponentProps) {
	return (
		<div className="mx-auto max-w-4xl">
			<h1 className="text-h1 mb-8">{loaderData.video.filename}</h1>
			<VideoPlayer
				src={loaderData.videoSrc}
				videoId={loaderData.video.id}
				trackingPoints={loaderData.trackingPoints}
				scale={loaderData.scale}
			/>
		</div>
	)
}
