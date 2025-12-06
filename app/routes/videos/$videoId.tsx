import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { data } from 'react-router'
import { z } from 'zod'
import { VideoPlayer } from '#app/components/video-player.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getVideoSrc } from '#app/utils/misc.tsx'
import { type Route } from './+types/$videoId.ts'

const CreateTrackingPointSchema = z.object({
	intent: z.literal('create-tracking-point'),
	videoId: z.string(),
	frame: z.coerce.number().int().min(0),
	x: z.coerce.number().min(0),
	y: z.coerce.number().min(0),
	trackingObjectId: z.string().optional(), // Optional: if provided, continue tracking that object
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

	const videoSrc = getVideoSrc(video.url)

	return { video, videoSrc, trackingPoints }
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()

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
			/>
		</div>
	)
}
