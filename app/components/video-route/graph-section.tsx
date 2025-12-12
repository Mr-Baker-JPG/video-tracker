import { useMemo, useRef, useState } from 'react'
import { AccelerationVsTimeGraph } from '#app/components/acceleration-vs-time-graph.tsx'
import { PositionVsTimeGraph } from '#app/components/position-vs-time-graph.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '#app/components/ui/tabs.tsx'
import { VelocityVsTimeGraph } from '#app/components/velocity-vs-time-graph.tsx'
import { FullscreenModal } from '#app/components/video-route/fullscreen-modal.tsx'
import {
	type TrackingObject,
	type TrackingPoint,
	type VideoAxis,
	type VideoScale,
} from '#app/routes/videos/$videoId.types.ts'

type GraphSectionProps = {
	trackingPoints: TrackingPoint[]
	trackingObjects: TrackingObject[]
	scale: VideoScale | null
	axis: VideoAxis | null
	activeTool?: 'scale' | 'origin' | 'track' | undefined
}

export function GraphSection({
	trackingPoints,
	trackingObjects,
	scale,
	axis,
	activeTool,
}: GraphSectionProps) {
	const [isGraphFullscreen, setIsGraphFullscreen] = useState(false)
	const [activeTab, setActiveTab] = useState<string>('position')

	// Memoize graph props with deep equality checking to prevent unnecessary re-renders
	// Only update when the actual data content changes, not just object references
	const prevGraphPropsRef = useRef<{
		trackingPoints: TrackingPoint[]
		trackingObjects: TrackingObject[]
		scale: VideoScale | null
		axis: VideoAxis | null
	} | null>(null)

	const graphProps = useMemo(() => {
		// Create string keys for deep comparison
		const trackingPointsKey = JSON.stringify(trackingPoints)
		const trackingObjectsKey = JSON.stringify(trackingObjects)
		const scaleKey = JSON.stringify(scale)
		const axisKey = JSON.stringify(axis)

		// Check if anything actually changed
		const prevProps = prevGraphPropsRef.current
		if (prevProps) {
			const prevTrackingPointsKey = JSON.stringify(prevProps.trackingPoints)
			const prevTrackingObjectsKey = JSON.stringify(prevProps.trackingObjects)
			const prevScaleKey = JSON.stringify(prevProps.scale)
			const prevAxisKey = JSON.stringify(prevProps.axis)

			// If nothing changed, return previous props to maintain reference equality
			if (
				trackingPointsKey === prevTrackingPointsKey &&
				trackingObjectsKey === prevTrackingObjectsKey &&
				scaleKey === prevScaleKey &&
				axisKey === prevAxisKey
			) {
				return prevProps
			}
		}

		// Data changed, create new props object
		const newProps = {
			trackingPoints,
			trackingObjects,
			scale,
			axis,
		}
		prevGraphPropsRef.current = newProps
		return newProps
	}, [trackingPoints, trackingObjects, scale, axis])

	// Render graph content (shared between card and modal)
	const renderGraphContent = (containerClassName: string) => (
		<Tabs
			value={activeTab}
			onValueChange={setActiveTab}
			className="flex h-full flex-col"
		>
			{/* Tab header */}
			<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
				<TabsList className="grid w-auto grid-cols-3">
					<TabsTrigger value="position">Position</TabsTrigger>
					<TabsTrigger value="velocity">Velocity</TabsTrigger>
					<TabsTrigger value="acceleration">Acceleration</TabsTrigger>
				</TabsList>
			</div>
			{/* Graph area with card container */}
			<div className={`flex min-h-0 flex-1 p-6 ${containerClassName}`}>
				<div className="flex h-full min-h-[400px] w-full rounded-lg border border-slate-200 bg-white p-4 shadow-inner">
					<TabsContent
						value="position"
						className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
						style={{ minHeight: 400, minWidth: 1 }}
					>
						<PositionVsTimeGraph
							trackingPoints={graphProps.trackingPoints}
							trackingObjects={graphProps.trackingObjects}
							scale={graphProps.scale}
							axis={graphProps.axis}
						/>
					</TabsContent>
					<TabsContent
						value="velocity"
						className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
						style={{ minHeight: 400 }}
					>
						<VelocityVsTimeGraph
							trackingPoints={graphProps.trackingPoints}
							trackingObjects={graphProps.trackingObjects}
							scale={graphProps.scale}
							axis={graphProps.axis}
						/>
					</TabsContent>
					<TabsContent
						value="acceleration"
						className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
						style={{ minHeight: 400 }}
					>
						<AccelerationVsTimeGraph
							trackingPoints={graphProps.trackingPoints}
							trackingObjects={graphProps.trackingObjects}
							scale={graphProps.scale}
							axis={graphProps.axis}
						/>
					</TabsContent>
				</div>
			</div>
		</Tabs>
	)

	return (
		<>
			<div
				key={activeTool}
				className="flex min-h-[400px] min-w-[200px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
			>
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="flex h-full flex-col"
				>
					{/* Tab header - Primary, not secondary */}
					<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
						<TabsList className="grid w-auto grid-cols-3">
							<TabsTrigger value="position">Position</TabsTrigger>
							<TabsTrigger value="velocity">Velocity</TabsTrigger>
							<TabsTrigger value="acceleration">Acceleration</TabsTrigger>
						</TabsList>
						<button
							type="button"
							onClick={() => setIsGraphFullscreen(true)}
							className="rounded-lg p-1.5 transition-colors hover:bg-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							aria-label="Open graphs in fullscreen"
							title="Fullscreen"
						>
							<Icon name="panel-bottom" className="h-4 w-4 text-slate-600" />
						</button>
					</div>
					{/* Graph area with card container */}
					<div className="flex min-h-0 flex-1 p-6">
						<div className="flex h-full min-h-[400px] w-full rounded-lg border border-slate-200 bg-white p-4 shadow-inner">
							<TabsContent
								value="position"
								className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
								style={{ minHeight: 400, minWidth: 1 }}
							>
								<PositionVsTimeGraph
									trackingPoints={graphProps.trackingPoints}
									trackingObjects={graphProps.trackingObjects}
									scale={graphProps.scale}
									axis={graphProps.axis}
								/>
							</TabsContent>
							<TabsContent
								value="velocity"
								className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
								style={{ minHeight: 400 }}
							>
								<VelocityVsTimeGraph
									trackingPoints={graphProps.trackingPoints}
									trackingObjects={graphProps.trackingObjects}
									scale={graphProps.scale}
									axis={graphProps.axis}
								/>
							</TabsContent>
							<TabsContent
								value="acceleration"
								className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
								style={{ minHeight: 400 }}
							>
								<AccelerationVsTimeGraph
									trackingPoints={graphProps.trackingPoints}
									trackingObjects={graphProps.trackingObjects}
									scale={graphProps.scale}
									axis={graphProps.axis}
								/>
							</TabsContent>
						</div>
					</div>
				</Tabs>
			</div>

			{/* Fullscreen Modal for Graph Section */}
			<FullscreenModal
				open={isGraphFullscreen}
				onClose={() => setIsGraphFullscreen(false)}
			>
				<div className="flex h-full flex-col">{renderGraphContent('')}</div>
			</FullscreenModal>
		</>
	)
}
