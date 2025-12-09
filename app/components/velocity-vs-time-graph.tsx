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

interface VelocityVsTimeGraphProps {
	trackingPoints: TrackingPoint[]
	trackingObjects?: TrackingObject[]
	scale: Scale | null
}

const FPS = 30 // Frames per second for time calculation

type AxisType = 'x' | 'y'

/**
 * Calculate velocity from position data using v = Δx/Δt
 * Handles edge cases:
 * - First frame: uses forward difference
 * - Last frame: uses backward difference
 * - Middle frames: uses forward difference (can be changed to central difference if needed)
 */
function calculateVelocity(
	points: TrackingPoint[],
	axis: 'x' | 'y',
	scale: Scale | null,
): Array<{ time: number; velocity: number }> {
	if (points.length === 0) return []
	if (points.length === 1) {
		// Single point: velocity is 0 (no change)
		const firstPoint = points[0]
		if (!firstPoint) return []
		const time = firstPoint.frame / FPS
		return [{ time, velocity: 0 }]
	}

	const velocities: Array<{ time: number; velocity: number }> = []

	// Sort points by frame to ensure correct order
	const sortedPoints = [...points].sort((a, b) => a.frame - b.frame)

	for (let i = 0; i < sortedPoints.length; i++) {
		const point = sortedPoints[i]
		if (!point) continue

		const time = point.frame / FPS
		let velocity: number

		if (i === 0) {
			// First frame: use forward difference
			const nextPoint = sortedPoints[i + 1]
			if (!nextPoint) {
				velocities.push({ time, velocity: 0 })
				continue
			}
			const deltaPosition =
				axis === 'x' ? nextPoint.x - point.x : nextPoint.y - point.y
			const deltaTime = (nextPoint.frame - point.frame) / FPS
			velocity = deltaTime !== 0 ? deltaPosition / deltaTime : 0
		} else if (i === sortedPoints.length - 1) {
			// Last frame: use backward difference
			const prevPoint = sortedPoints[i - 1]
			if (!prevPoint) {
				velocities.push({ time, velocity: 0 })
				continue
			}
			const deltaPosition =
				axis === 'x' ? point.x - prevPoint.x : point.y - prevPoint.y
			const deltaTime = (point.frame - prevPoint.frame) / FPS
			velocity = deltaTime !== 0 ? deltaPosition / deltaTime : 0
		} else {
			// Middle frames: use forward difference
			const nextPoint = sortedPoints[i + 1]
			if (!nextPoint) {
				velocities.push({ time, velocity: 0 })
				continue
			}
			const deltaPosition =
				axis === 'x' ? nextPoint.x - point.x : nextPoint.y - point.y
			const deltaTime = (nextPoint.frame - point.frame) / FPS
			velocity = deltaTime !== 0 ? deltaPosition / deltaTime : 0
		}

		// Convert to m/s if scale is available
		if (scale) {
			velocity = velocity / scale.pixelsPerMeter
		}

		velocities.push({ time, velocity })
	}

	return velocities
}

export function VelocityVsTimeGraph({
	trackingPoints,
	trackingObjects = [],
	scale,
}: VelocityVsTimeGraphProps) {
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

	// Transform tracking points into velocity chart data
	const chartData = useMemo(() => {
		if (trackingPoints.length === 0) return []

		// Group points by tracking object
		const pointsByObject = new Map<string, TrackingPoint[]>()
		for (const point of trackingPoints) {
			const existing = pointsByObject.get(point.trackingObjectId) || []
			existing.push(point)
			pointsByObject.set(point.trackingObjectId, existing)
		}

		// Create a map of time -> { time, obj1_velocity, obj2_velocity, ... }
		const timeMap = new Map<number, Record<string, number>>()

		for (const [objectId, points] of pointsByObject.entries()) {
			const velocities = calculateVelocity(points, selectedAxis, scale)
			for (const { time, velocity } of velocities) {
				if (!timeMap.has(time)) {
					timeMap.set(time, { time })
				}
				const dataPoint = timeMap.get(time)!
				dataPoint[`${objectId}_velocity`] = velocity
			}
		}

		// Convert to array and sort by time
		return Array.from(timeMap.values()).sort(
			(a, b) => (a.time ?? 0) - (b.time ?? 0),
		)
	}, [trackingPoints, selectedAxis, scale, trackingObjects])

	// Generate line components for each tracking object
	const lines = useMemo(() => {
		if (trackingPoints.length === 0) return []

		const objectIds = new Set(trackingPoints.map((p) => p.trackingObjectId))
		const lines: ReactElement[] = []

		for (const objectId of objectIds) {
			const dataKey = `${objectId}_velocity`

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
	}, [trackingPoints])

	const yAxisLabel = scale
		? `Velocity ${selectedAxis.toUpperCase()} (m/s)`
		: `Velocity ${selectedAxis.toUpperCase()} (pixels/s)`

	// Calculate evenly spaced ticks for both axes
	const { timeTicks, velocityTicks, timeDomain, velocityDomain } =
		useMemo(() => {
			if (chartData.length === 0) {
				return {
					timeTicks: [0],
					velocityTicks: [0],
					timeDomain: [0, 1] as [number, number],
					velocityDomain: [0, 1] as [number, number],
				}
			}

			// Calculate time range
			const times = chartData.map((d) => d.time ?? 0).filter((t) => isFinite(t))
			if (times.length === 0) {
				return {
					timeTicks: [0],
					velocityTicks: [0],
					timeDomain: [0, 1] as [number, number],
					velocityDomain: [0, 1] as [number, number],
				}
			}

			const minTime = Math.min(...times)
			const maxTime = Math.max(...times)

			// Calculate velocity range
			const velocityValues: number[] = []
			for (const dataPoint of chartData) {
				for (const key of Object.keys(dataPoint)) {
					if (key === 'time') continue
					if (key.endsWith('_velocity')) {
						const value = dataPoint[key]
						if (typeof value === 'number' && isFinite(value)) {
							velocityValues.push(value)
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

				// For tight padding (velocity axis), use minimal expansion
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

			// Generate ticks for velocity axis (use tight padding to avoid extreme scales)
			let velocityResult: { ticks: number[]; domain: [number, number] }
			if (velocityValues.length === 0) {
				velocityResult = {
					ticks: [0],
					domain: [0, 1] as [number, number],
				}
			} else {
				const minVelocity = Math.min(...velocityValues)
				const maxVelocity = Math.max(...velocityValues)
				// Use tight padding for velocity to keep scale reasonable
				velocityResult = generateNiceTicks(minVelocity, maxVelocity, 6, true)
			}

			return {
				timeTicks: timeResult.ticks,
				velocityTicks: velocityResult.ticks,
				timeDomain: timeResult.domain,
				velocityDomain: velocityResult.domain,
			}
		}, [chartData])

	const handleExport = async () => {
		if (!graphContainerRef.current) return

		const graphTitle = `Velocity vs Time (${selectedAxis.toUpperCase()} Axis)`
		const filename = `velocity_vs_time_${selectedAxis}_axis`

		// Set a unique ID for the container if it doesn't have one
		if (!graphContainerRef.current.id) {
			graphContainerRef.current.id = `velocity-graph-${Date.now()}`
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
				<Tabs
					value={selectedAxis}
					onValueChange={(value) => setSelectedAxis(value as AxisType)}
				>
					<TabsList className="grid w-auto grid-cols-2">
						<TabsTrigger className="text-xs" value="x">
							X Axis
						</TabsTrigger>
						<TabsTrigger className="text-xs" value="y">
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
							domain={velocityDomain}
							ticks={velocityTicks}
							type="number"
							allowDecimals={true}
							interval={0}
							allowDataOverflow={false}
							tickFormatter={(value) => {
								// Format velocity ticks based on scale
								if (scale) {
									// For m/s, show 1-2 decimal places
									return value < 1 ? value.toFixed(2) : value.toFixed(1)
								}
								// For pixels/s, show whole numbers or 1 decimal
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
									scale ? 'm/s' : 'pixels/s',
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
