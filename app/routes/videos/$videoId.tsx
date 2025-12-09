import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { data, useFetcher, useRevalidator } from 'react-router'
import { z } from 'zod'
import { requireUserId } from '#app/utils/auth.server.ts'
import { transformToAxisCoordinates } from '#app/utils/coordinate-transform.ts'
import { AccelerationVsTimeGraph } from '#app/components/acceleration-vs-time-graph.tsx'
import { PositionVsTimeGraph } from '#app/components/position-vs-time-graph.tsx'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '#app/components/ui/alert-dialog.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { ScrollArea } from '#app/components/ui/scroll-area.tsx'
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '#app/components/ui/tabs.tsx'
import { VelocityVsTimeGraph } from '#app/components/velocity-vs-time-graph.tsx'
import { VideoAnalysisDashboard } from '#app/components/video-analysis-dashboard.tsx'
import { VideoPlayer } from '#app/components/video-player.tsx'
import { useLayout } from '#app/routes/resources/layout-switch.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getVideoSrc } from '#app/utils/misc.tsx'
import { getActiveTrackingObjectId } from '#app/utils/tracking-object-selection.server.ts'
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

const SaveAxisSchema = z.object({
	intent: z.literal('save-axis'),
	videoId: z.string(),
	originX: z.coerce.number().min(0),
	originY: z.coerce.number().min(0),
	rotationAngle: z.coerce.number(), // In radians
})

const CreateTrackingObjectSchema = z.object({
	intent: z.literal('create-tracking-object'),
	videoId: z.string(),
	name: z.string().optional(),
	color: z.string().optional(),
})

const UpdateTrackingObjectSchema = z.object({
	intent: z.literal('update-tracking-object'),
	videoId: z.string(),
	trackingObjectId: z.string(),
	name: z.string().optional(), // Accepts any string including empty string
	color: z.string().optional(), // Accepts any string including empty string
})

const DeleteTrackingObjectSchema = z.object({
	intent: z.literal('delete-tracking-object'),
	videoId: z.string(),
	trackingObjectId: z.string(),
})

const ClearAllPointsSchema = z.object({
	intent: z.literal('clear-all-points'),
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

	const trackingObjects = await prisma.trackingObject.findMany({
		where: { videoId: video.id },
		select: {
			id: true,
			name: true,
			color: true,
		},
		orderBy: { createdAt: 'asc' },
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

	const axis = await prisma.videoAxis.findUnique({
		where: { videoId: video.id },
		select: {
			id: true,
			originX: true,
			originY: true,
			rotationAngle: true,
		},
	})

	const videoSrc = getVideoSrc(video.url)

	const activeTrackingObjectId = await getActiveTrackingObjectId(
		request,
		video.id,
	)

	return {
		video,
		videoSrc,
		trackingPoints,
		trackingObjects,
		scale,
		axis,
		activeTrackingObjectId,
	}
}

export function generateTrackingDataCSV(
	trackingPoints: Array<{
		frame: number
		x: number
		y: number
		trackingObjectId: string
	}>,
	scale: { pixelsPerMeter: number } | null,
	axis: { originX: number; originY: number; rotationAngle: number } | null,
): string {

	// CSV header
	const hasScale = scale !== null
	const hasAxis = axis !== null
	const headers = [
		'trackingObjectId',
		'frame',
		'time (seconds)',
		'x (pixels)',
		'y (pixels)',
	]
	if (hasAxis) {
		headers.push('x (axis)', 'y (axis)')
	}
	if (hasScale) {
		headers.push('x (meters)', 'y (meters)')
	}
	if (hasAxis && hasScale) {
		headers.push('x (axis meters)', 'y (axis meters)')
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

		// Transform to axis coordinates if axis is configured
		let axisX = point.x
		let axisY = point.y
		if (hasAxis && axis) {
			const transformed = transformToAxisCoordinates(point.x, point.y, axis)
			axisX = transformed.x
			axisY = transformed.y
			row.push(axisX.toFixed(2), axisY.toFixed(2))
		}

		// Convert to meters if scale is available
		if (hasScale && scale) {
			const xMeters = point.x / scale.pixelsPerMeter
			const yMeters = point.y / scale.pixelsPerMeter
			row.push(xMeters.toFixed(6), yMeters.toFixed(6))

			// If axis is also configured, include axis-transformed meters
			if (hasAxis) {
				const axisXMeters = axisX / scale.pixelsPerMeter
				const axisYMeters = axisY / scale.pixelsPerMeter
				row.push(axisXMeters.toFixed(6), axisYMeters.toFixed(6))
			}
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

	if (intent === 'save-axis') {
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

	if (intent === 'create-tracking-object') {
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

	if (intent === 'update-tracking-object') {
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

	if (intent === 'delete-tracking-object') {
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

	if (intent === 'clear-all-points') {
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

export default function VideoRoute({ loaderData }: Route.ComponentProps) {
	const [isScaleCalibrationMode, setIsScaleCalibrationMode] = useState(false)
	const [isAxisConfigurationMode, setIsAxisConfigurationMode] = useState(false)
	const [activeTrackingObjectId, setActiveTrackingObjectId] = useState<
		string | null
	>(loaderData.activeTrackingObjectId ?? null)
	const [editingObjectId, setEditingObjectId] = useState<string | null>(null)
	const [editName, setEditName] = useState('')
	const [editColor, setEditColor] = useState('')
	const [deleteObjectId, setDeleteObjectId] = useState<string | null>(null)
	const [showClearPointsDialog, setShowClearPointsDialog] = useState(false)
	const [showCreateObjectDialog, setShowCreateObjectDialog] = useState(false)
	const [newObjectName, setNewObjectName] = useState('')
	const [newObjectColor, setNewObjectColor] = useState('')
	const colorInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
	const layoutPreference = useLayout()
	const [isFullWidthLayout, setIsFullWidthLayout] = useState(
		layoutPreference === 'full-width',
	)
	const [isMetricsCollapsed, setIsMetricsCollapsed] = useState(false)
	const [currentVideoTime, setCurrentVideoTime] = useState(0)
	const seekToFrameRef = useRef<((frame: number) => void) | null>(null)
	const layoutFetcher = useFetcher()
	const trackingObjectsFetcher = useFetcher()
	const clearPointsFetcher = useFetcher()
	const trackingObjectSelectionFetcher = useFetcher()
	const revalidator = useRevalidator()

	// Sync layout state with preference changes
	useEffect(() => {
		setIsFullWidthLayout(layoutPreference === 'full-width')
	}, [layoutPreference])

	// Optimistic updates for tracking objects
	const [optimisticTrackingObjects, setOptimisticTrackingObjects] = useState<
		typeof loaderData.trackingObjects
	>(loaderData.trackingObjects)

	// Sync optimistic state with loader data when it changes
	useEffect(() => {
		setOptimisticTrackingObjects(loaderData.trackingObjects)
	}, [loaderData.trackingObjects])

	// Sync active tracking object ID with loader data when it changes (e.g., navigating to different video)
	useEffect(() => {
		setActiveTrackingObjectId(loaderData.activeTrackingObjectId ?? null)
	}, [loaderData.activeTrackingObjectId])

	// Helper to update active tracking object ID and persist to session
	const updateActiveTrackingObjectId = (trackingObjectId: string | null) => {
		setActiveTrackingObjectId(trackingObjectId)
		void trackingObjectSelectionFetcher.submit(
			{
				videoId: loaderData.video.id,
				trackingObjectId: trackingObjectId ?? '',
			},
			{
				method: 'POST',
				action: '/resources/tracking-object-selection',
			},
		)
	}

	// Helper to get tracking object name (uses optimistic state)
	const getTrackingObjectName = (id: string): string => {
		const obj = optimisticTrackingObjects.find((o) => o.id === id)
		return obj?.name || `Object ${id.slice(-6)}`
	}

	// Helper to get tracking object color (uses optimistic state)
	const getTrackingObjectColor = (id: string): string => {
		const obj = optimisticTrackingObjects.find((o) => o.id === id)
		if (obj?.color) return obj.color
		// Generate color from ID hash
		const hash = id.split('').reduce((acc, char) => {
			return char.charCodeAt(0) + ((acc << 5) - acc)
		}, 0)
		const hue = Math.abs(hash) % 360
		return `hsl(${hue}, 70%, 50%)`
	}

	const handleCreateTrackingObject = () => {
		setShowCreateObjectDialog(true)
		setNewObjectName('')
		setNewObjectColor('')
	}

	const handleCreateObjectSubmit = () => {
		const trimmedName = newObjectName.trim()
		const trimmedColor = newObjectColor.trim()

		const formData = new FormData()
		formData.append('intent', 'create-tracking-object')
		formData.append('videoId', loaderData.video.id)
		if (trimmedName) {
			formData.append('name', trimmedName)
		}
		if (trimmedColor) {
			formData.append('color', trimmedColor)
		}

		void trackingObjectsFetcher.submit(formData, { method: 'POST' })
		setShowCreateObjectDialog(false)
		setNewObjectName('')
		setNewObjectColor('')
	}

	const handleUpdateTrackingObject = (id: string) => {
		const trimmedName = editName.trim()
		const trimmedColor = editColor.trim()

		// Optimistic UI update - update local state immediately
		setOptimisticTrackingObjects((prev) =>
			prev.map((obj) =>
				obj.id === id
					? {
							...obj,
							name: trimmedName || null,
							color: trimmedColor || null,
						}
					: obj,
			),
		)

		// Always send name and color fields when editing, so the server can update them
		const formData: Record<string, string> = {
			intent: 'update-tracking-object',
			videoId: loaderData.video.id,
			trackingObjectId: id,
			name: trimmedName,
			color: trimmedColor,
		}

		void trackingObjectsFetcher.submit(formData, { method: 'POST' })
		setEditingObjectId(null)
		setEditName('')
		setEditColor('')
	}

	// Track previous fetcher state to detect transitions
	const prevFetcherStateRef = useRef(trackingObjectsFetcher.state)
	const prevClearPointsFetcherStateRef = useRef(clearPointsFetcher.state)

	// Revalidate loader data when fetcher completes successfully (only once per update)
	useEffect(() => {
		const currentState = trackingObjectsFetcher.state
		const prevState = prevFetcherStateRef.current

		// Only revalidate when transitioning from submitting/loading to idle with success
		// This ensures we only revalidate once per update, not on every render
		if (
			(prevState === 'submitting' || prevState === 'loading') &&
			currentState === 'idle' &&
			trackingObjectsFetcher.data?.success
		) {
			void revalidator.revalidate()
		}

		prevFetcherStateRef.current = currentState
	}, [
		trackingObjectsFetcher.state,
		trackingObjectsFetcher.data?.success,
		revalidator,
	])

	// Revalidate when clear points fetcher completes
	useEffect(() => {
		const currentState = clearPointsFetcher.state
		const prevState = prevClearPointsFetcherStateRef.current

		// Only revalidate when transitioning from submitting/loading to idle with success
		if (
			(prevState === 'submitting' || prevState === 'loading') &&
			currentState === 'idle' &&
			clearPointsFetcher.data?.success
		) {
			void revalidator.revalidate()
		}

		prevClearPointsFetcherStateRef.current = currentState
	}, [clearPointsFetcher.state, clearPointsFetcher.data?.success, revalidator])

	const startEditing = (obj: {
		id: string
		name: string | null
		color: string | null
	}) => {
		setEditingObjectId(obj.id)
		setEditName(obj.name || '')
		setEditColor(obj.color || '')
	}

	const handleColorCircleClick = (
		e: React.MouseEvent,
		obj: { id: string; name: string | null; color: string | null },
	) => {
		e.stopPropagation()
		// Start editing if not already editing
		if (editingObjectId !== obj.id) {
			startEditing(obj)
		}
		// Trigger color input click to open color picker
		setTimeout(() => {
			const colorInput = colorInputRefs.current.get(obj.id)
			colorInput?.click()
		}, 50)
	}

	const setColorInputRef = (id: string, el: HTMLInputElement | null) => {
		if (el) {
			colorInputRefs.current.set(id, el)
		} else {
			colorInputRefs.current.delete(id)
		}
	}

	const handleDeleteTrackingObject = (id: string) => {
		void trackingObjectsFetcher.submit(
			{
				intent: 'delete-tracking-object',
				videoId: loaderData.video.id,
				trackingObjectId: id,
			},
			{ method: 'POST' },
		)
		setDeleteObjectId(null)
		// Clear active tracking object if it was deleted
		if (activeTrackingObjectId === id) {
			updateActiveTrackingObjectId(null)
		}
	}

	const handleClearAllPoints = () => {
		void clearPointsFetcher.submit(
			{
				intent: 'clear-all-points',
				videoId: loaderData.video.id,
			},
			{ method: 'POST' },
		)
		setShowClearPointsDialog(false)
		// Clear active tracking object since all points are deleted
		updateActiveTrackingObjectId(null)
	}

	// Sort points by frame for display
	const sortedPoints = [...loaderData.trackingPoints].sort(
		(a, b) => a.frame - b.frame,
	)
	// Calculate current frame from video time (30 fps)
	const currentFrame = Math.floor(currentVideoTime * 30)

	// Determine workflow step based on current state
	const hasScale = loaderData.scale !== null
	const hasTrackingPoints = loaderData.trackingPoints.length > 0

	// Metrics and Data Table component (for sidebar)
	const MetricsAndDataTable = () => (
		<div className="flex flex-col gap-4">
			{/* Metrics Card - Grouped logically */}
			<div className="rounded-xl border border-slate-200 bg-white shadow-sm">
				<button
					type="button"
					onClick={() => setIsMetricsCollapsed(!isMetricsCollapsed)}
					className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50"
				>
					<h3 className="text-sm font-semibold text-slate-800">
						Analysis Metrics
					</h3>
					<Icon
						name={isMetricsCollapsed ? 'chevron-down' : 'chevron-up'}
						className="h-4 w-4 text-slate-500"
					/>
				</button>
				<AnimatePresence initial={false}>
					{!isMetricsCollapsed && (
						<motion.div
							key="metrics-content"
							initial={{ height: 0, opacity: 0, y: -20 }}
							animate={{ height: 'auto', opacity: 1, y: 0 }}
							exit={{ height: 0, opacity: 0, y: -20 }}
							transition={{
								height: {
									duration: 0.3,
									ease: [0.4, 0, 0.2, 1],
								},
								opacity: {
									duration: 0.25,
									ease: [0.4, 0, 0.2, 1],
								},
								y: {
									duration: 0.3,
									ease: [0.4, 0, 0.2, 1],
								},
							}}
							style={{
								overflow: 'hidden',
							}}
						>
							<div className="px-6 pb-6">
								<VideoAnalysisDashboard
									trackingPoints={loaderData.trackingPoints}
									scale={loaderData.scale}
									axis={loaderData.axis}
								/>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Data Table Card - Enhanced with zebra striping */}
			<div className="flex h-[380px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
				<div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
					<h3 className="text-sm font-semibold text-slate-800">Data Points</h3>
					<span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
						{loaderData.trackingPoints.length} pts
					</span>
				</div>
				<ScrollArea className="flex-1 overflow-auto">
					<table className="w-full text-left text-xs">
						<thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
							<tr>
								<th className="px-4 py-3">Frame</th>
								<th className="px-4 py-3">Time (s)</th>
								<th className="px-4 py-3">X (m)</th>
								<th className="px-4 py-3">Y (m)</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{sortedPoints.map((point, index) => {
								const time = point.frame / 30
								const xMeters = loaderData.scale
									? point.x / loaderData.scale.pixelsPerMeter
									: point.x
								const yMeters = loaderData.scale
									? point.y / loaderData.scale.pixelsPerMeter
									: point.y
								const isCurrent = point.frame === currentFrame

								return (
									<tr
										key={point.id}
										className={
											isCurrent
												? 'bg-blue-50/50 ring-2 ring-blue-500'
												: index % 2 === 0
													? 'bg-blue-50/50'
													: ''
										}
									>
										<td
											className={`px-4 py-2 font-mono ${
												isCurrent ? 'font-bold text-blue-600' : 'text-slate-600'
											} ${!isCurrent ? 'cursor-pointer hover:text-blue-600' : ''}`}
											onClick={() => {
												if (seekToFrameRef.current) {
													// Frame numbers are 0-indexed in the data, but goToFrame expects 1-indexed
													seekToFrameRef.current(point.frame + 1)
												}
											}}
											title={
												!isCurrent
													? 'Click to seek to this frame'
													: 'Current frame'
											}
										>
											{point.frame}
										</td>
										<td
											className={`px-4 py-2 font-mono ${
												isCurrent ? 'font-bold text-blue-600' : 'text-slate-600'
											}`}
										>
											{time.toFixed(2)}
										</td>
										<td
											className={`px-4 py-2 font-mono ${
												isCurrent ? 'font-bold text-blue-600' : 'text-slate-600'
											}`}
										>
											{loaderData.scale
												? xMeters.toFixed(2)
												: point.x.toFixed(2)}
										</td>
										<td
											className={`px-4 py-2 font-mono ${
												isCurrent ? 'font-bold text-blue-600' : 'text-slate-600'
											}`}
										>
											{loaderData.scale
												? yMeters.toFixed(2)
												: point.y.toFixed(2)}
										</td>
									</tr>
								)
							})}
							{loaderData.trackingPoints.length === 0 && (
								<tr>
									<td
										colSpan={4}
										className="px-4 py-8 text-center text-sm text-slate-500"
									>
										No tracking points yet. Click on the video to start
										tracking.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</ScrollArea>
			</div>
		</div>
	)

	// Graph component (for below video player)
	const GraphSection = () => (
		<div className="flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
			<Tabs defaultValue="position" className="flex h-full flex-col">
				{/* Tab header - Primary, not secondary */}
				<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
					<TabsList className="grid w-auto grid-cols-3">
						<TabsTrigger value="position">Position</TabsTrigger>
						<TabsTrigger value="velocity">Velocity</TabsTrigger>
						<TabsTrigger value="acceleration">Acceleration</TabsTrigger>
					</TabsList>
				</div>
				{/* Graph area with card container */}
				<div className="flex-1 p-6">
					<div className="h-full rounded-lg border border-slate-200 bg-white p-4 shadow-inner">
						<TabsContent
							value="position"
							className="mt-0 flex-1 overflow-hidden"
						>
							<PositionVsTimeGraph
								trackingPoints={loaderData.trackingPoints}
								trackingObjects={optimisticTrackingObjects}
								scale={loaderData.scale}
								axis={loaderData.axis}
							/>
						</TabsContent>
						<TabsContent
							value="velocity"
							className="mt-0 flex-1 overflow-hidden"
						>
							<VelocityVsTimeGraph
								trackingPoints={loaderData.trackingPoints}
								trackingObjects={optimisticTrackingObjects}
								scale={loaderData.scale}
								axis={loaderData.axis}
							/>
						</TabsContent>
						<TabsContent
							value="acceleration"
							className="mt-0 flex-1 overflow-hidden"
						>
							<AccelerationVsTimeGraph
								trackingPoints={loaderData.trackingPoints}
								trackingObjects={optimisticTrackingObjects}
								scale={loaderData.scale}
								axis={loaderData.axis}
							/>
						</TabsContent>
					</div>
				</div>
			</Tabs>
		</div>
	)

	// Full analytics section (for full-width mode)
	const FullAnalyticsSection = () => (
		<div className="flex flex-col gap-4">
			<MetricsAndDataTable />
			<GraphSection />
		</div>
	)

	return (
		<div className="min-h-screen bg-slate-50">
			{/* Workflow Stepper */}
			<div className="border-b border-slate-200 bg-white">
				<div className="mx-auto max-w-[1920px] px-6 py-4">
					<div className="flex items-center justify-center gap-8">
						{/* Step 1: Set Scale */}
						<div className="flex items-center gap-3">
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
									hasScale
										? 'bg-blue-600 text-white'
										: 'bg-slate-200 text-slate-500'
								}`}
							>
								1
							</div>
							<div>
								<div
									className={`text-sm font-semibold ${
										hasScale ? 'text-slate-900' : 'text-slate-500'
									}`}
								>
									Set Scale
								</div>
								<div className="text-xs text-slate-500">Calibrate distance</div>
							</div>
						</div>

						<div className="h-px w-16 bg-slate-300" />

						{/* Step 2: Track Object */}
						<div className="flex items-center gap-3">
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
									hasTrackingPoints
										? 'bg-blue-600 text-white'
										: 'bg-slate-200 text-slate-500'
								}`}
							>
								2
							</div>
							<div>
								<div
									className={`text-sm font-semibold ${
										hasTrackingPoints ? 'text-slate-900' : 'text-slate-500'
									}`}
								>
									Track Object
								</div>
								<div className="text-xs text-slate-500">
									Click to place points
								</div>
							</div>
						</div>

						<div className="h-px w-16 bg-slate-300" />

						{/* Step 3: Review Path */}
						<div className="flex items-center gap-3">
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
									hasTrackingPoints && hasScale
										? 'bg-blue-600 text-white'
										: 'bg-slate-200 text-slate-500'
								}`}
							>
								3
							</div>
							<div>
								<div
									className={`text-sm font-semibold ${
										hasTrackingPoints && hasScale
											? 'text-slate-900'
											: 'text-slate-500'
									}`}
								>
									Review Path
								</div>
								<div className="text-xs text-slate-400">Verify trajectory</div>
							</div>
						</div>

						<div className="h-px w-16 bg-slate-300" />

						{/* Step 4: Export Data */}
						<div className="flex items-center gap-3">
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
									hasTrackingPoints && hasScale
										? 'bg-blue-600 text-white'
										: 'bg-slate-200 text-slate-500'
								}`}
							>
								4
							</div>
							<div>
								<div
									className={`text-sm font-semibold ${
										hasTrackingPoints && hasScale
											? 'text-slate-900'
											: 'text-slate-500'
									}`}
								>
									Export Data
								</div>
								<div className="text-xs text-slate-400">Download results</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="mx-auto max-w-[1920px] px-0 py-6">
				{isFullWidthLayout ? (
					/* Full Width Layout */
					<div className="flex flex-col gap-6">
						{/* Video Player */}
						<motion.div
							className="w-full space-y-4"
							layout
							layoutId="video-player-container"
							initial={false}
							transition={{
								layout: {
									duration: 0.4,
									ease: [0.4, 0, 0.2, 1],
								},
							}}
							style={{
								originX: 0,
								originY: 0,
							}}
						>
							{/* Video Player Container */}
							<VideoPlayer
								src={loaderData.videoSrc}
								videoId={loaderData.video.id}
								trackingPoints={loaderData.trackingPoints}
								trackingObjects={optimisticTrackingObjects}
								activeTrackingObjectId={activeTrackingObjectId}
								onActiveTrackingObjectChange={updateActiveTrackingObjectId}
								scale={loaderData.scale}
								isScaleCalibrationModeExternal={isScaleCalibrationMode}
								onScaleCalibrationModeChange={setIsScaleCalibrationMode}
								axis={loaderData.axis}
								isAxisConfigurationModeExternal={isAxisConfigurationMode}
								onAxisConfigurationModeChange={setIsAxisConfigurationMode}
								onCurrentTimeChange={setCurrentVideoTime}
								onSeekToFrameRef={(seekFn) => {
									seekToFrameRef.current = seekFn
								}}
							/>

							{/* Tools Bar - Step-based design */}
							<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
											Tools
										</span>
										<div className="h-6 w-px bg-slate-200" />
										<Button
											type="button"
											variant={isScaleCalibrationMode ? 'default' : 'outline'}
											size="default"
											className="gap-2"
											title="Set Scale"
											onClick={() =>
												setIsScaleCalibrationMode(!isScaleCalibrationMode)
											}
										>
											<Icon name="file" className="h-4 w-4" />
											Set Scale
										</Button>
										<Button
											type="button"
											variant={isAxisConfigurationMode ? 'default' : 'outline'}
											size="default"
											className="gap-2"
											title="Set Axis"
											onClick={() =>
												setIsAxisConfigurationMode(!isAxisConfigurationMode)
											}
										>
											<Icon name="crosshair-2" className="h-4 w-4" />
											Set Axis
										</Button>
										<Button
											type="button"
											variant="outline"
											size="default"
											className="gap-2"
											title="Track Object"
										>
											<Icon name="crosshair-2" className="h-4 w-4" />
											Track Object
										</Button>
										<div className="h-6 w-px bg-slate-200" />
										<Button
											type="button"
											variant="outline"
											size="default"
											className="gap-2"
											title={isFullWidthLayout ? 'Show Sidebar' : 'Full Width'}
											onClick={() => {
												const newLayout = !isFullWidthLayout
												setIsFullWidthLayout(newLayout)
												const formData = new FormData()
												formData.append(
													'layout',
													newLayout ? 'full-width' : 'split',
												)
												void layoutFetcher.submit(formData, {
													method: 'POST',
													action: '/resources/layout-switch',
												})
											}}
										>
											<Icon
												name={
													isFullWidthLayout
														? 'panel-right'
														: 'panel-right-minimized'
												}
												className="h-4 w-4"
											/>
											{isFullWidthLayout ? 'Show Sidebar' : 'Full Width'}
										</Button>
									</div>

									{/* Object selector */}
									<div className="flex items-center gap-2">
										<DropdownMenu modal={false}>
											<DropdownMenuTrigger asChild>
												<Button
													variant="outline"
													size="default"
													className="gap-2"
												>
													{activeTrackingObjectId ? (
														<>
															<div
																className="h-2 w-2 rounded-full"
																style={{
																	backgroundColor: getTrackingObjectColor(
																		activeTrackingObjectId,
																	),
																}}
															/>
															<span className="text-xs">
																{getTrackingObjectName(activeTrackingObjectId)}
															</span>
														</>
													) : (
														<>
															<Icon name="crosshair-2" className="h-3 w-3" />
															<span className="text-xs">Select Object</span>
														</>
													)}
													<Icon name="chevron-down" className="h-3 w-3" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												className="w-64"
												sideOffset={4}
												alignOffset={0}
											>
												<DropdownMenuLabel>Tracking Objects</DropdownMenuLabel>
												<DropdownMenuSeparator />
												{optimisticTrackingObjects.length === 0 ? (
													<DropdownMenuItem disabled>
														<span className="text-xs text-slate-500">
															No objects yet
														</span>
													</DropdownMenuItem>
												) : (
													optimisticTrackingObjects.map((obj) => (
														<DropdownMenuItem
															key={obj.id}
															onClick={(e) => {
																// Don't close dropdown or change active object when editing
																if (editingObjectId === obj.id) {
																	e.preventDefault()
																	return
																}
																updateActiveTrackingObjectId(obj.id)
															}}
															className="flex items-center gap-2"
															onSelect={(e) => {
																// Prevent dropdown from closing when editing
																if (editingObjectId === obj.id) {
																	e.preventDefault()
																}
															}}
														>
															<div
																className="h-2 w-2 cursor-pointer rounded-full transition-all hover:ring-2 hover:ring-slate-300"
																style={{
																	backgroundColor: getTrackingObjectColor(
																		obj.id,
																	),
																}}
																onClick={(e) => handleColorCircleClick(e, obj)}
																title="Click to change color"
															/>
															{editingObjectId === obj.id ? (
																<Input
																	type="text"
																	value={editName}
																	onChange={(e) => setEditName(e.target.value)}
																	onKeyDown={(e) => {
																		if (e.key === 'Enter') {
																			e.preventDefault()
																			e.stopPropagation()
																			handleUpdateTrackingObject(obj.id)
																		}
																		if (e.key === 'Escape') {
																			e.preventDefault()
																			e.stopPropagation()
																			setEditingObjectId(null)
																			setEditName('')
																			setEditColor('')
																		}
																	}}
																	onFocus={(e) => e.stopPropagation()}
																	onMouseDown={(e) => e.stopPropagation()}
																	onClick={(e) => e.stopPropagation()}
																	autoFocus
																	placeholder="Name"
																	className="h-6 flex-1 text-xs"
																/>
															) : (
																<span
																	className="flex-1 cursor-pointer"
																	onClick={(e) => {
																		e.stopPropagation()
																		updateActiveTrackingObjectId(obj.id)
																	}}
																	title="Click to select object"
																>
																	{getTrackingObjectName(obj.id)}
																</span>
															)}
															{editingObjectId === obj.id ? (
																<div className="flex items-center gap-1">
																	<label
																		className="relative cursor-pointer"
																		onClick={(e) => e.stopPropagation()}
																		onMouseDown={(e) => e.stopPropagation()}
																	>
																		<Input
																			ref={(el) => setColorInputRef(obj.id, el)}
																			type="color"
																			value={
																				editColor ||
																				getTrackingObjectColor(obj.id)
																			}
																			onChange={(e) => {
																				e.stopPropagation()
																				const newColor = e.target.value
																				setEditColor(newColor)
																				// Update optimistic state immediately
																				setOptimisticTrackingObjects((prev) =>
																					prev.map((o) =>
																						o.id === obj.id
																							? { ...o, color: newColor }
																							: o,
																					),
																				)
																				// Save to server
																				const formData: Record<string, string> =
																					{
																						intent: 'update-tracking-object',
																						videoId: loaderData.video.id,
																						trackingObjectId: obj.id,
																						name: editName.trim(),
																						color: newColor,
																					}
																				void trackingObjectsFetcher.submit(
																					formData,
																					{
																						method: 'POST',
																					},
																				)
																			}}
																			className="sr-only"
																			onClick={(e) => e.stopPropagation()}
																			onFocus={(e) => e.stopPropagation()}
																		/>
																		<div
																			className="h-6 w-6 cursor-pointer rounded border border-slate-300"
																			style={{
																				backgroundColor:
																					editColor ||
																					getTrackingObjectColor(obj.id),
																			}}
																			onClick={(e) => {
																				e.stopPropagation()
																				const colorInput =
																					colorInputRefs.current.get(obj.id)
																				colorInput?.click()
																			}}
																			title="Click to change color"
																		/>
																	</label>
																	<Button
																		size="sm"
																		variant="ghost"
																		onClick={(e) => {
																			e.stopPropagation()
																			handleUpdateTrackingObject(obj.id)
																		}}
																	>
																		<Icon name="check" className="h-3 w-3" />
																	</Button>
																	<Button
																		size="sm"
																		variant="ghost"
																		onClick={(e) => {
																			e.stopPropagation()
																			setEditingObjectId(null)
																			setEditName('')
																			setEditColor('')
																		}}
																	>
																		<Icon name="cross-1" className="h-3 w-3" />
																	</Button>
																</div>
															) : (
																<div className="flex items-center gap-1">
																	<Button
																		size="sm"
																		variant="ghost"
																		onClick={(e) => {
																			e.stopPropagation()
																			startEditing(obj)
																		}}
																	>
																		<Icon name="pencil-1" className="h-3 w-3" />
																	</Button>
																	<Button
																		size="sm"
																		variant="ghost"
																		onClick={(e) => {
																			e.stopPropagation()
																			setDeleteObjectId(obj.id)
																		}}
																		className="text-red-600 hover:bg-red-50 hover:text-red-700"
																	>
																		<Icon name="trash" className="h-3 w-3" />
																	</Button>
																</div>
															)}
														</DropdownMenuItem>
													))
												)}
												<DropdownMenuSeparator />
												<DropdownMenuItem onClick={handleCreateTrackingObject}>
													<Icon name="plus" className="mr-2 h-4 w-4" />
													Create New Object
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							</div>
						</motion.div>

						{/* Analytics Section - Full width mode */}
						<motion.div
							className="w-full"
							layout
							initial={false}
							transition={{
								layout: {
									duration: 0.4,
									ease: [0.4, 0, 0.2, 1],
								},
							}}
						>
							<FullAnalyticsSection />
						</motion.div>
					</div>
				) : (
					/* Split Layout */
					<div className="flex flex-col gap-6">
						{/* Top Row: Video Player and Sidebar */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
							{/* Video Player Column */}
							<motion.div
								className="space-y-4 lg:col-span-8"
								layout
								layoutId="video-player-container"
								initial={false}
								transition={{
									layout: {
										duration: 0.4,
										ease: [0.4, 0, 0.2, 1],
									},
								}}
								style={{
									originX: 0,
									originY: 0,
								}}
							>
								{/* Video Player Container */}
								<VideoPlayer
									src={loaderData.videoSrc}
									videoId={loaderData.video.id}
									trackingPoints={loaderData.trackingPoints}
									trackingObjects={optimisticTrackingObjects}
									activeTrackingObjectId={activeTrackingObjectId}
									onActiveTrackingObjectChange={updateActiveTrackingObjectId}
									scale={loaderData.scale}
									isScaleCalibrationModeExternal={isScaleCalibrationMode}
									onScaleCalibrationModeChange={setIsScaleCalibrationMode}
									onCurrentTimeChange={setCurrentVideoTime}
									onSeekToFrameRef={(seekFn) => {
										seekToFrameRef.current = seekFn
									}}
								/>

								{/* Tools Bar - Step-based design */}
								<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
												Tools
											</span>
											<div className="h-6 w-px bg-slate-200" />
											<Button
												type="button"
												variant={isScaleCalibrationMode ? 'default' : 'outline'}
												size="default"
												className="gap-2"
												title="Set Scale"
												onClick={() =>
													setIsScaleCalibrationMode(!isScaleCalibrationMode)
												}
											>
												<Icon name="file" className="h-4 w-4" />
												Set Scale
											</Button>
											<Button
												type="button"
												variant="outline"
												size="default"
												className="gap-2"
												title="Track Object"
											>
												<Icon name="crosshair-2" className="h-4 w-4" />
												Track Object
											</Button>
											<div className="h-6 w-px bg-slate-200" />
											<Button
												type="button"
												variant="outline"
												size="default"
												className="gap-2"
												title={
													isFullWidthLayout ? 'Show Sidebar' : 'Full Width'
												}
												onClick={() => {
													const newLayout = !isFullWidthLayout
													setIsFullWidthLayout(newLayout)
													const formData = new FormData()
													formData.append(
														'layout',
														newLayout ? 'full-width' : 'split',
													)
													void layoutFetcher.submit(formData, {
														method: 'POST',
														action: '/resources/layout-switch',
													})
												}}
											>
												<Icon
													name={
														isFullWidthLayout
															? 'panel-right'
															: 'panel-right-minimized'
													}
													className="h-4 w-4"
												/>
												{isFullWidthLayout ? 'Show Sidebar' : 'Full Width'}
											</Button>
										</div>

										{/* Object selector */}
										<div className="flex items-center gap-2">
											<DropdownMenu modal={false}>
												<DropdownMenuTrigger asChild>
													<Button
														variant="outline"
														size="default"
														className="gap-2"
													>
														{activeTrackingObjectId ? (
															<>
																<div
																	className="h-2 w-2 rounded-full"
																	style={{
																		backgroundColor: getTrackingObjectColor(
																			activeTrackingObjectId,
																		),
																	}}
																/>
																<span className="text-xs">
																	{getTrackingObjectName(
																		activeTrackingObjectId,
																	)}
																</span>
															</>
														) : (
															<>
																<Icon name="crosshair-2" className="h-3 w-3" />
																<span className="text-xs">Select Object</span>
															</>
														)}
														<Icon name="chevron-down" className="h-3 w-3" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent
													align="end"
													className="w-64"
													sideOffset={4}
													alignOffset={0}
												>
													<DropdownMenuLabel>
														Tracking Objects
													</DropdownMenuLabel>
													<DropdownMenuSeparator />
													{optimisticTrackingObjects.length === 0 ? (
														<DropdownMenuItem disabled>
															<span className="text-xs text-slate-500">
																No objects yet
															</span>
														</DropdownMenuItem>
													) : (
														optimisticTrackingObjects.map((obj) => (
															<DropdownMenuItem
																key={obj.id}
																onClick={(e) => {
																	if (editingObjectId === obj.id) {
																		e.preventDefault()
																		return
																	}
																	updateActiveTrackingObjectId(obj.id)
																}}
																className="flex items-center gap-2"
																onSelect={(e) => {
																	if (editingObjectId === obj.id) {
																		e.preventDefault()
																	}
																}}
															>
																<div
																	className="h-2 w-2 cursor-pointer rounded-full transition-all hover:ring-2 hover:ring-slate-300"
																	style={{
																		backgroundColor: getTrackingObjectColor(
																			obj.id,
																		),
																	}}
																	onClick={(e) =>
																		handleColorCircleClick(e, obj)
																	}
																	title="Click to change color"
																/>
																{editingObjectId === obj.id ? (
																	<Input
																		type="text"
																		value={editName}
																		onChange={(e) =>
																			setEditName(e.target.value)
																		}
																		onKeyDown={(e) => {
																			if (e.key === 'Enter') {
																				e.preventDefault()
																				e.stopPropagation()
																				handleUpdateTrackingObject(obj.id)
																			}
																			if (e.key === 'Escape') {
																				e.preventDefault()
																				e.stopPropagation()
																				setEditingObjectId(null)
																				setEditName('')
																				setEditColor('')
																			}
																		}}
																		onFocus={(e) => e.stopPropagation()}
																		onMouseDown={(e) => e.stopPropagation()}
																		onClick={(e) => e.stopPropagation()}
																		autoFocus
																		placeholder="Name"
																		className="h-6 flex-1 text-xs"
																	/>
																) : (
																	<span
																		className="flex-1 cursor-pointer"
																		onClick={(e) => {
																			e.stopPropagation()
																			updateActiveTrackingObjectId(obj.id)
																		}}
																		title="Click to select object"
																	>
																		{getTrackingObjectName(obj.id)}
																	</span>
																)}
																{editingObjectId === obj.id ? (
																	<div className="flex items-center gap-1">
																		<label
																			className="relative cursor-pointer"
																			onClick={(e) => e.stopPropagation()}
																			onMouseDown={(e) => e.stopPropagation()}
																		>
																			<Input
																				ref={(el) =>
																					setColorInputRef(obj.id, el)
																				}
																				type="color"
																				value={
																					editColor ||
																					getTrackingObjectColor(obj.id)
																				}
																				onChange={(e) => {
																					e.stopPropagation()
																					const newColor = e.target.value
																					setEditColor(newColor)
																					// Update optimistic state immediately
																					setOptimisticTrackingObjects((prev) =>
																						prev.map((o) =>
																							o.id === obj.id
																								? { ...o, color: newColor }
																								: o,
																						),
																					)
																					// Save to server
																					const formData: Record<
																						string,
																						string
																					> = {
																						intent: 'update-tracking-object',
																						videoId: loaderData.video.id,
																						trackingObjectId: obj.id,
																						name: editName.trim(),
																						color: newColor,
																					}
																					void trackingObjectsFetcher.submit(
																						formData,
																						{
																							method: 'POST',
																						},
																					)
																				}}
																				className="sr-only"
																				onClick={(e) => e.stopPropagation()}
																				onFocus={(e) => e.stopPropagation()}
																			/>
																			<div
																				className="h-6 w-6 cursor-pointer rounded border border-slate-300"
																				style={{
																					backgroundColor:
																						editColor ||
																						getTrackingObjectColor(obj.id),
																				}}
																				onClick={(e) => {
																					e.stopPropagation()
																					const colorInput =
																						colorInputRefs.current.get(obj.id)
																					colorInput?.click()
																				}}
																				title="Click to change color"
																			/>
																		</label>
																		<Button
																			size="sm"
																			variant="ghost"
																			onClick={(e) => {
																				e.stopPropagation()
																				handleUpdateTrackingObject(obj.id)
																			}}
																		>
																			<Icon name="check" className="h-3 w-3" />
																		</Button>
																		<Button
																			size="sm"
																			variant="ghost"
																			onClick={(e) => {
																				e.stopPropagation()
																				setEditingObjectId(null)
																				setEditName('')
																				setEditColor('')
																			}}
																		>
																			<Icon
																				name="cross-1"
																				className="h-3 w-3"
																			/>
																		</Button>
																	</div>
																) : (
																	<div className="flex items-center gap-1">
																		<Button
																			size="sm"
																			variant="ghost"
																			onClick={(e) => {
																				e.stopPropagation()
																				startEditing(obj)
																			}}
																		>
																			<Icon
																				name="pencil-1"
																				className="h-3 w-3"
																			/>
																		</Button>
																		<Button
																			size="sm"
																			variant="ghost"
																			onClick={(e) => {
																				e.stopPropagation()
																				setDeleteObjectId(obj.id)
																			}}
																			className="text-red-600 hover:bg-red-50 hover:text-red-700"
																		>
																			<Icon name="trash" className="h-3 w-3" />
																		</Button>
																	</div>
																)}
															</DropdownMenuItem>
														))
													)}
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={handleCreateTrackingObject}
													>
														<Icon name="plus" className="mr-2 h-4 w-4" />
														Create New Object
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								</div>
							</motion.div>

							{/* Right Column: Metrics and Data Table */}
							<motion.div
								className="lg:col-span-4"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.3, ease: 'easeInOut' }}
							>
								<MetricsAndDataTable />
							</motion.div>
						</div>

						{/* Graph Section - Below video player in split mode */}
						<div className="lg:col-span-8">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, ease: 'easeInOut' }}
							>
								<GraphSection />
							</motion.div>
						</div>
					</div>
				)}
			</div>

			{/* Delete Tracking Object Confirmation Dialog */}
			{deleteObjectId !== null &&
				(() => {
					const objectId = deleteObjectId!
					return (
						<AlertDialog
							open={true}
							onOpenChange={(open: boolean) => {
								if (!open) setDeleteObjectId(null)
							}}
						>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Delete Tracking Object</AlertDialogTitle>
									<AlertDialogDescription>
										Are you sure you want to delete "
										{getTrackingObjectName(objectId)}"? This will permanently
										delete all tracking points associated with this object and
										cannot be undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => {
											handleDeleteTrackingObject(objectId)
										}}
										className="bg-red-600 hover:bg-red-700"
									>
										Delete
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)
				})()}
			{showClearPointsDialog && (
				<AlertDialog
					open={showClearPointsDialog}
					onOpenChange={(open: boolean) => {
						setShowClearPointsDialog(open)
					}}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Clear All Tracking Points</AlertDialogTitle>
							<AlertDialogDescription>
								Are you sure you want to clear all tracking points? This will
								permanently delete all tracking points and tracking objects for
								this video and cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleClearAllPoints}
								className="bg-red-600 hover:bg-red-700"
							>
								Clear All Points
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
			{showCreateObjectDialog && (
				<AlertDialog
					open={showCreateObjectDialog}
					onOpenChange={(open: boolean) => {
						setShowCreateObjectDialog(open)
						if (!open) {
							setNewObjectName('')
							setNewObjectColor('')
						}
					}}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Create New Tracking Object</AlertDialogTitle>
							<AlertDialogDescription>
								Set a name and color for the new tracking object.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<div className="flex flex-col gap-4 py-4">
							<div className="flex flex-col gap-2">
								<label
									htmlFor="new-object-name"
									className="text-sm font-medium text-slate-700"
								>
									Name
								</label>
								<Input
									id="new-object-name"
									type="text"
									value={newObjectName}
									onChange={(e) => setNewObjectName(e.target.value)}
									placeholder="Object name (optional)"
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault()
											handleCreateObjectSubmit()
										}
									}}
									autoFocus
								/>
							</div>
							<div className="flex flex-col gap-2">
								<label
									htmlFor="new-object-color"
									className="text-sm font-medium text-slate-700"
								>
									Color
								</label>
								<div className="flex items-center gap-3">
									<Input
										id="new-object-color"
										type="color"
										value={newObjectColor || '#3b82f6'}
										onChange={(e) => setNewObjectColor(e.target.value)}
										className="h-10 w-20 cursor-pointer"
									/>
									<span className="text-sm text-slate-500">
										{newObjectColor || 'Default color will be generated'}
									</span>
								</div>
							</div>
						</div>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={handleCreateObjectSubmit}>
								Create Object
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</div>
	)
}
