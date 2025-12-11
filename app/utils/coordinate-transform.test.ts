import { describe, it, expect } from 'vitest'
import {
	transformToAxisCoordinates,
	transformFromAxisCoordinates,
	type AxisConfig,
} from './coordinate-transform.ts'

describe('coordinate-transform', () => {
	describe('transformToAxisCoordinates', () => {
		it('should translate coordinates to origin', () => {
			const axis: AxisConfig = {
				originX: 100,
				originY: 200,
				rotationAngle: 0,
			}

			const result = transformToAxisCoordinates(150, 250, axis)
			expect(result.x).toBeCloseTo(50)
			expect(result.y).toBeCloseTo(50)
		})

		it('should rotate coordinates correctly', () => {
			const axis: AxisConfig = {
				originX: 0,
				originY: 0,
				rotationAngle: Math.PI / 2, // 90 degrees counterclockwise
			}

			// Point at (1, 0) in video coordinates
			// After 90-degree counterclockwise rotation, should be at (0, 1) in axis coordinates
			const result = transformToAxisCoordinates(1, 0, axis)
			// The function uses -rotationAngle, so it rotates clockwise
			// A 90-degree clockwise rotation of (1, 0) gives (0, -1)
			expect(result.x).toBeCloseTo(0, 1)
			expect(result.y).toBeCloseTo(-1, 1)
		})

		it('should handle combined translation and rotation', () => {
			const axis: AxisConfig = {
				originX: 100,
				originY: 100,
				rotationAngle: Math.PI / 4, // 45 degrees
			}

			// Point at (100 + sqrt(2), 100) in video coordinates
			// After translation: (sqrt(2), 0)
			// After 45-degree rotation (clockwise): (sqrt(2) * cos(-45), sqrt(2) * sin(-45))
			// = (sqrt(2) * cos(45), -sqrt(2) * sin(45)) = (1, -1)
			const result = transformToAxisCoordinates(100 + Math.sqrt(2), 100, axis)
			expect(result.x).toBeCloseTo(1, 1)
			expect(result.y).toBeCloseTo(-1, 1)
		})

		it('should handle zero rotation', () => {
			const axis: AxisConfig = {
				originX: 50,
				originY: 50,
				rotationAngle: 0,
			}

			const result = transformToAxisCoordinates(100, 100, axis)
			expect(result.x).toBe(50)
			expect(result.y).toBe(50)
		})
	})

	describe('transformFromAxisCoordinates', () => {
		it('should transform back to video coordinates', () => {
			const axis: AxisConfig = {
				originX: 100,
				originY: 200,
				rotationAngle: 0,
			}

			const axisCoords = transformToAxisCoordinates(150, 250, axis)
			const videoCoords = transformFromAxisCoordinates(
				axisCoords.x,
				axisCoords.y,
				axis,
			)

			expect(videoCoords.x).toBeCloseTo(150)
			expect(videoCoords.y).toBeCloseTo(250)
		})

		it('should round-trip with rotation', () => {
			const axis: AxisConfig = {
				originX: 0,
				originY: 0,
				rotationAngle: Math.PI / 3, // 60 degrees
			}

			const original = { x: 100, y: 50 }
			const axisCoords = transformToAxisCoordinates(
				original.x,
				original.y,
				axis,
			)
			const videoCoords = transformFromAxisCoordinates(
				axisCoords.x,
				axisCoords.y,
				axis,
			)

			expect(videoCoords.x).toBeCloseTo(original.x, 1)
			expect(videoCoords.y).toBeCloseTo(original.y, 1)
		})

		it('should round-trip with translation and rotation', () => {
			const axis: AxisConfig = {
				originX: 50,
				originY: 75,
				rotationAngle: Math.PI / 6, // 30 degrees
			}

			const original = { x: 150, y: 125 }
			const axisCoords = transformToAxisCoordinates(
				original.x,
				original.y,
				axis,
			)
			const videoCoords = transformFromAxisCoordinates(
				axisCoords.x,
				axisCoords.y,
				axis,
			)

			expect(videoCoords.x).toBeCloseTo(original.x, 1)
			expect(videoCoords.y).toBeCloseTo(original.y, 1)
		})
	})
})




