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
			trackingObjectId: 'obj_test_1',
		},
	})

	expect(trackingPoint).toBeDefined()
	expect(trackingPoint.id).toBeDefined()
	expect(trackingPoint.frame).toBe(10)
	expect(trackingPoint.x).toBe(100.5)
	expect(trackingPoint.y).toBe(200.75)
	expect(trackingPoint.trackingObjectId).toBe('obj_test_1')
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
				trackingObjectId: `obj_${testCase.frame}`,
			},
		})

		expect(point.frame).toBe(testCase.frame)
		expect(point.x).toBe(testCase.x)
		expect(point.y).toBe(testCase.y)
		expect(point.trackingObjectId).toBe(`obj_${testCase.frame}`)

		// Verify it can be retrieved
		const retrieved = await prisma.trackingPoint.findUnique({
			where: { id: point.id },
		})
		expect(retrieved).toBeDefined()
		expect(retrieved?.frame).toBe(testCase.frame)
		expect(retrieved?.x).toBe(testCase.x)
		expect(retrieved?.y).toBe(testCase.y)
		expect(retrieved?.trackingObjectId).toBe(`obj_${testCase.frame}`)
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
				trackingObjectId: 'obj1',
			},
		}),
		prisma.trackingPoint.create({
			data: {
				videoId: video.id,
				frame: 10,
				x: 150,
				y: 250,
				trackingObjectId: 'obj1',
			},
		}),
		prisma.trackingPoint.create({
			data: {
				videoId: video.id,
				frame: 20,
				x: 200,
				y: 300,
				trackingObjectId: 'obj2',
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

test('Multiple tracking points can be stored for same object', async () => {
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

	const trackingObjectId = 'obj_track_1'

	// Create multiple tracking points for the same object across different frames
	const points = await Promise.all([
		prisma.trackingPoint.create({
			data: {
				videoId: video.id,
				frame: 0,
				x: 100,
				y: 200,
				trackingObjectId,
			},
		}),
		prisma.trackingPoint.create({
			data: {
				videoId: video.id,
				frame: 10,
				x: 150,
				y: 250,
				trackingObjectId,
			},
		}),
		prisma.trackingPoint.create({
			data: {
				videoId: video.id,
				frame: 20,
				x: 200,
				y: 300,
				trackingObjectId,
			},
		}),
	])

	expect(points).toHaveLength(3)

	// Verify all points share the same trackingObjectId
	points.forEach((point) => {
		expect(point.trackingObjectId).toBe(trackingObjectId)
	})

	// Verify points can be retrieved by trackingObjectId
	const objectPoints = await prisma.trackingPoint.findMany({
		where: {
			videoId: video.id,
			trackingObjectId,
		},
		orderBy: { frame: 'asc' },
	})

	expect(objectPoints).toHaveLength(3)
	expect(objectPoints[0].frame).toBe(0)
	expect(objectPoints[1].frame).toBe(10)
	expect(objectPoints[2].frame).toBe(20)
})

test('Points are associated with correct frame numbers', async () => {
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

	const trackingObjectId = 'obj_track_2'

	// Create points at specific frames
	const frames = [0, 5, 15, 30, 60]
	const points = await Promise.all(
		frames.map((frame) =>
			prisma.trackingPoint.create({
				data: {
					videoId: video.id,
					frame,
					x: frame * 10,
					y: frame * 20,
					trackingObjectId,
				},
			}),
		),
	)

	expect(points).toHaveLength(frames.length)

	// Verify each point has the correct frame number
	points.forEach((point, index) => {
		expect(point.frame).toBe(frames[index])
		expect(point.trackingObjectId).toBe(trackingObjectId)
	})

	// Verify points can be retrieved in frame order
	const retrievedPoints = await prisma.trackingPoint.findMany({
		where: {
			videoId: video.id,
			trackingObjectId,
		},
		orderBy: { frame: 'asc' },
	})

	expect(retrievedPoints).toHaveLength(frames.length)
	retrievedPoints.forEach((point, index) => {
		expect(point.frame).toBe(frames[index])
	})
})
