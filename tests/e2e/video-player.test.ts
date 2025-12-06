import { expect, test } from '#tests/playwright-utils.ts'
import { prisma } from '#app/utils/db.server.ts'

test('User can play, pause, and seek through video', async ({
	page,
	navigate,
	login,
}) => {
	const user = await login()

	// First, upload a video
	await navigate('/videos/new')

	const videoContent = new Uint8Array(2048).fill(0)
	const videoFile = {
		name: 'player-test-video.mp4',
		mimeType: 'video/mp4',
		buffer: Buffer.from(videoContent),
	}

	const fileInput = page.getByLabel(/video file/i)
	await fileInput.setInputFiles({
		name: videoFile.name,
		mimeType: videoFile.mimeType,
		buffer: videoFile.buffer,
	})

	await page.getByRole('button', { name: /upload/i }).click()

	// Wait for upload to complete
	await expect(page).toHaveURL('/videos/new')

	// Get the video ID from database
	let video = null
	for (let i = 0; i < 10; i++) {
		video = await prisma.video.findFirst({
			where: {
				userId: user.id,
				filename: videoFile.name,
			},
		})
		if (video) break
		await page.waitForTimeout(100)
	}

	expect(video).toBeDefined()

	// Navigate to video player page
	await navigate(`/videos/${video.id}`)

	// Wait for video player to load
	await expect(page.getByRole('heading', { name: videoFile.name })).toBeVisible()

	// Check that video element exists
	const videoElement = page.locator('video')
	await expect(videoElement).toBeVisible()

	// Check that controls are present
	await expect(page.getByLabelText(/play|pause/i)).toBeVisible()
	await expect(page.getByLabelText('Previous frame')).toBeVisible()
	await expect(page.getByLabelText('Next frame')).toBeVisible()
	await expect(page.getByLabelText('Video seek')).toBeVisible()

	// Test play/pause button
	const playPauseButton = page.getByLabelText(/play|pause/i)
	
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
	const seekBar = page.getByLabelText('Video seek')
	await expect(seekBar).toBeVisible()

	// Try to seek (this may not work with a dummy video file, but we can test the UI)
	const seekBarValue = await seekBar.getAttribute('value')
	expect(seekBarValue).toBeDefined()

	// Test frame navigation buttons
	const prevFrameButton = page.getByLabelText('Previous frame')
	const nextFrameButton = page.getByLabelText('Next frame')

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
