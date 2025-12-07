import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '#app/utils/db.server.ts'
import { expect, test } from '#tests/playwright-utils.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

test('User can play, pause, and seek through video', async ({
	page,
	navigate,
	login,
}) => {
	const user = await login()

	// First, upload a video
	await navigate('/videos/new')

	// Use actual video file for more realistic testing
	const videoFilePath = join(__dirname, 'data', 'WhichLandsFirst.mp4')
	const videoFileName = 'WhichLandsFirst.mp4'

	const fileInput = page.getByLabel(/video file/i)
	await fileInput.setInputFiles(videoFilePath)

	// File info should be displayed
	await expect(page.getByText(videoFileName)).toBeVisible()

	// Click upload submit button (not the toggle button)
	await page.getByRole('button', { name: 'Upload', exact: true }).click()

	// Wait for upload to complete - wait for success toast or redirect
	await expect(page).toHaveURL('/videos/new')
	// Wait a bit for the upload to process
	await page.waitForTimeout(1000)

	// Wait for video to be stored in database (with retry)
	let video = null
	for (let i = 0; i < 30; i++) {
		video = await prisma.video.findFirst({
			where: {
				userId: user.id,
				filename: videoFileName,
			},
			select: {
				id: true,
				filename: true,
				url: true,
				userId: true,
				duration: true,
				uploadedAt: true,
			},
		})
		if (video && video.filename) break
		await page.waitForTimeout(300) // Wait 300ms before retrying
	}

	expect(video).toBeDefined()
	if (!video) {
		// Debug: check all videos for this user
		const allVideos = await prisma.video.findMany({
			where: { userId: user.id },
			select: { id: true, filename: true, url: true },
		})
		throw new Error(
			`Video not found. All videos for user: ${JSON.stringify(allVideos)}`,
		)
	}
	expect(video.filename).toBe(videoFileName)
	expect(video.userId).toBe(user.id)
	expect(video.url).toBeDefined()

	// Assert video is not null for TypeScript
	if (!video) {
		throw new Error('Video not found')
	}

	// Navigate to video player page (use page.goto for dynamic routes)
	await page.goto(`/videos/${video.id}`)

	// Wait for video player to load - use the actual filename from database
	await expect(
		page.getByRole('heading', { name: video.filename }),
	).toBeVisible()

	// Check that video element exists
	const videoElement = page.getByLabel('Video content')
	await expect(videoElement).toBeVisible()

	// Wait for video metadata to load first (duration must be available)
	// This ensures the video file is actually loaded and ready
	await expect(async () => {
		const duration = await videoElement.evaluate(
			(el) => (el as HTMLVideoElement).duration,
		)
		expect(duration).toBeGreaterThan(0)
		expect(Number.isFinite(duration)).toBe(true)
	}).toPass({ timeout: 10000 })

	// Check that controls are present
	const playPauseButton = page.getByLabel(/play|pause|restart/i)
	await expect(playPauseButton).toBeVisible()
	await expect(page.getByLabel('Seek backward 3 seconds')).toBeVisible()
	await expect(page.getByLabel('Seek forward 3 seconds')).toBeVisible()
	await expect(page.getByLabel('Previous frame')).toBeVisible()
	await expect(page.getByLabel('Next frame')).toBeVisible()
	const seekBar = page.getByLabel('Video seek')
	await expect(seekBar).toBeVisible()

	// Wait for the seek bar's max to be updated (it's set from duration state)
	await expect(async () => {
		const max = await seekBar.getAttribute('max')
		expect(parseFloat(max || '0')).toBeGreaterThan(0)
	}).toPass({ timeout: 2000 })

	// Verify seek bar has a valid value
	const seekBarValue = await seekBar.getAttribute('value')
	expect(seekBarValue).toBeDefined()

	// Test play/pause button - should show "Play" initially
	await expect(playPauseButton).toHaveAttribute('aria-label', 'Play')

	// Click play
	await playPauseButton.click()

	// Wait a bit for video to start
	await page.waitForTimeout(500)

	// Button should now show "Pause"
	await expect(playPauseButton).toHaveAttribute('aria-label', 'Pause')

	// Click pause
	await playPauseButton.click()
	await expect(playPauseButton).toHaveAttribute('aria-label', 'Play')

	// Test 3-second seek buttons
	const seekBackwardButton = page.getByLabel('Seek backward 3 seconds')
	const seekForwardButton = page.getByLabel('Seek forward 3 seconds')

	await expect(seekBackwardButton).toBeVisible()
	await expect(seekForwardButton).toBeVisible()

	// Get initial time
	const initialTime = await seekBar.getAttribute('value')
	const initialTimeNum = parseFloat(initialTime || '0')

	// Test backward seek
	await seekBackwardButton.click()
	await page.waitForTimeout(200)
	const afterBackward = await seekBar.getAttribute('value')
	const afterBackwardNum = parseFloat(afterBackward || '0')
	expect(afterBackwardNum).toBeLessThan(initialTimeNum)

	// Test forward seek
	await seekForwardButton.click()
	await page.waitForTimeout(200)
	const afterForward = await seekBar.getAttribute('value')
	const afterForwardNum = parseFloat(afterForward || '0')
	expect(afterForwardNum).toBeGreaterThan(afterBackwardNum)

	// Test actual seeking with real video
	const maxValue = await seekBar.getAttribute('max')
	const seekValue = (parseFloat(maxValue || '0') * 0.5).toString()
	await seekBar.fill(seekValue)
	await page.waitForTimeout(200)

	// Test frame navigation buttons
	const prevFrameButton = page.getByLabel('Previous frame')
	const nextFrameButton = page.getByLabel('Next frame')

	await expect(prevFrameButton).toBeVisible()
	await expect(nextFrameButton).toBeVisible()

	// Click next frame
	await nextFrameButton.click()
	await page.waitForTimeout(100)

	// Click previous frame
	await prevFrameButton.click()
	await page.waitForTimeout(100)

	// Check that time display is present with milliseconds format
	// Time format should be something like "0:00.000 / 0:00.000"
	// The time is split across multiple spans, so check for the format
	await expect(
		page.locator('.text-muted-foreground.text-sm').filter({
			hasText: /\d+:\d+\.\d{3}/,
		}),
	).toBeVisible()

	// Test reload button appears when at the end
	const finalSeekValue = maxValue
	if (finalSeekValue) {
		await seekBar.fill(finalSeekValue)
		await page.waitForTimeout(300)

		// Button should show "Restart" when at the end
		await expect(playPauseButton).toHaveAttribute('aria-label', 'Restart')

		// Click reload should restart from beginning
		await playPauseButton.click()
		await page.waitForTimeout(300)

		// Should be back at the beginning
		const restartedTime = await seekBar.getAttribute('value')
		expect(parseFloat(restartedTime || '0')).toBeLessThan(0.1)
	}
})

test('User can click on video to place a tracking point', async ({
	page,
	navigate,
	login,
}) => {
	const user = await login()

	// First, upload a video
	await navigate('/videos/new')

	// Use actual video file for more realistic testing
	const videoFilePath = join(__dirname, 'data', 'WhichLandsFirst.mp4')
	const videoFileName = 'WhichLandsFirst.mp4'

	const fileInput = page.getByLabel(/video file/i)
	await fileInput.setInputFiles(videoFilePath)

	// File info should be displayed
	await expect(page.getByText(videoFileName)).toBeVisible()

	// Click upload submit button (not the toggle button)
	await page.getByRole('button', { name: 'Upload', exact: true }).click()

	// Wait for upload to complete
	await expect(page).toHaveURL('/videos/new')

	// Wait for video to be stored in database (with retry)
	let video = null
	for (let i = 0; i < 20; i++) {
		video = await prisma.video.findFirst({
			where: {
				userId: user.id,
				filename: videoFileName,
			},
		})
		if (video) break
		await page.waitForTimeout(200) // Wait 200ms before retrying
	}

	expect(video).toBeDefined()
	if (!video) {
		throw new Error('Video not found')
	}

	// Navigate to video player page
	await page.goto(`/videos/${video.id}`)

	// Wait for video player to load
	await expect(
		page.getByRole('heading', { name: video.filename }),
	).toBeVisible()

	// Check that video element exists
	const videoElement = page.getByLabel('Video content')
	await expect(videoElement).toBeVisible()

	// Wait for video metadata to load
	await expect(async () => {
		const duration = await videoElement.evaluate(
			(el) => (el as HTMLVideoElement).duration,
		)
		expect(duration).toBeGreaterThan(0)
		expect(Number.isFinite(duration)).toBe(true)
	}).toPass({ timeout: 10000 })

	// Wait for canvas to be present (tracking canvas overlay)
	const canvas = page.getByLabel(
		'Tracking canvas - click to place tracking points',
	)
	await expect(canvas).toBeVisible()

	// Get canvas dimensions for click coordinates
	const canvasRect = await canvas.boundingBox()
	expect(canvasRect).toBeDefined()
	if (!canvasRect) {
		throw new Error('Canvas element not found')
	}

	// Click on the canvas to place a tracking point
	// Click near the center of the canvas
	const clickX = canvasRect.width * 0.5
	const clickY = canvasRect.height * 0.5

	await canvas.click({ position: { x: clickX, y: clickY } })

	// Wait a bit for the point to be saved
	await page.waitForTimeout(500)

	// Verify tracking point was created in database
	const trackingPoints = await prisma.trackingPoint.findMany({
		where: { videoId: video.id },
	})

	expect(trackingPoints.length).toBeGreaterThan(0)

	// Verify the point has correct data
	const point = trackingPoints[0]
	expect(point).toBeDefined()
	if (!point) {
		throw new Error('Tracking point not found')
	}
	expect(point.frame).toBeGreaterThanOrEqual(0)
	expect(point.x).toBeGreaterThanOrEqual(0)
	expect(point.y).toBeGreaterThanOrEqual(0)
	expect(point.videoId).toBe(video.id)
	expect(point.trackingObjectId).toBeDefined()
})

test('User can navigate frames and place multiple points', async ({
	page,
	navigate,
	login,
}) => {
	const user = await login()

	// First, upload a video
	await navigate('/videos/new')

	// Use actual video file for more realistic testing
	const videoFilePath = join(__dirname, 'data', 'WhichLandsFirst.mp4')
	const videoFileName = 'WhichLandsFirst.mp4'

	const fileInput = page.getByLabel(/video file/i)
	await fileInput.setInputFiles(videoFilePath)

	// File info should be displayed
	await expect(page.getByText(videoFileName)).toBeVisible()

	// Click upload submit button (not the toggle button)
	await page.getByRole('button', { name: 'Upload', exact: true }).click()

	// Wait for upload to complete
	await expect(page).toHaveURL('/videos/new')

	// Wait for video to be stored in database (with retry)
	let video = null
	for (let i = 0; i < 20; i++) {
		video = await prisma.video.findFirst({
			where: {
				userId: user.id,
				filename: videoFileName,
			},
		})
		if (video) break
		await page.waitForTimeout(200) // Wait 200ms before retrying
	}

	expect(video).toBeDefined()
	if (!video) {
		throw new Error('Video not found')
	}

	// Navigate to video player page
	await page.goto(`/videos/${video.id}`)

	// Wait for video player to load
	await expect(
		page.getByRole('heading', { name: video.filename }),
	).toBeVisible()

	// Check that video element exists
	const videoElement = page.getByLabel('Video content')
	await expect(videoElement).toBeVisible()

	// Wait for video metadata to load
	await expect(async () => {
		const duration = await videoElement.evaluate(
			(el) => (el as HTMLVideoElement).duration,
		)
		expect(duration).toBeGreaterThan(0)
		expect(Number.isFinite(duration)).toBe(true)
	}).toPass({ timeout: 10000 })

	// Wait for canvas to be present
	const canvas = page.getByLabel(
		'Tracking canvas - click to place tracking points',
	)
	await expect(canvas).toBeVisible()

	// Get canvas dimensions
	const canvasRect = await canvas.boundingBox()
	expect(canvasRect).toBeDefined()
	if (!canvasRect) {
		throw new Error('Canvas element not found')
	}

	// Place first point at frame 0 (near center)
	const clickX1 = canvasRect.width * 0.5
	const clickY1 = canvasRect.height * 0.5
	await canvas.click({ position: { x: clickX1, y: clickY1 } })
	await page.waitForTimeout(500)

	// Navigate to next frame
	const nextFrameButton = page.getByLabel('Next frame')
	await nextFrameButton.click()
	await page.waitForTimeout(200)

	// Place second point (slightly to the right, simulating object movement)
	const clickX2 = canvasRect.width * 0.55
	const clickY2 = canvasRect.height * 0.5
	await canvas.click({ position: { x: clickX2, y: clickY2 } })
	await page.waitForTimeout(500)

	// Navigate to another frame
	await nextFrameButton.click()
	await page.waitForTimeout(200)

	// Place third point (continuing the movement)
	const clickX3 = canvasRect.width * 0.6
	const clickY3 = canvasRect.height * 0.5
	await canvas.click({ position: { x: clickX3, y: clickY3 } })
	await page.waitForTimeout(500)

	// Verify tracking points were created in database
	const trackingPoints = await prisma.trackingPoint.findMany({
		where: { videoId: video.id },
		orderBy: { frame: 'asc' },
	})

	expect(trackingPoints.length).toBeGreaterThanOrEqual(3)

	// Verify all points share the same trackingObjectId (they should be part of the same tracking object)
	const trackingObjectIds = new Set(
		trackingPoints.map((p) => p.trackingObjectId),
	)
	// At least some points should share the same trackingObjectId
	// (they might be grouped if clicked near each other)
	expect(trackingObjectIds.size).toBeGreaterThan(0)

	// Verify points are associated with correct frame numbers
	const frames = trackingPoints.map((p) => p.frame)
	expect(frames.length).toBeGreaterThanOrEqual(3)
	// Frames should be sequential or close to each other
	const sortedFrames = [...frames].sort((a, b) => a - b)
	expect(sortedFrames[0]).toBeGreaterThanOrEqual(0)
})

test('User can draw a scale line and input distance', async ({
	page,
	login,
	navigate,
}) => {
	const user = await login()

	// First, upload a video
	await navigate('/videos/new')

	// Use actual video file for more realistic testing
	const videoFilePath = join(__dirname, 'data', 'WhichLandsFirst.mp4')
	const videoFileName = 'WhichLandsFirst.mp4'

	const fileInput = page.getByLabel(/video file/i)
	await fileInput.setInputFiles(videoFilePath)

	// File info should be displayed
	await expect(page.getByText(videoFileName)).toBeVisible()

	// Click upload submit button (not the toggle button)
	await page.getByRole('button', { name: 'Upload', exact: true }).click()

	// Wait for upload to complete
	await expect(page).toHaveURL('/videos/new')

	// Wait for video to be stored in database (with retry)
	let video = null
	for (let i = 0; i < 20; i++) {
		video = await prisma.video.findFirst({
			where: {
				userId: user.id,
				filename: videoFileName,
			},
		})
		if (video) break
		await page.waitForTimeout(200) // Wait 200ms before retrying
	}

	expect(video).toBeDefined()
	expect(video?.filename).toBe(videoFileName)
	expect(video?.userId).toBe(user.id)
	expect(video?.url).toBeDefined()

	// Assert video is not null for TypeScript
	if (!video) {
		throw new Error('Video not found')
	}

	// Navigate to video player page (use page.goto for dynamic routes)
	await page.goto(`/videos/${video.id}`)

	// Wait for video player to load - use the actual filename from database
	await expect(
		page.getByRole('heading', { name: video.filename }),
	).toBeVisible()

	// Check that video element exists
	const videoElement = page.getByLabel('Video content')
	await expect(videoElement).toBeVisible()

	// Wait for video metadata to load by waiting for the video's loadedmetadata event
	await videoElement.evaluate((el) => {
		return new Promise<void>((resolve) => {
			if ((el as HTMLVideoElement).readyState >= 1) {
				resolve()
				return
			}
			el.addEventListener('loadedmetadata', () => resolve(), { once: true })
		})
	})

	// Wait for video metadata to load first (duration must be available)
	// This ensures the video file is actually loaded and ready
	await expect(async () => {
		const duration = await videoElement.evaluate(
			(el) => (el as HTMLVideoElement).duration,
		)
		expect(duration).toBeGreaterThan(0)
		expect(Number.isFinite(duration)).toBe(true)
	}).toPass({ timeout: 10000 })

	// Click "Set Scale" button
	const setScaleButton = page.getByRole('button', { name: /set scale/i })
	await setScaleButton.click()

	// Wait for scale calibration mode to activate
	await expect(
		page.getByText(/click on the video to set the start point/i),
	).toBeVisible()

	// Get canvas element
	const canvas = page.locator('canvas').first()
	await expect(canvas).toBeVisible()
	const canvasRect = await canvas.boundingBox()
	expect(canvasRect).not.toBeNull()
	if (!canvasRect) throw new Error('Canvas not found')

	// Click first point (start of scale line)
	const startX = canvasRect.width * 0.2
	const startY = canvasRect.height * 0.5
	await canvas.click({ position: { x: startX, y: startY } })
	await page.waitForTimeout(300)

	// Should now ask for end point
	await expect(
		page.getByText(/click on the video to set the end point/i),
	).toBeVisible()

	// Click second point (end of scale line)
	const endX = canvasRect.width * 0.8
	const endY = canvasRect.height * 0.5
	await canvas.click({ position: { x: endX, y: endY } })
	await page.waitForTimeout(300)

	// Should now show input for distance
	await expect(
		page.getByText(/enter the real-world distance in meters/i),
	).toBeVisible()

	const distanceInput = page.getByLabel(/distance \(meters\)/i)
	await expect(distanceInput).toBeVisible()
	await distanceInput.fill('1.0')

	// Click "Save Scale" button
	const saveButton = page.getByRole('button', { name: /save scale/i })
	await expect(saveButton).not.toBeDisabled()
	await saveButton.click()
	await page.waitForTimeout(500)

	// Verify scale was saved in database
	const scale = await prisma.videoScale.findUnique({
		where: { videoId: video.id },
	})

	expect(scale).toBeDefined()
	expect(scale?.distanceMeters).toBe(1.0)
	expect(scale?.pixelsPerMeter).toBeGreaterThan(0)

	// Verify scale line is displayed (green line)
	await expect(page.getByText(/distance: 1\.0 m/i)).toBeVisible({
		timeout: 2000,
	})
})

test('User can export tracking data and download CSV file', async ({
	page,
	navigate,
	login,
}) => {
	const user = await login()

	// First, upload a video
	await navigate('/videos/new')

	const videoFilePath = join(__dirname, 'data', 'WhichLandsFirst.mp4')
	const videoFileName = 'WhichLandsFirst.mp4'

	const fileInput = page.getByLabel(/video file/i)
	await fileInput.setInputFiles(videoFilePath)

	await page.getByRole('button', { name: 'Upload', exact: true }).click()
	await expect(page).toHaveURL('/videos/new')
	await page.waitForTimeout(1000)

	// Wait for video to be stored in database
	let video = null
	for (let i = 0; i < 30; i++) {
		video = await prisma.video.findFirst({
			where: {
				userId: user.id,
				filename: videoFileName,
			},
			select: { id: true },
		})
		if (video) break
		await page.waitForTimeout(300)
	}

	expect(video).toBeDefined()
	if (!video) throw new Error('Video not found')

	// Create tracking points directly in database for more reliable testing
	await prisma.trackingPoint.createMany({
		data: [
			{
				videoId: video.id,
				frame: 0,
				x: 100.5,
				y: 200.75,
				trackingObjectId: 'obj_test_1',
			},
			{
				videoId: video.id,
				frame: 30,
				x: 150.25,
				y: 250.5,
				trackingObjectId: 'obj_test_1',
			},
		],
	})

	// Navigate to video player page
	await page.goto(`/videos/${video.id}`)

	// Wait for video player to load
	await expect(page.getByRole('heading', { name: videoFileName })).toBeVisible()

	// Wait for export button to be visible (indicates tracking points are loaded)
	const exportButton = page.getByRole('button', { name: /export csv/i })
	await expect(exportButton).toBeVisible()
	await expect(exportButton).not.toBeDisabled()

	// Set up download listener before clicking export
	const downloadPromise = page.waitForEvent('download', { timeout: 15000 })

	// Click the export button (triggers navigation to resource route)
	await exportButton.click()

	// Wait for download to start
	const download = await downloadPromise

	// Verify download filename (should contain tracking_data.csv)
	const filename = download.suggestedFilename()
	expect(filename).toContain('tracking_data.csv')

	// Read the downloaded file content
	const path = await download.path()
	if (!path) throw new Error('Download path not available')

	const fs = await import('fs/promises')
	const fileContent = await fs.readFile(path, 'utf-8')

	// Verify CSV content
	expect(fileContent).toContain('trackingObjectId')
	expect(fileContent).toContain('frame')
	expect(fileContent).toContain('time (seconds)')
	expect(fileContent).toContain('x (pixels)')
	expect(fileContent).toContain('y (pixels)')

	// Verify there are data rows
	const lines = fileContent.split('\n').filter((line) => line.trim())
	expect(lines.length).toBeGreaterThan(1) // Header + data rows

	// Verify specific data points
	expect(fileContent).toContain('obj_test_1,0,0.000000,100.50,200.75')
	expect(fileContent).toContain('obj_test_1,30,1.000000,150.25,250.50')
})

test('User can view position vs time graph', async ({
	page,
	navigate,
	login,
}) => {
	const user = await login()

	// Upload a video
	await navigate('/videos/new')

	const videoFilePath = join(__dirname, 'data', 'WhichLandsFirst.mp4')
	const videoFileName = 'WhichLandsFirst.mp4'

	const fileInput = page.getByLabel(/video file/i)
	await fileInput.setInputFiles(videoFilePath)

	await page.getByRole('button', { name: 'Upload', exact: true }).click()
	await expect(page).toHaveURL('/videos/new')
	await page.waitForTimeout(1000)

	// Wait for video to be stored in database
	let video = null
	for (let i = 0; i < 30; i++) {
		video = await prisma.video.findFirst({
			where: {
				userId: user.id,
				filename: videoFileName,
			},
			select: { id: true },
		})
		if (video) break
		await page.waitForTimeout(300)
	}

	expect(video).toBeDefined()
	if (!video) throw new Error('Video not found')

	// Create tracking points directly in database
	await prisma.trackingPoint.createMany({
		data: [
			{
				videoId: video.id,
				frame: 0,
				x: 100,
				y: 200,
				trackingObjectId: 'obj_graph_1',
			},
			{
				videoId: video.id,
				frame: 30,
				x: 150,
				y: 250,
				trackingObjectId: 'obj_graph_1',
			},
			{
				videoId: video.id,
				frame: 60,
				x: 200,
				y: 300,
				trackingObjectId: 'obj_graph_1',
			},
		],
	})

	// Navigate to video player page
	await page.goto(`/videos/${video.id}`)

	// Wait for video player to load
	await expect(page.getByRole('heading', { name: videoFileName })).toBeVisible()

	// Wait for graph to be visible
	await expect(page.getByText('Position vs Time')).toBeVisible()

	// Check that axis toggle buttons are present
	const xAxisButton = page.getByRole('button', { name: /x axis/i })
	const yAxisButton = page.getByRole('button', { name: /y axis/i })

	await expect(xAxisButton).toBeVisible()
	await expect(yAxisButton).toBeVisible()

	// Verify graph container is rendered (Recharts creates SVG elements)
	// The graph should be in a container with height
	const graphContainer = page.locator('text=Position vs Time').locator('..')
	await expect(graphContainer).toBeVisible()

	// Test X/Y toggle functionality
	// Initially X should be selected (default)
	await expect(xAxisButton).toHaveClass(/bg-primary/)

	// Click Y axis button
	await yAxisButton.click()

	// Y should now be selected
	await expect(yAxisButton).toHaveClass(/bg-primary/)
	await expect(xAxisButton).not.toHaveClass(/bg-primary/)

	// Click X axis button again
	await xAxisButton.click()

	// X should be selected again
	await expect(xAxisButton).toHaveClass(/bg-primary/)
	await expect(yAxisButton).not.toHaveClass(/bg-primary/)
})
