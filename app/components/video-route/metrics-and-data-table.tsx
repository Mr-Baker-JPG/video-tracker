import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Icon } from '#app/components/ui/icon.tsx'
import { ScrollArea } from '#app/components/ui/scroll-area.tsx'
import { VideoAnalysisDashboard } from '#app/components/video-analysis-dashboard.tsx'
import { transformToAxisCoordinates } from '#app/utils/coordinate-transform.ts'
import { FullscreenModal } from '#app/components/video-route/fullscreen-modal.tsx'
import type {
	TrackingPoint,
	VideoAxis,
	VideoScale,
} from '#app/routes/videos/$videoId.types.ts'

type MetricsAndDataTableProps = {
	trackingPoints: TrackingPoint[]
	scale: VideoScale | null
	axis: VideoAxis | null
	currentFrame: number
	onSeekToFrame: ((frame: number) => void) | null
	isMetricsCollapsed: boolean
	onMetricsCollapsedChange: (collapsed: boolean) => void
}

// Extract table rendering to a reusable component
function DataTableContent({
	trackingPoints,
	scale,
	axis,
	currentFrame,
	onSeekToFrame,
}: {
	trackingPoints: TrackingPoint[]
	scale: VideoScale | null
	axis: VideoAxis | null
	currentFrame: number
	onSeekToFrame: ((frame: number) => void) | null
}) {
	// Sort points by frame for display
	const sortedPoints = [...trackingPoints].sort((a, b) => a.frame - b.frame)

	return (
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

						// Transform coordinates if axis is configured
						let x = point.x
						let y = point.y
						if (axis) {
							const transformed = transformToAxisCoordinates(
								point.x,
								point.y,
								axis,
							)
							x = transformed.x
							y = transformed.y
						}

						const xMeters = scale ? x / scale.pixelsPerMeter : x
						const yMeters = scale ? y / scale.pixelsPerMeter : y
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
										if (onSeekToFrame) {
											// Frame numbers are 0-indexed in the data, but goToFrame expects 1-indexed
											onSeekToFrame(point.frame + 1)
										}
									}}
									title={
										!isCurrent ? 'Click to seek to this frame' : 'Current frame'
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
									{scale ? xMeters.toFixed(2) : x.toFixed(2)}
								</td>
								<td
									className={`px-4 py-2 font-mono ${
										isCurrent ? 'font-bold text-blue-600' : 'text-slate-600'
									}`}
								>
									{scale ? yMeters.toFixed(2) : y.toFixed(2)}
								</td>
							</tr>
						)
					})}
					{trackingPoints.length === 0 && (
						<tr>
							<td
								colSpan={4}
								className="px-4 py-8 text-center text-sm text-slate-500"
							>
								No tracking points yet. Click on the video to start tracking.
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</ScrollArea>
	)
}

export function MetricsAndDataTable({
	trackingPoints,
	scale,
	axis,
	currentFrame,
	onSeekToFrame,
	isMetricsCollapsed,
	onMetricsCollapsedChange,
}: MetricsAndDataTableProps) {
	const [isDataTableFullscreen, setIsDataTableFullscreen] = useState(false)

	return (
		<div className="flex flex-col gap-4">
			{/* Metrics Card - Grouped logically */}
			<div className="rounded-xl border border-slate-200 bg-white shadow-sm">
				<button
					type="button"
					onClick={() => onMetricsCollapsedChange(!isMetricsCollapsed)}
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
									trackingPoints={trackingPoints}
									scale={scale}
									axis={axis}
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
					<div className="flex items-center gap-2">
						<span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
							{trackingPoints.length} pts
						</span>
						<button
							type="button"
							onClick={() => setIsDataTableFullscreen(true)}
							className="rounded-lg p-1.5 transition-colors hover:bg-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							aria-label="Open data table in fullscreen"
							title="Fullscreen"
						>
							<Icon name="panel-bottom" className="h-4 w-4 text-slate-600" />
						</button>
					</div>
				</div>
				<DataTableContent
					trackingPoints={trackingPoints}
					scale={scale}
					axis={axis}
					currentFrame={currentFrame}
					onSeekToFrame={onSeekToFrame}
				/>
			</div>

			{/* Fullscreen Modal for Data Table */}
			<FullscreenModal
				open={isDataTableFullscreen}
				onClose={() => setIsDataTableFullscreen(false)}
				title="Data Points"
			>
				<div className="flex h-full flex-col p-6">
					<DataTableContent
						trackingPoints={trackingPoints}
						scale={scale}
						axis={axis}
						currentFrame={currentFrame}
						onSeekToFrame={onSeekToFrame}
					/>
				</div>
			</FullscreenModal>
		</div>
	)
}
