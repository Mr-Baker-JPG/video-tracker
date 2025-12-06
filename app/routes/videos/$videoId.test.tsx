/**
 * @vitest-environment jsdom
 */
import { test, expect } from 'vitest'
import { prisma } from '#app/utils/db.server.ts'
import { createUser } from '#tests/db-utils.ts'
import { action } from './$videoId.tsx'

test('Tracking point can be created with x, y, frame data', async () => {
	const user = await prisma.user.create({
		select: { id: true },
		data: createUser(),
	})

	const video = await prisma.video.create({
		data: {
			filename: 'test-video.mp4',
			url: 'users/test/videos/test-key.mp4',
			userId: user.id,
		},
	})

	const trackingPoint = await prisma.trackingPoint.create({
		data: {
			videoId: video.id,
			frame: 10,
			x: 100.5,
			y: 200.75,
		},
	})

	expect(trackingPoint).toBeDefined()
	expect(trackingPoint.id).toBeDefined()
	expect(trackingPoint.frame).toBe(10)
	expect(trackingPoint.x).toBe(100.5)
	expect(trackingPoint.y).toBe(200.75)
	expect(trackingPoint.videoId).toBe(video.id)
	expect(trackingPoint.createdAt).toBeInstanceOf(Date)
})

test('Point coordinates are correctly stored', async () => {
	const user = await prisma.user.create({
		select: { id: true },
		data: createUser(),
	})

	const video = await prisma.video.create({
		data: {
			filename: 'test-video.mp4',
			url: 'users/test/videos/test-key.mp4',
			userId: user.id,
		},
	})

	const testCases = [
		{ frame: 0, x: 0, y: 0 },
		{ frame: 5, x: 123.456, y: 789.012 },
		{ frame: 100, x: 1920, y: 1080 },
	]

	for (const testCase of testCases) {
		const point = await prisma.trackingPoint.create({
			data: {
				videoId: video.id,
				frame: testCase.frame,
				x: testCase.x,
				y: testCase.y,
			},
		})

		expect(point.frame).toBe(testCase.frame)
		expect(point.x).toBe(testCase.x)
		expect(point.y).toBe(testCase.y)

		// Verify it can be retrieved
		const retrieved = await prisma.trackingPoint.findUnique({
			where: { id: point.id },
		})
		expect(retrieved).toBeDefined()
		expect(retrieved?.frame).toBe(testCase.frame)
		expect(retrieved?.x).toBe(testCase.x)
		expect(retrieved?.y).toBe(testCase.y)
	}
})

test('Multiple tracking points can be stored for same video', async () => {
	const user = await prisma.user.create({
		select: { id: true },
		data: createUser(),
	})

	const video = await prisma.video.create({
		data: {
			filename: 'test-video.mp4',
			url: 'users/test/videos/test-key.mp4',
			userId: user.id,
		},
	})

	// Create multiple tracking points
	const points = await Promise.all([
		prisma.trackingPoint.create({
			data: {
				videoId: video.id,
				frame: 0,
				x: 100,
				y: 200,
			},
		}),
		prisma.trackingPoint.create({
			data: {
				videoId: video.id,
				frame: 10,
				x: 150,
				y: 250,
			},
		}),
		prisma.trackingPoint.create({
			data: {
				videoId: video.id,
				frame: 20,
				x: 200,
				y: 300,
			},
		}),
	])

	expect(points).toHaveLength(3)

	// Verify all points are associated with the video
	const allPoints = await prisma.trackingPoint.findMany({
		where: { videoId: video.id },
		orderBy: { frame: 'asc' },
	})

	expect(allPoints).toHaveLength(3)
	expect(allPoints[0].frame).toBe(0)
	expect(allPoints[1].frame).toBe(10)
	expect(allPoints[2].frame).toBe(20)
})
