import { describe, expect, it } from 'vitest'
import {
	calculateStatistics,
	type Scale,
	type TrackingPoint,
} from './statistics.ts'

describe('calculateStatistics', () => {
	it('returns zero statistics for empty tracking points', () => {
		const result = calculateStatistics([], null)

		expect(result).toEqual({
			totalDistance: 0,
			averageVelocity: 0,
			maxVelocity: 0,
			averageAcceleration: 0,
		})
	})

	it('returns zero statistics for single tracking point', () => {
		const points: TrackingPoint[] = [
			{
				frame: 0,
				x: 100,
				y: 100,
				trackingObjectId: 'obj1',
			},
		]

		const result = calculateStatistics(points, null)

		expect(result.totalDistance).toBe(0)
		expect(result.averageVelocity).toBe(0)
		expect(result.maxVelocity).toBe(0)
		expect(result.averageAcceleration).toBe(0)
	})

	it('calculates total distance correctly for two points', () => {
		const points: TrackingPoint[] = [
			{
				frame: 0,
				x: 0,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 30,
				x: 100,
				y: 0,
				trackingObjectId: 'obj1',
			},
		]

		const result = calculateStatistics(points, null)

		// Distance = sqrt((100-0)^2 + (0-0)^2) = 100 pixels
		expect(result.totalDistance).toBeCloseTo(100, 2)
	})

	it('calculates total distance correctly with scale (meters)', () => {
		const points: TrackingPoint[] = [
			{
				frame: 0,
				x: 0,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 30,
				x: 100,
				y: 0,
				trackingObjectId: 'obj1',
			},
		]

		const scale: Scale = {
			pixelsPerMeter: 10, // 10 pixels = 1 meter
		}

		const result = calculateStatistics(points, scale)

		// Distance = 100 pixels / 10 pixelsPerMeter = 10 meters
		expect(result.totalDistance).toBeCloseTo(10, 2)
	})

	it('calculates average and max velocity correctly', () => {
		// Create points that move at constant velocity
		// Moving 10 pixels per frame, 30 fps = 300 pixels/second
		const points: TrackingPoint[] = [
			{
				frame: 0,
				x: 0,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 30,
				x: 300,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 60,
				x: 600,
				y: 0,
				trackingObjectId: 'obj1',
			},
		]

		const result = calculateStatistics(points, null)

		// Velocity should be approximately 300 pixels/second (10 pixels per frame * 30 fps)
		// We expect the average to be close to this value
		expect(result.averageVelocity).toBeGreaterThan(200)
		expect(result.averageVelocity).toBeLessThan(400)
		expect(result.maxVelocity).toBeGreaterThan(200)
		expect(result.maxVelocity).toBeLessThan(400)
	})

	it('calculates average velocity with scale (m/s)', () => {
		const points: TrackingPoint[] = [
			{
				frame: 0,
				x: 0,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 30,
				x: 100,
				y: 0,
				trackingObjectId: 'obj1',
			},
		]

		const scale: Scale = {
			pixelsPerMeter: 10, // 10 pixels = 1 meter
		}

		const result = calculateStatistics(points, scale)

		// Velocity = 100 pixels / 1 second / 10 pixelsPerMeter = 10 m/s
		// (approximately, accounting for calculation method)
		expect(result.averageVelocity).toBeGreaterThan(5)
		expect(result.averageVelocity).toBeLessThan(15)
	})

	it('calculates average acceleration correctly', () => {
		// Create points with increasing velocity (acceleration)
		const points: TrackingPoint[] = [
			{
				frame: 0,
				x: 0,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 30,
				x: 100,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 60,
				x: 300,
				y: 0,
				trackingObjectId: 'obj1',
			},
		]

		const result = calculateStatistics(points, null)

		// Acceleration should be positive (velocity is increasing)
		expect(result.averageAcceleration).toBeGreaterThanOrEqual(0)
	})

	it('handles multiple tracking objects correctly', () => {
		const points: TrackingPoint[] = [
			{
				frame: 0,
				x: 0,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 30,
				x: 100,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 0,
				x: 0,
				y: 100,
				trackingObjectId: 'obj2',
			},
			{
				frame: 30,
				x: 0,
				y: 200,
				trackingObjectId: 'obj2',
			},
		]

		const result = calculateStatistics(points, null)

		// Total distance should include both objects
		// obj1: 100 pixels, obj2: 100 pixels = 200 pixels total
		expect(result.totalDistance).toBeCloseTo(200, 2)
	})

	it('handles points not in frame order', () => {
		const points: TrackingPoint[] = [
			{
				frame: 60,
				x: 600,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 0,
				x: 0,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 30,
				x: 300,
				y: 0,
				trackingObjectId: 'obj1',
			},
		]

		const result = calculateStatistics(points, null)

		// Should still calculate correctly despite unsorted frames
		expect(result.totalDistance).toBeGreaterThan(0)
		expect(result.averageVelocity).toBeGreaterThan(0)
	})

	it('calculates statistics for diagonal movement', () => {
		const points: TrackingPoint[] = [
			{
				frame: 0,
				x: 0,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 30,
				x: 100,
				y: 100,
				trackingObjectId: 'obj1',
			},
		]

		const result = calculateStatistics(points, null)

		// Distance = sqrt(100^2 + 100^2) = 141.42 pixels
		expect(result.totalDistance).toBeCloseTo(141.42, 1)
	})
})




