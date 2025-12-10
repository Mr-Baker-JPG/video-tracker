import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { data } from 'react-router'
import { prisma } from '#app/utils/db.server.ts'
import {
	ClearAllPointsSchema,
	CreateTrackingObjectSchema,
	CreateTrackingPointSchema,
	DeleteTrackingObjectSchema,
	SaveAxisSchema,
	SaveScaleSchema,
	UpdateTrackingObjectSchema,
} from './$videoId.schemas.ts'

// Action intent constants
export const saveScaleActionIntent = 'save-scale'
export const saveAxisActionIntent = 'save-axis'
export const createTrackingObjectActionIntent = 'create-tracking-object'
export const updateTrackingObjectActionIntent = 'update-tracking-object'
export const deleteTrackingObjectActionIntent = 'delete-tracking-object'
export const clearAllPointsActionIntent = 'clear-all-points'
export const createTrackingPointActionIntent = 'create-tracking-point'

type ActionHandlerArgs = {
	userId: string
	formData: FormData
}

async function handleSaveScaleAction({ userId, formData }: ActionHandlerArgs) {
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

async function handleSaveAxisAction({ userId, formData }: ActionHandlerArgs) {
	const submission = parseWithZod(formData, {
		schema: SaveAxisSchema,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { videoId, originX, originY, rotationAngle } = submission.value

	// Verify video exists and user owns it
	const video = await prisma.video.findFirst({
		select: { id: true, userId: true },
		where: { id: videoId },
	})

	invariantResponse(video, 'Video not found', { status: 404 })
	invariantResponse(
		video.userId === userId,
		'You do not have permission to set axis for this video',
		{ status: 403 },
	)

	// Check if axis already exists
	const existingAxis = await prisma.videoAxis.findUnique({
		where: { videoId },
	})

	let axis
	if (existingAxis) {
		// Update existing axis
		axis = await prisma.videoAxis.update({
			where: { id: existingAxis.id },
			data: {
				originX,
				originY,
				rotationAngle,
			},
			select: {
				id: true,
				originX: true,
				originY: true,
				rotationAngle: true,
			},
		})
	} else {
		// Create new axis
		axis = await prisma.videoAxis.create({
			data: {
				videoId,
				originX,
				originY,
				rotationAngle,
			},
			select: {
				id: true,
				originX: true,
				originY: true,
				rotationAngle: true,
			},
		})
	}

	return data({ success: true, axis })
}

async function handleCreateTrackingObjectAction({
	userId,
	formData,
}: ActionHandlerArgs) {
	const submission = parseWithZod(formData, {
		schema: CreateTrackingObjectSchema,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { videoId, name, color } = submission.value

	// Verify video exists and user owns it
	const video = await prisma.video.findFirst({
		select: { id: true, userId: true },
		where: { id: videoId },
	})

	invariantResponse(video, 'Video not found', { status: 404 })
	invariantResponse(
		video.userId === userId,
		'You do not have permission to create tracking objects for this video',
		{ status: 403 },
	)

	// Generate a new tracking object ID
	const trackingObjectId = `obj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

	// Create new tracking object
	const trackingObject = await prisma.trackingObject.create({
		data: {
			id: trackingObjectId,
			videoId,
			name: name || `Object ${trackingObjectId.slice(-6)}`,
			color: color || null,
		},
		select: {
			id: true,
			name: true,
			color: true,
		},
	})

	return data({ success: true, trackingObject })
}

async function handleUpdateTrackingObjectAction({
	userId,
	formData,
}: ActionHandlerArgs) {
	const submission = parseWithZod(formData, {
		schema: UpdateTrackingObjectSchema,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { videoId, trackingObjectId, name, color } = submission.value

	// Verify video exists and user owns it
	const video = await prisma.video.findFirst({
		select: { id: true, userId: true },
		where: { id: videoId },
	})

	invariantResponse(video, 'Video not found', { status: 404 })
	invariantResponse(
		video.userId === userId,
		'You do not have permission to update tracking objects for this video',
		{ status: 403 },
	)

	// Verify tracking object exists
	const existingObject = await prisma.trackingObject.findUnique({
		where: {
			videoId_id: {
				videoId,
				id: trackingObjectId,
			},
		},
	})

	invariantResponse(existingObject, 'Tracking object not found', {
		status: 404,
	})

	// Prepare update data - always update name and color
	// The client always sends both fields, so we should always update them
	// Convert empty strings to null for database (null means "no custom name/color")
	// Since the client always sends both fields, name and color should always be defined
	const updateData = {
		name: (name ?? '').trim() || null,
		color: (color ?? '').trim() || null,
	}

	// Update tracking object
	const trackingObject = await prisma.trackingObject.update({
		where: {
			videoId_id: {
				videoId,
				id: trackingObjectId,
			},
		},
		data: updateData,
		select: {
			id: true,
			name: true,
			color: true,
		},
	})

	return data({ success: true, trackingObject })
}

async function handleDeleteTrackingObjectAction({
	userId,
	formData,
}: ActionHandlerArgs) {
	const submission = parseWithZod(formData, {
		schema: DeleteTrackingObjectSchema,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { videoId, trackingObjectId } = submission.value

	// Verify video exists and user owns it
	const video = await prisma.video.findFirst({
		select: { id: true, userId: true },
		where: { id: videoId },
	})

	invariantResponse(video, 'Video not found', { status: 404 })
	invariantResponse(
		video.userId === userId,
		'You do not have permission to delete tracking objects for this video',
		{ status: 403 },
	)

	// Verify tracking object exists
	const existingObject = await prisma.trackingObject.findUnique({
		where: {
			videoId_id: {
				videoId,
				id: trackingObjectId,
			},
		},
	})

	invariantResponse(existingObject, 'Tracking object not found', {
		status: 404,
	})

	// Delete all tracking points associated with this tracking object
	await prisma.trackingPoint.deleteMany({
		where: {
			videoId,
			trackingObjectId,
		},
	})

	// Delete the tracking object
	await prisma.trackingObject.delete({
		where: {
			videoId_id: {
				videoId,
				id: trackingObjectId,
			},
		},
	})

	return data({ success: true })
}

async function handleClearAllPointsAction({
	userId,
	formData,
}: ActionHandlerArgs) {
	const submission = parseWithZod(formData, {
		schema: ClearAllPointsSchema,
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
		select: { id: true, userId: true },
		where: { id: videoId },
	})

	invariantResponse(video, 'Video not found', { status: 404 })
	invariantResponse(
		video.userId === userId,
		'You do not have permission to clear tracking points for this video',
		{ status: 403 },
	)

	// Delete all tracking points for this video
	await prisma.trackingPoint.deleteMany({
		where: { videoId },
	})

	// Also delete all tracking objects since they're no longer needed
	await prisma.trackingObject.deleteMany({
		where: { videoId },
	})

	return data({ success: true })
}

async function handleCreateTrackingPointAction({
	userId,
	formData,
}: ActionHandlerArgs) {
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

	// Ensure TrackingObject exists for this trackingObjectId
	const existingTrackingObject = await prisma.trackingObject.findUnique({
		where: {
			videoId_id: {
				videoId,
				id: finalTrackingObjectId,
			},
		},
	})

	if (!existingTrackingObject) {
		// Create a new TrackingObject with default name
		await prisma.trackingObject.create({
			data: {
				id: finalTrackingObjectId,
				videoId,
				name: `Object ${finalTrackingObjectId.slice(-6)}`,
			},
		})
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

export async function action({ request }: { request: Request }) {
	const { requireUserId } = await import('#app/utils/auth.server.ts')
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	switch (intent) {
		case saveScaleActionIntent: {
			return handleSaveScaleAction({ userId, formData })
		}
		case saveAxisActionIntent: {
			return handleSaveAxisAction({ userId, formData })
		}
		case createTrackingObjectActionIntent: {
			return handleCreateTrackingObjectAction({ userId, formData })
		}
		case updateTrackingObjectActionIntent: {
			return handleUpdateTrackingObjectAction({ userId, formData })
		}
		case deleteTrackingObjectActionIntent: {
			return handleDeleteTrackingObjectAction({ userId, formData })
		}
		case clearAllPointsActionIntent: {
			return handleClearAllPointsAction({ userId, formData })
		}
		case createTrackingPointActionIntent: {
			return handleCreateTrackingPointAction({ userId, formData })
		}
		default: {
			throw new Response(`Invalid intent "${intent}"`, { status: 400 })
		}
	}
}
