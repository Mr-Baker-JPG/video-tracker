import { transformToAxisCoordinates } from './coordinate-transform.ts'

const FPS = 30 // Frames per second for time calculation

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
