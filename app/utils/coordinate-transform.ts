/**
 * Coordinate transformation utilities for custom axis systems
 */

export interface AxisConfig {
	originX: number
	originY: number
	rotationAngle: number // In radians
}

/**
 * Transform a point from video coordinates to axis-relative coordinates
 * @param x - X coordinate in video pixel space
 * @param y - Y coordinate in video pixel space
 * @param axis - Axis configuration (origin and rotation)
 * @returns Transformed coordinates {x, y} in axis-relative space
 */
export function transformToAxisCoordinates(
	x: number,
	y: number,
	axis: AxisConfig,
): { x: number; y: number } {
	// Translate to origin
	const translatedX = x - axis.originX
	const translatedY = y - axis.originY

	// Rotate by negative angle (to align with axis orientation)
	const cos = Math.cos(-axis.rotationAngle)
	const sin = Math.sin(-axis.rotationAngle)

	const rotatedX = translatedX * cos - translatedY * sin
	const rotatedY = translatedX * sin + translatedY * cos

	return { x: rotatedX, y: rotatedY }
}

/**
 * Transform a point from axis-relative coordinates back to video coordinates
 * @param x - X coordinate in axis-relative space
 * @param y - Y coordinate in axis-relative space
 * @param axis - Axis configuration (origin and rotation)
 * @returns Transformed coordinates {x, y} in video pixel space
 */
export function transformFromAxisCoordinates(
	x: number,
	y: number,
	axis: AxisConfig,
): { x: number; y: number } {
	// Rotate by positive angle (reverse rotation)
	const cos = Math.cos(axis.rotationAngle)
	const sin = Math.sin(axis.rotationAngle)

	const rotatedX = x * cos - y * sin
	const rotatedY = x * sin + y * cos

	// Translate back from origin
	const videoX = rotatedX + axis.originX
	const videoY = rotatedY + axis.originY

	return { x: videoX, y: videoY }
}
