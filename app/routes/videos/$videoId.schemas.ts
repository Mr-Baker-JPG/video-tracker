import { z } from 'zod'

export const CreateTrackingPointSchema = z.object({
	intent: z.literal('create-tracking-point'),
	videoId: z.string(),
	frame: z.coerce.number().int().min(0),
	x: z.coerce.number().min(0),
	y: z.coerce.number().min(0),
	trackingObjectId: z.string().optional(), // Optional: if provided, continue tracking that object
})

export const SaveScaleSchema = z.object({
	intent: z.literal('save-scale'),
	videoId: z.string(),
	startX: z.coerce.number().min(0),
	startY: z.coerce.number().min(0),
	endX: z.coerce.number().min(0),
	endY: z.coerce.number().min(0),
	distanceMeters: z.coerce.number().positive(),
})

export const SaveAxisSchema = z.object({
	intent: z.literal('save-axis'),
	videoId: z.string(),
	originX: z.coerce.number().min(0),
	originY: z.coerce.number().min(0),
	rotationAngle: z.coerce.number(), // In radians
})

export const CreateTrackingObjectSchema = z.object({
	intent: z.literal('create-tracking-object'),
	videoId: z.string(),
	name: z.string().optional(),
	color: z.string().optional(),
})

export const UpdateTrackingObjectSchema = z.object({
	intent: z.literal('update-tracking-object'),
	videoId: z.string(),
	trackingObjectId: z.string(),
	name: z.string().optional(), // Accepts any string including empty string
	color: z.string().optional(), // Accepts any string including empty string
})

export const DeleteTrackingObjectSchema = z.object({
	intent: z.literal('delete-tracking-object'),
	videoId: z.string(),
	trackingObjectId: z.string(),
})

export const ClearAllPointsSchema = z.object({
	intent: z.literal('clear-all-points'),
	videoId: z.string(),
})
