import { invariantResponse } from '@epic-web/invariant'
import { motion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import { VideoPlayer } from '#app/components/video-player.tsx'
import { GraphSection } from '#app/components/video-route/graph-section.tsx'
import { MetricsAndDataTable } from '#app/components/video-route/metrics-and-data-table.tsx'
import {
	ClearPointsDialog,
	CreateTrackingObjectDialog,
	DeleteTrackingObjectDialog,
} from '#app/components/video-route/tracking-object-dialogs.tsx'
import { VideoToolsBar } from '#app/components/video-route/video-tools-bar.tsx'
import { WorkflowStepper } from '#app/components/video-route/workflow-stepper.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getVideoSrc } from '#app/utils/misc.tsx'
import { getActiveTrackingObjectId } from '#app/utils/tracking-object-selection.server.ts'
import { generateTrackingDataCSV } from '#app/utils/tracking-data-csv.ts'
import { action } from './$videoId.actions.server.ts'
import {
	useTrackingObjects,
	useVideoLayout,
	useVideoTools,
} from './$videoId.hooks.ts'
import { type Route } from './+types/$videoId.ts'

export { action, generateTrackingDataCSV }

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

export default function VideoRoute({ loaderData }: Route.ComponentProps) {
	const [currentAxis, setCurrentAxis] = useState(loaderData.axis)
	const [isMetricsCollapsed, setIsMetricsCollapsed] = useState(false)
	const [currentVideoTime, setCurrentVideoTime] = useState(0)
	const seekToFrameRef = useRef<((frame: number) => void) | null>(null)

	// Custom hooks
	const trackingObjectsHook = useTrackingObjects(
		loaderData.video.id,
		loaderData.trackingObjects,
		loaderData.activeTrackingObjectId ?? null,
	)

	const { isFullWidthLayout, handleLayoutToggle, layoutFetcher } =
		useVideoLayout()

	const {
		activeTool,
		isScaleCalibrationMode,
		isAxisConfigurationMode,
		setIsScaleCalibrationMode,
		setIsAxisConfigurationMode,
		handleToolChange,
	} = useVideoTools()

	// Memoize axis change handler to prevent unnecessary re-renders
	const handleAxisChange = useCallback((axis: typeof loaderData.axis) => {
		setCurrentAxis(axis)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Calculate current frame from video time (30 fps)
	const currentFrame = Math.floor(currentVideoTime * 30)

	// Determine workflow step based on current state
	const hasScale = loaderData.scale !== null
	const hasTrackingPoints = loaderData.trackingPoints.length > 0

	return (
		<div className="min-h-screen bg-slate-50">
			<WorkflowStepper
				hasScale={hasScale}
				hasTrackingPoints={hasTrackingPoints}
			/>

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
							<div className="flex flex-col gap-4">
								{loaderData.axis && (
									<div className="flex flex-col gap-2">
										<div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
											Axis
										</div>
										<div className="text-xs text-slate-500">
											{loaderData.axis.originX}, {loaderData.axis.originY}{' '}
											{loaderData.axis.rotationAngle}
										</div>
									</div>
								)}
							</div>
							<VideoPlayer
								src={loaderData.videoSrc}
								videoId={loaderData.video.id}
								trackingPoints={loaderData.trackingPoints}
								trackingObjects={trackingObjectsHook.optimisticTrackingObjects}
								activeTrackingObjectId={
									trackingObjectsHook.activeTrackingObjectId
								}
								onActiveTrackingObjectChange={
									trackingObjectsHook.updateActiveTrackingObjectId
								}
								scale={loaderData.scale}
								isScaleCalibrationModeExternal={isScaleCalibrationMode}
								onScaleCalibrationModeChange={setIsScaleCalibrationMode}
								axis={loaderData.axis}
								isAxisConfigurationModeExternal={isAxisConfigurationMode}
								onAxisConfigurationModeChange={setIsAxisConfigurationMode}
								onAxisChange={handleAxisChange}
								onCurrentTimeChange={setCurrentVideoTime}
								onSeekToFrameRef={(seekFn) => {
									seekToFrameRef.current = seekFn
								}}
								activeTool={activeTool}
							/>

							<VideoToolsBar
								activeTool={activeTool}
								onToolChange={handleToolChange}
								isFullWidthLayout={isFullWidthLayout}
								onLayoutToggle={handleLayoutToggle}
								layoutFetcher={layoutFetcher}
								activeTrackingObjectId={
									trackingObjectsHook.activeTrackingObjectId
								}
								trackingObjects={trackingObjectsHook.optimisticTrackingObjects}
								getTrackingObjectName={
									trackingObjectsHook.getTrackingObjectName
								}
								getTrackingObjectColor={
									trackingObjectsHook.getTrackingObjectColor
								}
								onActiveTrackingObjectChange={
									trackingObjectsHook.updateActiveTrackingObjectId
								}
								editingObjectId={trackingObjectsHook.editingObjectId}
								editName={trackingObjectsHook.editName}
								editColor={trackingObjectsHook.editColor}
								onEditNameChange={trackingObjectsHook.setEditName}
								onEditColorChange={trackingObjectsHook.setEditColor}
								onStartEditing={trackingObjectsHook.startEditing}
								onUpdateTrackingObject={
									trackingObjectsHook.handleUpdateTrackingObject
								}
								onDeleteTrackingObject={(id) => {
									trackingObjectsHook.setDeleteObjectId(id)
								}}
								onCreateTrackingObject={
									trackingObjectsHook.handleCreateTrackingObject
								}
								onCancelEditing={() => {
									trackingObjectsHook.setEditingObjectId(null)
									trackingObjectsHook.setEditName('')
									trackingObjectsHook.setEditColor('')
								}}
								colorInputRefs={trackingObjectsHook.colorInputRefs}
								onColorCircleClick={trackingObjectsHook.handleColorCircleClick}
								setColorInputRef={trackingObjectsHook.setColorInputRef}
								videoId={loaderData.video.id}
								trackingObjectsFetcher={
									trackingObjectsHook.trackingObjectsFetcher
								}
								setOptimisticTrackingObjects={
									trackingObjectsHook.setOptimisticTrackingObjects
								}
							/>
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
							<div className="flex flex-col gap-4">
								<MetricsAndDataTable
									trackingPoints={loaderData.trackingPoints}
									scale={loaderData.scale}
									axis={currentAxis}
									currentFrame={currentFrame}
									onSeekToFrame={seekToFrameRef.current}
									isMetricsCollapsed={isMetricsCollapsed}
									onMetricsCollapsedChange={setIsMetricsCollapsed}
								/>
								<GraphSection
									trackingPoints={loaderData.trackingPoints}
									trackingObjects={
										trackingObjectsHook.optimisticTrackingObjects
									}
									scale={loaderData.scale}
									axis={currentAxis}
									activeTool={activeTool}
								/>
							</div>
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
								<VideoPlayer
									src={loaderData.videoSrc}
									videoId={loaderData.video.id}
									trackingPoints={loaderData.trackingPoints}
									trackingObjects={
										trackingObjectsHook.optimisticTrackingObjects
									}
									activeTrackingObjectId={
										trackingObjectsHook.activeTrackingObjectId
									}
									onActiveTrackingObjectChange={
										trackingObjectsHook.updateActiveTrackingObjectId
									}
									scale={loaderData.scale}
									isScaleCalibrationModeExternal={isScaleCalibrationMode}
									onScaleCalibrationModeChange={setIsScaleCalibrationMode}
									axis={loaderData.axis}
									isAxisConfigurationModeExternal={isAxisConfigurationMode}
									onAxisConfigurationModeChange={setIsAxisConfigurationMode}
									onAxisChange={handleAxisChange}
									onCurrentTimeChange={setCurrentVideoTime}
									onSeekToFrameRef={(seekFn) => {
										seekToFrameRef.current = seekFn
									}}
									activeTool={activeTool}
								/>

								<VideoToolsBar
									activeTool={activeTool}
									onToolChange={handleToolChange}
									isFullWidthLayout={isFullWidthLayout}
									onLayoutToggle={handleLayoutToggle}
									layoutFetcher={layoutFetcher}
									activeTrackingObjectId={
										trackingObjectsHook.activeTrackingObjectId
									}
									trackingObjects={
										trackingObjectsHook.optimisticTrackingObjects
									}
									getTrackingObjectName={
										trackingObjectsHook.getTrackingObjectName
									}
									getTrackingObjectColor={
										trackingObjectsHook.getTrackingObjectColor
									}
									onActiveTrackingObjectChange={
										trackingObjectsHook.updateActiveTrackingObjectId
									}
									editingObjectId={trackingObjectsHook.editingObjectId}
									editName={trackingObjectsHook.editName}
									editColor={trackingObjectsHook.editColor}
									onEditNameChange={trackingObjectsHook.setEditName}
									onEditColorChange={trackingObjectsHook.setEditColor}
									onStartEditing={trackingObjectsHook.startEditing}
									onUpdateTrackingObject={
										trackingObjectsHook.handleUpdateTrackingObject
									}
									onDeleteTrackingObject={(id) => {
										trackingObjectsHook.setDeleteObjectId(id)
									}}
									onCreateTrackingObject={
										trackingObjectsHook.handleCreateTrackingObject
									}
									onCancelEditing={() => {
										trackingObjectsHook.setEditingObjectId(null)
										trackingObjectsHook.setEditName('')
										trackingObjectsHook.setEditColor('')
									}}
									colorInputRefs={trackingObjectsHook.colorInputRefs}
									onColorCircleClick={
										trackingObjectsHook.handleColorCircleClick
									}
									setColorInputRef={trackingObjectsHook.setColorInputRef}
									videoId={loaderData.video.id}
									trackingObjectsFetcher={
										trackingObjectsHook.trackingObjectsFetcher
									}
									setOptimisticTrackingObjects={
										trackingObjectsHook.setOptimisticTrackingObjects
									}
								/>
							</motion.div>

							{/* Right Column: Metrics and Data Table */}
							<motion.div
								className="lg:col-span-4"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.3, ease: 'easeInOut' }}
							>
								<MetricsAndDataTable
									trackingPoints={loaderData.trackingPoints}
									scale={loaderData.scale}
									axis={currentAxis}
									currentFrame={currentFrame}
									onSeekToFrame={seekToFrameRef.current}
									isMetricsCollapsed={isMetricsCollapsed}
									onMetricsCollapsedChange={setIsMetricsCollapsed}
								/>
							</motion.div>
						</div>

						{/* Graph Section - Below video player in split mode */}
						<div className="lg:col-span-8">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, ease: 'easeInOut' }}
							>
								<GraphSection
									trackingPoints={loaderData.trackingPoints}
									trackingObjects={
										trackingObjectsHook.optimisticTrackingObjects
									}
									scale={loaderData.scale}
									axis={currentAxis}
									activeTool={activeTool}
								/>
							</motion.div>
						</div>
					</div>
				)}
			</div>

			{/* Dialogs */}
			<DeleteTrackingObjectDialog
				deleteObjectId={trackingObjectsHook.deleteObjectId}
				onClose={() => trackingObjectsHook.setDeleteObjectId(null)}
				onConfirm={trackingObjectsHook.handleDeleteTrackingObject}
				getTrackingObjectName={trackingObjectsHook.getTrackingObjectName}
			/>
			<ClearPointsDialog
				open={trackingObjectsHook.showClearPointsDialog}
				onClose={() => trackingObjectsHook.setShowClearPointsDialog(false)}
				onConfirm={trackingObjectsHook.handleClearAllPoints}
			/>
			<CreateTrackingObjectDialog
				open={trackingObjectsHook.showCreateObjectDialog}
				onClose={() => {
					trackingObjectsHook.setShowCreateObjectDialog(false)
					trackingObjectsHook.setNewObjectName('')
					trackingObjectsHook.setNewObjectColor('')
				}}
				onConfirm={trackingObjectsHook.handleCreateObjectSubmit}
				newObjectName={trackingObjectsHook.newObjectName}
				newObjectColor={trackingObjectsHook.newObjectColor}
				onNameChange={trackingObjectsHook.setNewObjectName}
				onColorChange={trackingObjectsHook.setNewObjectColor}
			/>
		</div>
	)
}
