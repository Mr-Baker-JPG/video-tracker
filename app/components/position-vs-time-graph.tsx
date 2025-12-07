import { useState, useMemo } from 'react'
import type { ReactElement } from 'react'
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts'
import { Button } from '#app/components/ui/button.tsx'

interface TrackingPoint {
	frame: number
	x: number
	y: number
	trackingObjectId: string
}

interface Scale {
	pixelsPerMeter: number
}

interface PositionVsTimeGraphProps {
	trackingPoints: TrackingPoint[]
	scale: Scale | null
}

const FPS = 30 // Frames per second for time calculation

type AxisType = 'x' | 'y'

export function PositionVsTimeGraph({
	trackingPoints,
	scale,
}: PositionVsTimeGraphProps) {
	const [selectedAxis, setSelectedAxis] = useState<AxisType>('x')

	// Transform tracking points into chart data
	const chartData = useMemo(() => {
		if (trackingPoints.length === 0) return []

		// Group points by tracking object
		const pointsByObject = new Map<string, TrackingPoint[]>()
		for (const point of trackingPoints) {
			const existing = pointsByObject.get(point.trackingObjectId) || []
			existing.push(point)
			pointsByObject.set(point.trackingObjectId, existing)
		}

		// Create a map of time -> { time, obj1_x, obj1_y, obj2_x, obj2_y, ... }
		const timeMap = new Map<number, Record<string, number>>()

		for (const [objectId, points] of pointsByObject.entries()) {
			for (const point of points) {
				const time = point.frame / FPS
				if (!timeMap.has(time)) {
					timeMap.set(time, { time })
				}
				const dataPoint = timeMap.get(time)!
				// Store both x and y for each object
				dataPoint[`${objectId}_x`] = point.x
				dataPoint[`${objectId}_y`] = point.y
				// If scale is available, also store meter values
				if (scale) {
					dataPoint[`${objectId}_x_meters`] = point.x / scale.pixelsPerMeter
					dataPoint[`${objectId}_y_meters`] = point.y / scale.pixelsPerMeter
				}
			}
		}

		// Convert to array and sort by time
		return Array.from(timeMap.values()).sort((a, b) => (a.time ?? 0) - (b.time ?? 0))
	}, [trackingPoints, scale])

	// Generate line components for each tracking object
	const lines = useMemo(() => {
		if (trackingPoints.length === 0) return []

		const objectIds = new Set(trackingPoints.map((p) => p.trackingObjectId))
		const lines: ReactElement[] = []

		for (const objectId of objectIds) {
			const dataKey =
				selectedAxis === 'x'
					? scale
						? `${objectId}_x_meters`
						: `${objectId}_x`
					: scale
						? `${objectId}_y_meters`
						: `${objectId}_y`

			// Generate a color based on object ID for consistency
			const color = `hsl(${(objectId.charCodeAt(0) * 137.508) % 360}, 70%, 50%)`

			lines.push(
				<Line
					key={objectId}
					type="monotone"
					dataKey={dataKey}
					stroke={color}
					strokeWidth={2}
					dot={{ r: 3 }}
					name={`Object ${objectId.slice(-6)}`}
				/>,
			)
		}

		return lines
	}, [trackingPoints, selectedAxis, scale])

	const yAxisLabel =
		selectedAxis === 'x'
			? scale
				? 'Position X (meters)'
				: 'Position X (pixels)'
			: scale
				? 'Position Y (meters)'
				: 'Position Y (pixels)'

	if (trackingPoints.length === 0) {
		return (
			<div className="border-border bg-card text-muted-foreground rounded-lg border p-8 text-center">
				No tracking data available. Add tracking points to see the graph.
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-h2">Position vs Time</h2>
				<div className="flex gap-2">
					<Button
						variant={selectedAxis === 'x' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setSelectedAxis('x')}
					>
						X Axis
					</Button>
					<Button
						variant={selectedAxis === 'y' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setSelectedAxis('y')}
					>
						Y Axis
					</Button>
				</div>
			</div>
			<div className="h-96 w-full">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis
							dataKey="time"
							label={{
								value: 'Time (seconds)',
								position: 'insideBottom',
								offset: -5,
							}}
						/>
						<YAxis
							label={{
								value: yAxisLabel,
								angle: -90,
								position: 'insideLeft',
							}}
						/>
						<Tooltip
							formatter={(value: number) => {
								return [
									typeof value === 'number'
										? value.toFixed(scale ? 3 : 1)
										: value,
									selectedAxis === 'x'
										? scale
											? 'm'
											: 'px'
										: scale
											? 'm'
											: 'px',
								]
							}}
							labelFormatter={(time) => `Time: ${time.toFixed(3)}s`}
						/>
						<Legend />
						{lines}
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	)
}
