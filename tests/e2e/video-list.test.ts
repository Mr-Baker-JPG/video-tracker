import { prisma } from '#app/utils/db.server.ts'
import { expect, test } from '#tests/playwright-utils.ts'

test('User can view their video list', async ({ page, navigate, login }) => {
	const user = await login()

	// Create test videos
	const video1 = await prisma.video.create({
		data: {
			filename: 'test-video-1.mp4',
			url: 'users/test/videos/video1.mp4',
			userId: user.id,
		},
	})

	const video2 = await prisma.video.create({
		data: {
			filename: 'test-video-2.mp4',
			url: 'users/test/videos/video2.mp4',
			userId: user.id,
		},
	})

	await navigate('/videos')

	await expect(page).toHaveURL('/videos')
	await expect(page.getByRole('heading', { name: /my videos/i })).toBeVisible()

	// Check that videos are displayed
	await expect(page.getByText('test-video-1.mp4')).toBeVisible()
	await expect(page.getByText('test-video-2.mp4')).toBeVisible()

	// Check that upload button is present
	await expect(
		page.getByRole('link', { name: /upload video/i }),
	).toBeVisible()

	// Check that videos link to their detail pages
	// The link wraps the entire card, find it by href
	const video1Link = page.locator(`a[href="/videos/${video1.id}"]`)
	await expect(video1Link).toBeVisible()
	await expect(video1Link).toHaveAttribute('href', `/videos/${video1.id}`)

	const video2Link = page.locator(`a[href="/videos/${video2.id}"]`)
	await expect(video2Link).toBeVisible()
	await expect(video2Link).toHaveAttribute('href', `/videos/${video2.id}`)
})

test('User can delete a video from the list', async ({ page, navigate, login }) => {
	const user = await login()

	// Create a test video
	const video = await prisma.video.create({
		data: {
			filename: 'test-video-to-delete.mp4',
			url: 'users/test/videos/delete-me.mp4',
			userId: user.id,
		},
	})

	await navigate('/videos')

	await expect(page).toHaveURL('/videos')
	await expect(page.getByText('test-video-to-delete.mp4')).toBeVisible()

	// Find the delete button by finding the form with the video ID
	const deleteForm = page.locator(`form:has(input[value="${video.id}"])`)
	await expect(deleteForm).toBeVisible()

	// Hover over the card to show delete button (button is hidden by default)
	const videoCard = page
		.getByText('test-video-to-delete.mp4')
		.locator('..')
		.locator('..')
		.locator('..')
	await videoCard.hover()

	// Find and click delete button
	const deleteButton = deleteForm.getByRole('button')
	await expect(deleteButton).toBeVisible({ timeout: 2000 })

	// First click should show confirmation
	await deleteButton.click()

	// Wait for double-check state (button should still be visible, might change text)
	await page.waitForTimeout(300)

	// Click again to confirm deletion
	await deleteButton.click()

	// Wait for video to be removed from the list
	await expect(page.getByText('test-video-to-delete.mp4')).not.toBeVisible({
		timeout: 5000,
	})

	// Verify video is deleted from database
	const deletedVideo = await prisma.video.findUnique({
		where: { id: video.id },
	})
	expect(deletedVideo).toBeNull()
})

test('Video list shows empty state when no videos', async ({
	page,
	navigate,
	login,
}) => {
	await login()

	await navigate('/videos')

	await expect(page).toHaveURL('/videos')
	await expect(page.getByRole('heading', { name: /my videos/i })).toBeVisible()

	// Check empty state
	await expect(page.getByText(/no videos yet/i)).toBeVisible()
	await expect(
		page.getByText(/upload your first video to get started/i),
	).toBeVisible()

	// Check that upload link is present in empty state (there are two, check the one in empty state)
	const emptyStateSection = page.getByText(/no videos yet/i).locator('..')
	await expect(
		emptyStateSection.getByRole('link', { name: /upload video/i }),
	).toBeVisible()
})
