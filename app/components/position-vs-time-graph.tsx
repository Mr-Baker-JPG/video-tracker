import { useState, useMemo, useRef, type ReactElement } from 'react'
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
import { Icon } from '#app/components/ui/icon.tsx'
import { Tabs, TabsList, TabsTrigger } from '#app/components/ui/tabs.tsx'
import { exportGraphAsPNG } from '#app/utils/graph-export.tsx'

interface TrackingPoint {
	frame: number
	x: number
	y: number
	trackingObjectId: string
}

interface Scale {
	pixelsPerMeter: number
}

interface TrackingObject {
	id: string
	name: string | null
	color: string | null
}

interface PositionVsTimeGraphProps {
	trackingPoints: TrackingPoint[]
	trackingObjects?: TrackingObject[]
	scale: Scale | null
}

const FPS = 30 // Frames per second for time calculation

type AxisType = 'x' | 'y'

export function PositionVsTimeGraph({
	trackingPoints,
	trackingObjects = [],
	scale,
}: PositionVsTimeGraphProps) {
	const graphContainerRef = useRef<HTMLDivElement>(null)
	const [selectedAxis, setSelectedAxis] = useState<AxisType>('x')

	// Helper to get tracking object name
	const getTrackingObjectName = (id: string): string => {
		const obj = trackingObjects.find((o) => o.id === id)
		return obj?.name || `Object ${id.slice(-6)}`
	}

	// Helper to get tracking object color
	const getTrackingObjectColor = (id: string): string => {
		const obj = trackingObjects.find((o) => o.id === id)
		if (obj?.color) return obj.color
		// Generate color from ID hash
		const hash = id.split('').reduce((acc, char) => {
			return char.charCodeAt(0) + ((acc << 5) - acc)
		}, 0)
		const hue = Math.abs(hash) % 360
		return `hsl(${hue}, 70%, 50%)`
	}

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
		return Array.from(timeMap.values()).sort(
			(a, b) => (a.time ?? 0) - (b.time ?? 0),
		)
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

			const color = getTrackingObjectColor(objectId)
			const name = getTrackingObjectName(objectId)

			lines.push(
				<Line
					key={objectId}
					type="monotone"
					dataKey={dataKey}
					stroke={color}
					strokeWidth={2}
					dot={{ r: 3 }}
					name={name}
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

	// Calculate evenly spaced ticks for both axes
	const { timeTicks, positionTicks, timeDomain, positionDomain } =
		useMemo(() => {
			if (chartData.length === 0) {
				return {
					timeTicks: [0],
					positionTicks: [0],
					timeDomain: [0, 1] as [number, number],
					positionDomain: [0, 1] as [number, number],
				}
			}

			// Calculate time range
			const times = chartData.map((d) => d.time ?? 0).filter((t) => isFinite(t))
			if (times.length === 0) {
				return {
					timeTicks: [0],
					positionTicks: [0],
					timeDomain: [0, 1] as [number, number],
					positionDomain: [0, 1] as [number, number],
				}
			}

			const minTime = Math.min(...times)
			const maxTime = Math.max(...times)

			// Calculate position range based on selected axis
			// When scale is available, use meter values; otherwise use pixel values
			const positionValues: number[] = []
			const axisSuffix = selectedAxis === 'x' ? '_x' : '_y'
			const meterSuffix = `${axisSuffix}_meters`

			for (const dataPoint of chartData) {
				for (const key of Object.keys(dataPoint)) {
					if (key === 'time') continue

					// When scale is available, only use meter values
					// When scale is not available, only use pixel values
					const shouldInclude = scale
						? key.endsWith(meterSuffix)
						: key.endsWith(axisSuffix) && !key.endsWith('_meters')

					if (shouldInclude) {
						const value = dataPoint[key]
						if (typeof value === 'number' && isFinite(value)) {
							positionValues.push(value)
						}
					}
				}
			}

			// Generate evenly spaced ticks with nice round numbers
			const generateNiceTicks = (
				min: number,
				max: number,
				targetCount: number = 6,
				useTightPadding: boolean = false,
			): { ticks: number[]; domain: [number, number] } => {
				if (min === max || !isFinite(min) || !isFinite(max)) {
					const singleValue = min || 0
					// For single values, use a small but visible range
					const padding = useTightPadding
						? Math.abs(singleValue) * 0.1 || 0.01
						: 0.1
					return {
						ticks: [singleValue],
						domain: [singleValue - padding, singleValue + padding] as [
							number,
							number,
						],
					}
				}

				// Calculate the raw range
				const rawRange = max - min

				// For tight padding (position axis), use minimal expansion
				// For normal padding (time axis), use slightly more
				let padding: number
				if (useTightPadding) {
					// Use very small padding - just enough to see data points clearly
					// For small ranges, use a percentage; for larger ranges, cap the padding
					if (rawRange < 1) {
						padding = rawRange * 0.05 // 5% for very small ranges
					} else if (rawRange < 10) {
						padding = Math.min(rawRange * 0.03, 0.5) // 3% or max 0.5
					} else {
						padding = Math.min(rawRange * 0.02, 2) // 2% or max 2
					}
				} else {
					// Normal padding for time axis
					padding = rawRange * 0.05 // 5% padding
				}

				// Find a nice step size based on the data range
				const rawStep = rawRange / (targetCount - 1)

				// Round step to a nice number (powers of 1, 2, 5)
				// But ensure step isn't too large relative to the data
				const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
				const normalizedStep = rawStep / magnitude
				let niceStep: number
				if (normalizedStep <= 1) {
					niceStep = magnitude
				} else if (normalizedStep <= 2) {
					niceStep = 2 * magnitude
				} else if (normalizedStep <= 5) {
					niceStep = 5 * magnitude
				} else {
					niceStep = 10 * magnitude
				}

				// For tight padding, ensure step size isn't too large
				// If step is more than 2x the raw step, use a smaller step
				if (useTightPadding && niceStep > rawStep * 2) {
					// Use a smaller magnitude
					const smallerMagnitude = magnitude / 10
					if (smallerMagnitude > 0) {
						niceStep = smallerMagnitude * 5 // Use 5x the smaller magnitude
					}
				}

				// Calculate domain with minimal padding
				const paddedMin = min - padding
				const paddedMax = max + padding

				// Round to step boundaries
				let niceMin = Math.floor(paddedMin / niceStep) * niceStep
				let niceMax = Math.ceil(paddedMax / niceStep) * niceStep

				// For tight padding, ensure we don't expand too far beyond the data
				if (useTightPadding) {
					const maxExpansion = Math.max(rawRange * 0.15, niceStep * 2) // Max 15% or 2 steps
					if (niceMin < min - maxExpansion) {
						niceMin = Math.floor((min - maxExpansion) / niceStep) * niceStep
					}
					if (niceMax > max + maxExpansion) {
						niceMax = Math.ceil((max + maxExpansion) / niceStep) * niceStep
					}
				}

				// Generate evenly spaced ticks
				const ticks: number[] = []
				const numTicks = Math.round((niceMax - niceMin) / niceStep) + 1
				for (let i = 0; i < numTicks; i++) {
					const tick = niceMin + i * niceStep
					ticks.push(Number(tick.toFixed(10)))
				}

				return {
					ticks,
					domain: [niceMin, niceMax] as [number, number],
				}
			}

			// Generate ticks for time axis (use normal padding)
			const timeResult = generateNiceTicks(minTime, maxTime, 6, false)

			// Generate ticks for position axis (use tight padding to avoid extreme scales)
			let positionResult: { ticks: number[]; domain: [number, number] }
			if (positionValues.length === 0) {
				positionResult = {
					ticks: [0],
					domain: [0, 1] as [number, number],
				}
			} else {
				const minPosition = Math.min(...positionValues)
				const maxPosition = Math.max(...positionValues)
				// Use tight padding for position to keep scale reasonable
				positionResult = generateNiceTicks(minPosition, maxPosition, 6, true)
			}

			return {
				timeTicks: timeResult.ticks,
				positionTicks: positionResult.ticks,
				timeDomain: timeResult.domain,
				positionDomain: positionResult.domain,
			}
		}, [chartData, selectedAxis, scale])

	const handleExport = async () => {
		if (!graphContainerRef.current) return

		const graphTitle = `Position vs Time (${selectedAxis.toUpperCase()} Axis)`
		const filename = `position_vs_time_${selectedAxis}_axis`

		// Set a unique ID for the container if it doesn't have one
		if (!graphContainerRef.current.id) {
			graphContainerRef.current.id = `position-graph-${Date.now()}`
		}

		try {
			await exportGraphAsPNG(graphContainerRef.current.id, filename, graphTitle)
		} catch (error) {
			console.error('Failed to export graph:', error)
		}
	}

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
				{/* <h2 className="text-h2">Position vs Time</h2> */}
				<Tabs
					value={selectedAxis}
					onValueChange={(value) => setSelectedAxis(value as AxisType)}
				>
					<TabsList className="grid h-fit w-auto grid-cols-2 text-xs">
						<TabsTrigger className="h-5 text-xs" value="x">
							X Axis
						</TabsTrigger>
						<TabsTrigger className="h-5 text-xs" value="y">
							Y Axis
						</TabsTrigger>
					</TabsList>
				</Tabs>
				<Button
					variant="outline"
					size="sm"
					onClick={handleExport}
					className="flex items-center gap-2"
				>
					<Icon name="file" className="size-4" />
					Export PNG
				</Button>
			</div>
			<div ref={graphContainerRef} className="h-96 w-full">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis
							dataKey="time"
							domain={timeDomain}
							ticks={timeTicks}
							type="number"
							allowDecimals={true}
							interval={0}
							allowDataOverflow={false}
							tickFormatter={(value) => {
								// Format time ticks to show reasonable precision
								if (value < 0.01) return value.toFixed(3)
								if (value < 1) return value.toFixed(2)
								return value.toFixed(1)
							}}
							label={{
								value: 'Time (seconds)',
								position: 'insideBottom',
								offset: -5,
							}}
						/>
						<YAxis
							domain={positionDomain}
							ticks={positionTicks}
							type="number"
							allowDecimals={true}
							interval={0}
							allowDataOverflow={false}
							tickFormatter={(value) => {
								// Format position ticks based on scale
								if (scale) {
									// For meters, show 1-2 decimal places
									return value < 1 ? value.toFixed(2) : value.toFixed(1)
								}
								// For pixels, show whole numbers or 1 decimal
								return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)
							}}
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
