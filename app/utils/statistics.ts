/**
 * Statistics calculation utilities for video tracking data
 */

import { transformToAxisCoordinates } from './coordinate-transform.ts'

const FPS = 30 // Frames per second for time calculation

export type TrackingPoint = {
	frame: number
	x: number
	y: number
	trackingObjectId: string
}

export type Scale = {
	pixelsPerMeter: number
} | null

export type Axis = {
	originX: number
	originY: number
	rotationAngle: number
} | null

export type Statistics = {
	totalDistance: number
	averageVelocity: number
	maxVelocity: number
	averageAcceleration: number
}

/**
 * Calculate total distance traveled by summing distances between consecutive points
 * Groups points by tracking object to calculate distance for each object separately
 */
function calculateTotalDistance(
	points: TrackingPoint[],
	scale: Scale,
	axis: Axis,
): number {
	if (points.length < 2) return 0

	// Group points by tracking object
	const pointsByObject = new Map<string, TrackingPoint[]>()
	for (const point of points) {
		const objectPoints = pointsByObject.get(point.trackingObjectId) || []
		objectPoints.push(point)
		pointsByObject.set(point.trackingObjectId, objectPoints)
	}

	let totalDistance = 0

	// Calculate distance for each tracking object separately
	for (const objectPoints of pointsByObject.values()) {
		if (objectPoints.length < 2) continue

		// Sort points by frame to ensure correct order
		const sortedPoints = [...objectPoints].sort((a, b) => a.frame - b.frame)

		for (let i = 1; i < sortedPoints.length; i++) {
			const prevPoint = sortedPoints[i - 1]
			const currentPoint = sortedPoints[i]
			if (!prevPoint || !currentPoint) continue

			// Transform coordinates if axis is configured
			let prevX = prevPoint.x
			let prevY = prevPoint.y
			let currX = currentPoint.x
			let currY = currentPoint.y
			if (axis) {
				const prevTransformed = transformToAxisCoordinates(
					prevPoint.x,
					prevPoint.y,
					axis,
				)
				const currTransformed = transformToAxisCoordinates(
					currentPoint.x,
					currentPoint.y,
					axis,
				)
				prevX = prevTransformed.x
				prevY = prevTransformed.y
				currX = currTransformed.x
				currY = currTransformed.y
			}

			const dx = currX - prevX
			const dy = currY - prevY
			const distance = Math.sqrt(dx * dx + dy * dy)

			// Convert to meters if scale is available
			if (scale) {
				totalDistance += distance / scale.pixelsPerMeter
			} else {
				totalDistance += distance
			}
		}
	}

	return totalDistance
}

/**
 * Calculate velocity from position data using v = Δx/Δt
 */
function calculateVelocity(
	points: TrackingPoint[],
	axisType: 'x' | 'y',
	scale: Scale,
	axisConfig: Axis,
): Array<{ time: number; velocity: number }> {
	if (points.length === 0) return []
	if (points.length === 1) {
		const firstPoint = points[0]
		if (!firstPoint) return []
		const time = firstPoint.frame / FPS
		return [{ time, velocity: 0 }]
	}

	const velocities: Array<{ time: number; velocity: number }> = []
	const sortedPoints = [...points].sort((a, b) => a.frame - b.frame)

	for (let i = 0; i < sortedPoints.length; i++) {
		const point = sortedPoints[i]
		if (!point) continue

		// Transform coordinates if axis is configured
		let x = point.x
		let y = point.y
		if (axisConfig) {
			const transformed = transformToAxisCoordinates(point.x, point.y, axisConfig)
			x = transformed.x
			y = transformed.y
		}

		const time = point.frame / FPS
		let velocity: number

		if (i === 0) {
			// First frame: use forward difference
			const nextPoint = sortedPoints[i + 1]
			if (!nextPoint) {
				velocities.push({ time, velocity: 0 })
				continue
			}
			// Transform next point coordinates
			let nextX = nextPoint.x
			let nextY = nextPoint.y
			if (axisConfig) {
				const transformed = transformToAxisCoordinates(
					nextPoint.x,
					nextPoint.y,
					axisConfig,
				)
				nextX = transformed.x
				nextY = transformed.y
			}
			const deltaPosition = axisType === 'x' ? nextX - x : nextY - y
			const deltaTime = (nextPoint.frame - point.frame) / FPS
			velocity = deltaTime !== 0 ? deltaPosition / deltaTime : 0
		} else if (i === sortedPoints.length - 1) {
			// Last frame: use backward difference
			const prevPoint = sortedPoints[i - 1]
			if (!prevPoint) {
				velocities.push({ time, velocity: 0 })
				continue
			}
			// Transform prev point coordinates
			let prevX = prevPoint.x
			let prevY = prevPoint.y
			if (axisConfig) {
				const transformed = transformToAxisCoordinates(
					prevPoint.x,
					prevPoint.y,
					axisConfig,
				)
				prevX = transformed.x
				prevY = transformed.y
			}
			const deltaPosition = axisType === 'x' ? x - prevX : y - prevY
			const deltaTime = (point.frame - prevPoint.frame) / FPS
			velocity = deltaTime !== 0 ? deltaPosition / deltaTime : 0
		} else {
			// Middle frames: use forward difference
			const nextPoint = sortedPoints[i + 1]
			if (!nextPoint) {
				velocities.push({ time, velocity: 0 })
				continue
			}
			// Transform next point coordinates
			let nextX = nextPoint.x
			let nextY = nextPoint.y
			if (axisConfig) {
				const transformed = transformToAxisCoordinates(
					nextPoint.x,
					nextPoint.y,
					axisConfig,
				)
				nextX = transformed.x
				nextY = transformed.y
			}
			const deltaPosition = axisType === 'x' ? nextX - x : nextY - y
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

/**
 * Calculate acceleration from velocity data using a = Δv/Δt
 */
function calculateAcceleration(
	points: TrackingPoint[],
	axisType: 'x' | 'y',
	scale: Scale,
	axisConfig: Axis,
): Array<{ time: number; acceleration: number }> {
	// First calculate velocities
	const velocities = calculateVelocity(points, axisType, null, axisConfig) // Don't convert to m/s yet

	if (velocities.length === 0) return []
	if (velocities.length === 1) {
		const firstVelocity = velocities[0]
		if (!firstVelocity) return []
		return [{ time: firstVelocity.time, acceleration: 0 }]
	}

	const accelerations: Array<{ time: number; acceleration: number }> = []
	const sortedVelocities = [...velocities].sort((a, b) => a.time - b.time)

	for (let i = 0; i < sortedVelocities.length; i++) {
		const velocityPoint = sortedVelocities[i]
		if (!velocityPoint) continue

		const time = velocityPoint.time
		let acceleration: number

		if (i === 0) {
			// First frame: use forward difference
			const nextVelocity = sortedVelocities[i + 1]
			if (!nextVelocity) {
				accelerations.push({ time, acceleration: 0 })
				continue
			}
			const deltaVelocity = nextVelocity.velocity - velocityPoint.velocity
			const deltaTime = nextVelocity.time - velocityPoint.time
			acceleration = deltaTime !== 0 ? deltaVelocity / deltaTime : 0
		} else if (i === sortedVelocities.length - 1) {
			// Last frame: use backward difference
			const prevVelocity = sortedVelocities[i - 1]
			if (!prevVelocity) {
				accelerations.push({ time, acceleration: 0 })
				continue
			}
			const deltaVelocity = velocityPoint.velocity - prevVelocity.velocity
			const deltaTime = velocityPoint.time - prevVelocity.time
			acceleration = deltaTime !== 0 ? deltaVelocity / deltaTime : 0
		} else {
			// Middle frames: use forward difference
			const nextVelocity = sortedVelocities[i + 1]
			if (!nextVelocity) {
				accelerations.push({ time, acceleration: 0 })
				continue
			}
			const deltaVelocity = nextVelocity.velocity - velocityPoint.velocity
			const deltaTime = nextVelocity.time - velocityPoint.time
			acceleration = deltaTime !== 0 ? deltaVelocity / deltaTime : 0
		}

		// Convert to m/s² if scale is available
		// Velocity is in pixels/s, so acceleration is in pixels/s²
		// To convert to m/s²: divide by pixelsPerMeter
		if (scale) {
			acceleration = acceleration / scale.pixelsPerMeter
		}

		accelerations.push({ time, acceleration })
	}

	return accelerations
}

/**
 * Calculate all statistics from tracking data
 * Combines data from all tracking objects
 */
export function calculateStatistics(
	trackingPoints: TrackingPoint[],
	scale: Scale,
	axis: Axis = null,
): Statistics {
	if (trackingPoints.length === 0) {
		return {
			totalDistance: 0,
			averageVelocity: 0,
			maxVelocity: 0,
			averageAcceleration: 0,
		}
	}

	// Calculate total distance (combining x and y components)
	// We'll calculate the 2D distance traveled
	const totalDistance = calculateTotalDistance(trackingPoints, scale, axis)

	// Calculate velocities for both axes and combine into magnitude
	const velocitiesX = calculateVelocity(trackingPoints, 'x', scale, axis)
	const velocitiesY = calculateVelocity(trackingPoints, 'y', scale, axis)

	// Combine x and y velocities into magnitude: v = sqrt(vx² + vy²)
	const velocities: number[] = []
	for (let i = 0; i < velocitiesX.length; i++) {
		const vx = velocitiesX[i]?.velocity ?? 0
		const vy = velocitiesY[i]?.velocity ?? 0
		const magnitude = Math.sqrt(vx * vx + vy * vy)
		velocities.push(magnitude)
	}

	// Calculate average and max velocity
	const averageVelocity =
		velocities.length > 0
			? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
			: 0
	const maxVelocity = velocities.length > 0 ? Math.max(...velocities) : 0

	// Calculate accelerations for both axes and combine into magnitude
	const accelerationsX = calculateAcceleration(trackingPoints, 'x', scale, axis)
	const accelerationsY = calculateAcceleration(trackingPoints, 'y', scale, axis)

	// Combine x and y accelerations into magnitude: a = sqrt(ax² + ay²)
	const accelerations: number[] = []
	for (let i = 0; i < accelerationsX.length; i++) {
		const ax = accelerationsX[i]?.acceleration ?? 0
		const ay = accelerationsY[i]?.acceleration ?? 0
		const magnitude = Math.sqrt(ax * ax + ay * ay)
		accelerations.push(magnitude)
	}

	// Calculate average acceleration
	const averageAcceleration =
		accelerations.length > 0
			? accelerations.reduce((sum, a) => sum + a, 0) / accelerations.length
			: 0

	return {
		totalDistance,
		averageVelocity,
		maxVelocity,
		averageAcceleration,
	}
}
