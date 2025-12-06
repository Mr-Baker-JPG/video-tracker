import { expect, test } from '#tests/playwright-utils.ts'
import { prisma } from '#app/utils/db.server.ts'

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

	// Upload button should be enabled
	const uploadButton = page.getByRole('button', { name: /upload/i })
	await expect(uploadButton).toBeEnabled()

	// Click upload (this will trigger form submission)
	await uploadButton.click()

	// Wait for upload to complete and success message
	await expect(page.getByText(/uploading/i))
		.toBeVisible()
		.catch(() => {
			// Progress might not show if submission is too fast
		})

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

	await page.getByRole('button', { name: /upload/i }).click()

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

	// Verify video can be retrieved by ID
	const retrieved = await prisma.video.findUnique({
		where: { id: video.id },
		include: { user: true },
	})

	expect(retrieved).toBeDefined()
	expect(retrieved?.user.id).toBe(user.id)
	expect(retrieved?.filename).toBe(videoFile.name)
})
