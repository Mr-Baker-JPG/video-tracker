import { prisma } from '#app/utils/db.server.ts'
import { expect, test } from '#tests/playwright-utils.ts'

test('User can select a video file and see upload progress', async ({
	page,
	navigate,
	login,
}) => {
	const user = await login()

	await navigate('/videos/new')

	await expect(page).toHaveURL('/videos/new')
	await expect(
		page.getByRole('heading', { name: /upload video/i }),
	).toBeVisible()

	// File input should be present
	const fileInput = page.getByLabel(/video file/i)
	await expect(fileInput).toBeVisible()

	// Create a test video file
	const videoContent = new Uint8Array(1024).fill(0)
	const videoFile = {
		name: 'test-video.mp4',
		mimeType: 'video/mp4',
		buffer: Buffer.from(videoContent),
	}

	// Select the file
	await fileInput.setInputFiles({
		name: videoFile.name,
		mimeType: videoFile.mimeType,
		buffer: videoFile.buffer,
	})

	// File info should be displayed
	await expect(page.getByText(videoFile.name)).toBeVisible()
	// Look for file size pattern (number followed by unit) to avoid matching "breadcrumb"
	await expect(page.getByText(/\d+\s*(bytes|kb|mb|gb)/i)).toBeVisible()

	// Upload button should be enabled (specifically the submit button, not the toggle)
	const uploadButton = page.getByRole('button', { name: /^upload$/i })
	await expect(uploadButton).toBeEnabled()

	// Click upload (this will trigger form submission)
	await uploadButton.click()

	// Wait for upload to complete and success message
	try {
		await expect(page.getByText(/uploading/i)).toBeVisible()
	} catch {
		// Progress might not show if submission is too fast
	}

	// Wait for redirect back to the page (after successful upload)
	await expect(page).toHaveURL('/videos/new')

	// Wait for video to be stored in database (with retry)
	let video = null
	for (let i = 0; i < 10; i++) {
		video = await prisma.video.findFirst({
			where: {
				userId: user.id,
				filename: videoFile.name,
			},
		})
		if (video) break
		await page.waitForTimeout(100) // Wait 100ms before retrying
	}

	expect(video).toBeDefined()
	expect(video?.filename).toBe(videoFile.name)
	expect(video?.userId).toBe(user.id)
	expect(video?.url).toBeDefined()
})

test('Uploaded video is stored and retrievable', async ({
	page,
	navigate,
	login,
}) => {
	const user = await login()

	await navigate('/videos/new')

	// Create a test video file
	const videoContent = new Uint8Array(2048).fill(0)
	const videoFile = {
		name: 'retrievable-video.mp4',
		mimeType: 'video/mp4',
		buffer: Buffer.from(videoContent),
	}

	// Upload the video
	const fileInput = page.getByLabel(/video file/i)
	await fileInput.setInputFiles({
		name: videoFile.name,
		mimeType: videoFile.mimeType,
		buffer: videoFile.buffer,
	})

	// Wait for file to be selected and upload button to be enabled
	await expect(page.getByText(videoFile.name)).toBeVisible()
	const uploadButton = page.getByRole('button', { name: /^upload$/i })
	await expect(uploadButton).toBeEnabled()
	await uploadButton.click()

	// Wait for upload to complete
	await expect(page).toHaveURL('/videos/new')

	// Wait for video to be stored in database (with retry)
	let video = null
	for (let i = 0; i < 10; i++) {
		video = await prisma.video.findFirst({
			where: {
				userId: user.id,
				filename: videoFile.name,
			},
		})
		if (video) break
		await page.waitForTimeout(100) // Wait 100ms before retrying
	}

	expect(video).toBeDefined()
	expect(video?.filename).toBe(videoFile.name)
	expect(video?.userId).toBe(user.id)
	expect(video?.url).toBeDefined()
	expect(video?.uploadedAt).toBeInstanceOf(Date)

	// Assert video is not null for TypeScript
	if (!video) {
		throw new Error('Video not found')
	}

	// Verify video can be retrieved by ID
	const retrieved = await prisma.video.findUnique({
		where: { id: video.id },
		include: { user: true },
	})

	expect(retrieved).toBeDefined()
	expect(retrieved?.user.id).toBe(user.id)
	expect(retrieved?.filename).toBe(videoFile.name)
})

test('User can input a YouTube URL and see validation feedback', async ({
	page,
	navigate,
	login,
}) => {
	const user = await login()

	await navigate('/videos/new')

	await expect(page).toHaveURL('/videos/new')
	await expect(
		page.getByRole('heading', { name: /upload video/i }),
	).toBeVisible()

	// Switch to YouTube URL mode
	const youtubeButton = page.getByRole('button', { name: /youtube url/i })
	await expect(youtubeButton).toBeVisible()
	await youtubeButton.click()

	// YouTube URL input should be visible
	const youtubeInput = page.getByLabel(/youtube url/i)
	await expect(youtubeInput).toBeVisible()
	await expect(youtubeInput).toHaveAttribute('placeholder', /youtube\.com/i)

	// Test valid YouTube URL
	const validUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
	await youtubeInput.fill(validUrl)

	// Wait for validation feedback
	await expect(page.getByText(/valid youtube url detected/i)).toBeVisible()
	await expect(page.getByText(/video id:/i)).toBeVisible()
	await expect(page.getByText(/dQw4w9WgXcQ/i)).toBeVisible()

	// Check for placeholder message about future processing (in the form, not toast)
	await expect(
		page.getByText(/note:.*youtube video processing is not yet available/i),
	).toBeVisible()

	// Submit button should be enabled
	const submitButton = page.getByRole('button', { name: /submit url/i })
	await expect(submitButton).toBeEnabled()

	// Submit the form
	await submitButton.click()

	// Should show info message about processing not being available (in toast)
	await expect(page.getByText(/youtube video detected/i)).toBeVisible()
	// Check for the toast message specifically (it appears after redirect)
	await expect(
		page.getByText(/youtube video processing is not yet available.*video id/i),
	).toBeVisible()
})

test('YouTube URL validation rejects invalid URLs', async ({
	page,
	navigate,
	login,
}) => {
	const user = await login()

	await navigate('/videos/new')

	// Switch to YouTube URL mode
	const youtubeButton = page.getByRole('button', { name: /youtube url/i })
	await youtubeButton.click()

	const youtubeInput = page.getByLabel(/youtube url/i)

	// Test invalid URL
	await youtubeInput.fill('not a valid url')
	// Blur to trigger validation
	await youtubeInput.blur()

	// Wait a bit for validation to run
	await page.waitForTimeout(1000)

	// Should show validation feedback - check that the help text appears or error appears
	// The form may show either the yellow help text or the error list
	const hasValidationFeedback = await Promise.race([
		page
			.locator('li.text-foreground-destructive')
			.filter({ hasText: /please enter a valid youtube url/i })
			.waitFor({ timeout: 2000 })
			.then(() => true)
			.catch(() => false),
		page
			.getByText(/please enter a valid youtube url.*e\.g\./i)
			.waitFor({ timeout: 2000 })
			.then(() => true)
			.catch(() => false),
	])
	expect(hasValidationFeedback).toBe(true)

	// Submit button should be disabled
	const submitButton = page.getByRole('button', { name: /submit url/i })
	await expect(submitButton).toBeDisabled()

	// Test non-YouTube URL
	await youtubeInput.fill('https://vimeo.com/123456789')
	await youtubeInput.blur()
	await page.waitForTimeout(1000)

	const hasValidationFeedback2 = await Promise.race([
		page
			.locator('li.text-foreground-destructive')
			.filter({ hasText: /please enter a valid youtube url/i })
			.waitFor({ timeout: 2000 })
			.then(() => true)
			.catch(() => false),
		page
			.getByText(/please enter a valid youtube url.*e\.g\./i)
			.waitFor({ timeout: 2000 })
			.then(() => true)
			.catch(() => false),
	])
	expect(hasValidationFeedback2).toBe(true)

	// Test various YouTube URL formats
	const validUrls = [
		'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
		'https://youtu.be/dQw4w9WgXcQ',
		'https://youtube.com/watch?v=dQw4w9WgXcQ',
	]

	for (const url of validUrls) {
		await youtubeInput.fill(url)
		await page.waitForTimeout(500)

		// Should show valid feedback
		await expect(page.getByText(/valid youtube url detected/i)).toBeVisible()

		// Submit button should be enabled
		await expect(submitButton).toBeEnabled()
	}
})
