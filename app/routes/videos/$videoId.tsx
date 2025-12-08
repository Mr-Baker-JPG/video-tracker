import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { useState } from 'react'
import { data, Link, useFetcher } from 'react-router'
import { z } from 'zod'
import { AccelerationVsTimeGraph } from '#app/components/acceleration-vs-time-graph.tsx'
import { PositionVsTimeGraph } from '#app/components/position-vs-time-graph.tsx'
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
	name: z.string().optional(),
	color: z.string().optional(),
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

	const videoSrc = getVideoSrc(video.url)

	return { video, videoSrc, trackingPoints, trackingObjects, scale }
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

		invariantResponse(
			existingObject,
			'Tracking object not found',
			{ status: 404 },
		)

		// Update tracking object
		const trackingObject = await prisma.trackingObject.update({
			where: {
				videoId_id: {
					videoId,
					id: trackingObjectId,
				},
			},
			data: {
				...(name !== undefined && { name }),
				...(color !== undefined && { color }),
			},
			select: {
				id: true,
				name: true,
				color: true,
			},
		})

		return data({ success: true, trackingObject })
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
	const [activeTrackingObjectId, setActiveTrackingObjectId] = useState<
		string | null
	>(null)
	const [editingObjectId, setEditingObjectId] = useState<string | null>(null)
	const [editName, setEditName] = useState('')
	const [editColor, setEditColor] = useState('')
	const trackingObjectsFetcher = useFetcher()

	// Helper to get tracking object name
	const getTrackingObjectName = (id: string): string => {
		const obj = loaderData.trackingObjects.find((o) => o.id === id)
		return obj?.name || `Object ${id.slice(-6)}`
	}

	// Helper to get tracking object color
	const getTrackingObjectColor = (id: string): string => {
		const obj = loaderData.trackingObjects.find((o) => o.id === id)
		if (obj?.color) return obj.color
		// Generate color from ID hash
		const hash = id.split('').reduce((acc, char) => {
			return char.charCodeAt(0) + ((acc << 5) - acc)
		}, 0)
		const hue = Math.abs(hash) % 360
		return `hsl(${hue}, 70%, 50%)`
	}

	const handleCreateTrackingObject = () => {
		void trackingObjectsFetcher.submit(
			{
				intent: 'create-tracking-object',
				videoId: loaderData.video.id,
			},
			{ method: 'POST' },
		)
	}

	const handleUpdateTrackingObject = (id: string) => {
		if (!editName.trim() && !editColor.trim()) {
			setEditingObjectId(null)
			return
		}
		void trackingObjectsFetcher.submit(
			{
				intent: 'update-tracking-object',
				videoId: loaderData.video.id,
				trackingObjectId: id,
				...(editName.trim() && { name: editName.trim() }),
				...(editColor.trim() && { color: editColor.trim() }),
			},
			{ method: 'POST' },
		)
		setEditingObjectId(null)
		setEditName('')
		setEditColor('')
	}

	const startEditing = (obj: { id: string; name: string | null; color: string | null }) => {
		setEditingObjectId(obj.id)
		setEditName(obj.name || '')
		setEditColor(obj.color || '')
	}

	// Sort points by frame for display
	const sortedPoints = [...loaderData.trackingPoints].sort(
		(a, b) => a.frame - b.frame,
	)
	// For now, highlight the first point - in the future this could be based on video player state
	const currentFrame = sortedPoints[0]?.frame ?? 0

	return (
		<div className="flex flex-col gap-6">
			{/* Breadcrumb Navigation */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 text-sm text-slate-500">
					<Link
						to="/videos"
						className="flex items-center gap-1 transition-colors hover:text-slate-900"
					>
						<div className="rounded p-1 transition-colors hover:bg-slate-200">
							<Icon name="arrow-left" className="h-4 w-4" />
						</div>
						Dashboard
					</Link>
					<span className="text-slate-300">/</span>
					<span className="font-semibold text-slate-900">
						{loaderData.video.filename}
					</span>
				</div>

				<div className="flex items-center gap-2">
					{/* Auto-save indicator */}
					{(loaderData.trackingPoints.length > 0 || loaderData.scale) && (
						<div className="flex items-center gap-1.5 text-xs text-slate-500">
							<Icon name="check" className="h-3 w-3 text-green-600" />
							<span className="hidden sm:inline">All changes saved</span>
						</div>
					)}
					<button
						type="button"
						className="hover:text-primary flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors"
					>
						<Icon name="question-mark-circled" className="h-3 w-3" />
						Show Guide
					</button>
					<Button asChild variant="default" size="sm">
						<Link
							to={`/resources/export-tracking-data?videoId=${encodeURIComponent(loaderData.video.id)}`}
						>
							<Icon name="download" className="h-3 w-3" />
							Export Data
						</Link>
					</Button>
				</div>
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				{/* Left Column: Video Player */}
				<div className="space-y-3 lg:col-span-8">
					{/* Tools Bar */}
					<div className="relative z-10 flex items-center justify-between rounded-t-lg border-x border-t border-b-0 border-slate-200 bg-white px-3 py-2 shadow-sm">
						<div className="flex items-center gap-1">
							<span className="mr-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
								Tools
							</span>
							<Button
								type="button"
								variant={isScaleCalibrationMode ? 'default' : 'secondary'}
								size="sm"
								className="group"
								title="Set Scale"
								onClick={() =>
									setIsScaleCalibrationMode(!isScaleCalibrationMode)
								}
							>
								<Icon
									name="file"
									className="mr-2 h-4 w-4 text-slate-500 transition-colors group-hover:text-slate-900"
								/>
								<span className="hidden sm:inline">Set Scale</span>
							</Button>
							<Button
								type="button"
								variant="default"
								size="sm"
								title="Track Object"
							>
								<Icon name="crosshair-2" className="mr-2 h-4 w-4" />
								<span className="hidden sm:inline">Track</span>
							</Button>
							<div className="mx-1 h-5 w-px bg-slate-200" />
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="text-slate-400 hover:bg-red-50 hover:text-red-500"
								title="Clear Points"
							>
								<Icon name="trash" className="h-4 w-4" />
							</Button>
						</div>

						<div className="flex items-center gap-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="gap-2">
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
								<DropdownMenuContent align="end" className="w-56">
									<DropdownMenuLabel>Tracking Objects</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{loaderData.trackingObjects.length === 0 ? (
										<DropdownMenuItem disabled>
											<span className="text-xs text-slate-500">
												No objects yet
											</span>
										</DropdownMenuItem>
									) : (
										loaderData.trackingObjects.map((obj) => (
											<DropdownMenuItem
												key={obj.id}
												onClick={() => setActiveTrackingObjectId(obj.id)}
												className="flex items-center gap-2"
											>
												<div
													className="h-2 w-2 rounded-full"
													style={{
														backgroundColor: getTrackingObjectColor(obj.id),
													}}
												/>
												<span className="flex-1">
													{getTrackingObjectName(obj.id)}
												</span>
												{editingObjectId === obj.id ? (
													<div className="flex items-center gap-1">
														<Input
															type="text"
															value={editName}
															onChange={(e) => setEditName(e.target.value)}
															placeholder="Name"
															className="h-6 w-20 text-xs"
															onClick={(e) => e.stopPropagation()}
														/>
														<Input
															type="color"
															value={editColor || '#000000'}
															onChange={(e) => setEditColor(e.target.value)}
															className="h-6 w-10"
															onClick={(e) => e.stopPropagation()}
														/>
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
													</div>
												) : (
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

					{/* Video Player Container */}
					<div className="group relative w-full overflow-hidden rounded-b-lg border-x border-b border-slate-200 bg-slate-900 shadow-lg">
					<VideoPlayer
						src={loaderData.videoSrc}
						videoId={loaderData.video.id}
						trackingPoints={loaderData.trackingPoints}
						trackingObjects={loaderData.trackingObjects}
						activeTrackingObjectId={activeTrackingObjectId}
						onActiveTrackingObjectChange={setActiveTrackingObjectId}
						scale={loaderData.scale}
						className="aspect-video"
						isScaleCalibrationModeExternal={isScaleCalibrationMode}
						onScaleCalibrationModeChange={setIsScaleCalibrationMode}
					/>
					</div>
				</div>

				{/* Right Column: Sidebar */}
				<div className="flex flex-col gap-4 lg:col-span-4">
					{/* Analysis Graph */}
					<div className="flex min-h-[300px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
						<Tabs defaultValue="position" className="flex h-full flex-col">
							<div className="flex items-center justify-between rounded-t-xl border-b bg-slate-50 p-3">
								<h3 className="text-sm font-semibold text-slate-800">
									Analysis Graph
								</h3>
								<TabsList className="grid w-auto grid-cols-3">
									<TabsTrigger value="position">Position</TabsTrigger>
									<TabsTrigger value="velocity">Velocity</TabsTrigger>
									<TabsTrigger value="acceleration">Acceleration</TabsTrigger>
								</TabsList>
							</div>
							<div className="flex-1 p-4">
								<TabsContent
									value="position"
									className="mt-0 flex-1 overflow-hidden"
								>
								<PositionVsTimeGraph
									trackingPoints={loaderData.trackingPoints}
									trackingObjects={loaderData.trackingObjects}
									scale={loaderData.scale}
								/>
								</TabsContent>
								<TabsContent
									value="velocity"
									className="mt-0 flex-1 overflow-hidden"
								>
								<VelocityVsTimeGraph
									trackingPoints={loaderData.trackingPoints}
									trackingObjects={loaderData.trackingObjects}
									scale={loaderData.scale}
								/>
								</TabsContent>
								<TabsContent
									value="acceleration"
									className="mt-0 flex-1 overflow-hidden"
								>
								<AccelerationVsTimeGraph
									trackingPoints={loaderData.trackingPoints}
									trackingObjects={loaderData.trackingObjects}
									scale={loaderData.scale}
								/>
								</TabsContent>
							</div>
						</Tabs>
					</div>

					{/* Data Points Table */}
					<div className="flex max-h-[400px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
						<div className="flex items-center justify-between border-b bg-slate-50 p-3">
							<h3 className="text-sm font-semibold text-slate-800">
								Data Points
							</h3>
							<span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
								{loaderData.trackingPoints.length} pts
							</span>
						</div>
						<ScrollArea className="flex-1">
							<table className="w-full text-left text-xs">
								<thead className="sticky top-0 z-10 border-b bg-slate-50/95 font-medium text-slate-500 backdrop-blur">
									<tr>
										<th className="px-4 py-2">Frame</th>
										<th className="px-4 py-2">Time (s)</th>
										<th className="px-4 py-2">X (m)</th>
										<th className="px-4 py-2">Y (m)</th>
									</tr>
								</thead>
								<tbody className="divide-y text-slate-700">
									{sortedPoints.map((point, index) => {
										const time = point.frame / 30
										const xMeters = loaderData.scale
											? point.x / loaderData.scale.pixelsPerMeter
											: point.x
										const yMeters = loaderData.scale
											? point.y / loaderData.scale.pixelsPerMeter
											: point.y
										const isCurrent =
											index ===
											sortedPoints.findIndex((p) => p.frame === currentFrame)

										return (
											<tr
												key={point.id}
												className={
													isCurrent
														? 'bg-primary-light/20 ring-primary-light ring-1 ring-inset'
														: index % 2 === 0
															? 'bg-blue-50/50'
															: ''
												}
											>
												<td
													className={`px-4 py-2 font-mono ${
														isCurrent
															? 'text-primary font-bold'
															: 'text-slate-400'
													}`}
												>
													{point.frame}
												</td>
												<td
													className={`px-4 py-2 font-mono ${
														isCurrent ? 'font-bold' : ''
													}`}
												>
													{time.toFixed(2)}
												</td>
												<td
													className={`px-4 py-2 font-mono ${
														isCurrent ? 'font-bold' : ''
													}`}
												>
													{loaderData.scale
														? xMeters.toFixed(2)
														: point.x.toFixed(2)}
												</td>
												<td
													className={`px-4 py-2 font-mono ${
														isCurrent ? 'font-bold' : ''
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
			</div>
		</div>
	)
}
