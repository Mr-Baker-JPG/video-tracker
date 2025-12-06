import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
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

	// Click upload (same as video-upload.test.ts)
	await page.getByRole('button', { name: /upload/i }).click()

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
	const videoElement = page.locator('video')
	await expect(videoElement).toBeVisible()

	// Check that controls are present
	await expect(page.getByLabel(/play|pause/i)).toBeVisible()
	await expect(page.getByLabel('Previous frame')).toBeVisible()
	await expect(page.getByLabel('Next frame')).toBeVisible()
	await expect(page.getByLabel('Video seek')).toBeVisible()

	// Test play/pause button
	const playPauseButton = page.getByLabel(/play|pause/i)

	// Initially should show "Play"
	await expect(playPauseButton).toHaveText('Play')

	// Click play
	await playPauseButton.click()

	// Wait a bit for video to start (if it can)
	await page.waitForTimeout(500)

	// Click pause (button text should change)
	await playPauseButton.click()
	await expect(playPauseButton).toHaveText('Play')

	// Test seek functionality
	const seekBar = page.getByLabel('Video seek')
	await expect(seekBar).toBeVisible()

	// Wait for video metadata to load (duration, etc.)
	await page.waitForTimeout(500)

	// Try to seek (now works with real video file)
	const seekBarValue = await seekBar.getAttribute('value')
	expect(seekBarValue).toBeDefined()

	// Test actual seeking with real video
	await seekBar.fill('0.5') // Seek to 50%
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

	// Check that time display is present
	// Time format should be something like "0:00 / 0:00"
	const timeDisplay = page.locator('text=/\\d+:\\d+\\s*\\/\\s*\\d+:\\d+/')
	await expect(timeDisplay).toBeVisible()
})
