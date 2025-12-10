/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { test, expect, vi } from 'vitest'
import { VideoPlayer } from './video-player.tsx'

// Mock MediaError for jsdom environment
if (typeof window !== 'undefined' && !window.MediaError) {
	// @ts-expect-error - MediaError is not in jsdom types
	window.MediaError = class MediaError {
		static readonly MEDIA_ERR_ABORTED = 1
		static readonly MEDIA_ERR_NETWORK = 2
		static readonly MEDIA_ERR_DECODE = 3
		static readonly MEDIA_ERR_SRC_NOT_SUPPORTED = 4

		code = 0
		message = ''
	}
}

// Helper to render VideoPlayer with router context
function renderWithRouter(component: React.ReactElement) {
	const router = createMemoryRouter([
		{
			path: '/',
			element: component,
		},
	])
	return render(<RouterProvider router={router} />)
}

test('Video player component renders with controls', () => {
	const { container } = renderWithRouter(
		<VideoPlayer src="/test-video.mp4" trackingObjects={[]} />,
	)

	// Check video element exists
	const video = container.querySelector('video')
	expect(video).toBeInTheDocument()
	expect(video?.getAttribute('src')).toBe('/test-video.mp4')

	// Check controls exist
	expect(screen.getByLabelText(/play|pause|restart/i)).toBeInTheDocument()
	expect(screen.getByLabelText('Seek backward 3 seconds')).toBeInTheDocument()
	expect(screen.getByLabelText('Previous frame')).toBeInTheDocument()
	expect(screen.getByLabelText('Next frame')).toBeInTheDocument()
	expect(screen.getByLabelText('Seek forward 3 seconds')).toBeInTheDocument()

	// Check seek bar exists
	const seekBar = screen.getByLabelText('Video seek')
	expect(seekBar).toBeInTheDocument()
	expect(seekBar).toHaveAttribute('type', 'range')
	expect(seekBar).toHaveAttribute('step', '0.0001')
})

test('Play/pause functionality works', async () => {
	const user = userEvent.setup()
	const { container } = renderWithRouter(
		<VideoPlayer src="/test-video.mp4" trackingObjects={[]} />,
	)

	// Wait for video element to be rendered
	await waitFor(() => {
		const video = container.querySelector('video')
		expect(video).toBeInTheDocument()
	})

	const video = container.querySelector('video') as HTMLVideoElement
	const playPauseButton = screen.getByLabelText(/play|pause|restart/i)

	// Set up video properties
	Object.defineProperty(video, 'paused', {
		configurable: true,
		get: () => video._paused ?? true,
		set: (value) => {
			video._paused = value
		},
	})

	let currentTimeValue = 0
	Object.defineProperty(video, 'currentTime', {
		configurable: true,
		get: () => currentTimeValue,
		set: (value) => {
			currentTimeValue = value
		},
	})

	Object.defineProperty(video, 'duration', {
		configurable: true,
		writable: true,
		value: 100,
	})

	// Mock play and pause methods
	video.play = vi.fn().mockResolvedValue(undefined)
	video.pause = vi.fn()

	video._paused = true
	currentTimeValue = 0

	// Initially paused, button should have "Play" aria-label
	expect(playPauseButton).toHaveAttribute('aria-label', 'Play')

	// Click to play - this should call video.play()
	await user.click(playPauseButton)

	// Simulate video playing by updating paused property and triggering event
	video._paused = false
	video.dispatchEvent(new Event('play'))

	await waitFor(() => {
		expect(playPauseButton).toHaveAttribute('aria-label', 'Pause')
	})
})

test('Video error handling displays user-friendly error messages', async () => {
	// Suppress console.error for this test
	const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

	const { container } = renderWithRouter(
		<VideoPlayer src="/test-video.mp4" trackingObjects={[]} />,
	)

	await waitFor(() => {
		const video = container.querySelector('video')
		expect(video).toBeInTheDocument()
	})

	const video = container.querySelector('video') as HTMLVideoElement

	// Mock MediaError
	class MockMediaError {
		code = (window as any).MediaError?.MEDIA_ERR_NETWORK ?? 2
		message = 'Network error'
	}

	// Create error object
	const error = new MockMediaError() as MediaError
	Object.defineProperty(video, 'error', {
		configurable: true,
		get: () => error,
	})

	// Trigger error event
	video.dispatchEvent(new Event('error'))

	// Wait for error message to appear
	await waitFor(() => {
		expect(
			screen.getByText(/Network error occurred while loading the video/i),
		).toBeInTheDocument()
	})

	// Check that error message contains helpful text
	expect(
		screen.getByText(/Network error occurred while loading the video/i),
	).toBeInTheDocument()
	expect(screen.getByText(/check your connection/i)).toBeInTheDocument()

	// Check that "Try Again" button exists
	const tryAgainButton = screen.getByRole('button', { name: /try again/i })
	expect(tryAgainButton).toBeInTheDocument()

	consoleError.mockRestore()
})

test('Video error handling displays different messages for different error codes', async () => {
	// Suppress console.error for this test
	const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

	const { container } = renderWithRouter(
		<VideoPlayer src="/test-video.mp4" trackingObjects={[]} />,
	)

	await waitFor(() => {
		const video = container.querySelector('video')
		expect(video).toBeInTheDocument()
	})

	const video = container.querySelector('video') as HTMLVideoElement

	// Test MEDIA_ERR_DECODE
	class MockDecodeError {
		code = (window as any).MediaError?.MEDIA_ERR_DECODE ?? 3
		message = 'Decode error'
	}

	const decodeError = new MockDecodeError() as MediaError
	Object.defineProperty(video, 'error', {
		configurable: true,
		get: () => decodeError,
	})

	video.dispatchEvent(new Event('error'))

	await waitFor(() => {
		expect(
			screen.getByText(/Video file could not be decoded/i),
		).toBeInTheDocument()
	})
	expect(
		screen.getByText(/file may be corrupted or in an unsupported format/i),
	).toBeInTheDocument()

	consoleError.mockRestore()
})

test('Reload button appears when at the end of video', async () => {
	const user = userEvent.setup()
	const { container } = renderWithRouter(
		<VideoPlayer src="/test-video.mp4" trackingObjects={[]} />,
	)

	await waitFor(() => {
		const video = container.querySelector('video')
		expect(video).toBeInTheDocument()
	})

	const video = container.querySelector('video') as HTMLVideoElement
	const playPauseButton = screen.getByLabelText(/play|pause|restart/i)

	let currentTimeValue = 0
	Object.defineProperty(video, 'paused', {
		configurable: true,
		get: () => true,
	})

	Object.defineProperty(video, 'currentTime', {
		configurable: true,
		get: () => currentTimeValue,
		set: (value) => {
			currentTimeValue = value
		},
	})

	Object.defineProperty(video, 'duration', {
		configurable: true,
		writable: true,
		value: 100,
	})

	video.play = vi.fn().mockResolvedValue(undefined)
	video.pause = vi.fn()

	// Simulate being at the end of the video
	currentTimeValue = 100
	// Trigger a re-render by updating the component state
	video.dispatchEvent(new Event('timeupdate'))

	await waitFor(() => {
		expect(playPauseButton).toHaveAttribute('aria-label', 'Restart')
	})

	// Click reload should restart from beginning
	await user.click(playPauseButton)

	await waitFor(() => {
		expect(video.currentTime).toBe(0)
	})
})

test('3-second seek buttons work', async () => {
	const user = userEvent.setup()
	const { container } = renderWithRouter(
		<VideoPlayer src="/test-video.mp4" trackingObjects={[]} />,
	)

	await waitFor(() => {
		const video = container.querySelector('video')
		expect(video).toBeInTheDocument()
	})

	const video = container.querySelector('video') as HTMLVideoElement
	let currentTimeValue = 50
	Object.defineProperty(video, 'paused', {
		configurable: true,
		get: () => true,
	})

	Object.defineProperty(video, 'currentTime', {
		configurable: true,
		get: () => currentTimeValue,
		set: (value) => {
			currentTimeValue = value
		},
	})

	Object.defineProperty(video, 'duration', {
		configurable: true,
		writable: true,
		value: 100,
	})

	video.pause = vi.fn()

	const seekBackwardButton = screen.getByLabelText('Seek backward 3 seconds')
	const seekForwardButton = screen.getByLabelText('Seek forward 3 seconds')

	// Test backward seek
	await user.click(seekBackwardButton)
	expect(currentTimeValue).toBe(47) // 50 - 3

	// Test forward seek
	await user.click(seekForwardButton)
	expect(currentTimeValue).toBe(50) // 47 + 3
})

test('Time display includes milliseconds', async () => {
	const { container } = renderWithRouter(
		<VideoPlayer src="/test-video.mp4" trackingObjects={[]} />,
	)

	await waitFor(() => {
		const video = container.querySelector('video')
		expect(video).toBeInTheDocument()
	})

	const video = container.querySelector('video') as HTMLVideoElement

	// Set up video properties
	Object.defineProperty(video, 'duration', {
		configurable: true,
		writable: true,
		value: 10,
	})
	Object.defineProperty(video, 'currentTime', {
		configurable: true,
		writable: true,
		value: 1.234,
	})
	Object.defineProperty(video, 'readyState', {
		configurable: true,
		writable: true,
		value: 4, // HAVE_ENOUGH_DATA
	})

	// Trigger events to update display
	video.dispatchEvent(new Event('loadedmetadata'))
	video.dispatchEvent(new Event('canplay'))
	
	// Wait a bit for state to update
	await new Promise(resolve => setTimeout(resolve, 100))
	
	video.dispatchEvent(new Event('timeupdate'))

	// Time display should show format with milliseconds (MM:SS.mmm)
	// The time is displayed in spans with class "font-mono text-xs text-slate-300"
	await waitFor(() => {
		// Look for time display - it should show format like "0:01.234"
		const timeDisplay = container.textContent
		expect(timeDisplay).toBeTruthy()
		// Format is MM:SS.mmm (e.g., "0:01.234" or "1:23.456")
		expect(timeDisplay).toMatch(/\d+:\d{2}\.\d{3}/)
	}, { timeout: 3000 })
})

test('Trajectory path is drawn from tracking points', async () => {
	// Mock console.error to suppress canvas.getContext() errors in jsdom
	const originalError = console.error
	console.error = vi.fn()

	const trackingPoints = [
		{
			id: '1',
			frame: 0,
			x: 100,
			y: 100,
			trackingObjectId: 'obj1',
		},
		{
			id: '2',
			frame: 1,
			x: 150,
			y: 120,
			trackingObjectId: 'obj1',
		},
		{
			id: '3',
			frame: 2,
			x: 200,
			y: 140,
			trackingObjectId: 'obj1',
		},
	]

	// Canvas is only rendered when videoId is provided
	const { container } = renderWithRouter(
		<VideoPlayer
			src="/test-video.mp4"
			videoId="test-video-id"
			trackingPoints={trackingPoints}
		/>,
	)

	await waitFor(() => {
		const video = container.querySelector('video')
		expect(video).toBeInTheDocument()
	})

	// Verify canvas is rendered when videoId and tracking points are provided
	const canvas = container.querySelector('canvas')
	expect(canvas).toBeInTheDocument()

	// Verify trajectory toggle button appears when tracking points exist
	const toggleButton = screen.getByLabelText(
		/show trajectory paths|hide trajectory paths/i,
	)
	expect(toggleButton).toBeInTheDocument()
	expect(toggleButton).toHaveTextContent('Hide Path')

	// Restore console.error
	console.error = originalError
})

test('Path toggle shows/hides trajectory', async () => {
	const user = userEvent.setup()
	const trackingPoints = [
		{
			id: '1',
			frame: 0,
			x: 100,
			y: 100,
			trackingObjectId: 'obj1',
		},
		{
			id: '2',
			frame: 1,
			x: 150,
			y: 120,
			trackingObjectId: 'obj1',
		},
	]

	const { container } = renderWithRouter(
		<VideoPlayer
			src="/test-video.mp4"
			trackingPoints={trackingPoints}
			trackingObjects={[]}
		/>,
	)

	await waitFor(() => {
		const video = container.querySelector('video')
		expect(video).toBeInTheDocument()
	})

	const video = container.querySelector('video') as HTMLVideoElement

	// Set up video properties
	Object.defineProperty(video, 'videoWidth', {
		configurable: true,
		writable: true,
		value: 640,
	})
	Object.defineProperty(video, 'videoHeight', {
		configurable: true,
		writable: true,
		value: 480,
	})
	Object.defineProperty(video, 'duration', {
		configurable: true,
		writable: true,
		value: 10,
	})

	// Wait for toggle button to appear
	await waitFor(() => {
		const toggleButton = screen.getByLabelText(
			/show trajectory paths|hide trajectory paths/i,
		)
		expect(toggleButton).toBeInTheDocument()
	})

	// Initially, path should be shown (default state)
	const toggleButton = screen.getByLabelText(
		/show trajectory paths|hide trajectory paths/i,
	)
	expect(toggleButton).toHaveTextContent('Hide Path')

	// Click to hide path
	await user.click(toggleButton)

	await waitFor(() => {
		expect(toggleButton).toHaveTextContent('Show Path')
		expect(toggleButton).toHaveAttribute('aria-label', 'Show trajectory paths')
	})

	// Click to show path again
	await user.click(toggleButton)

	await waitFor(() => {
		expect(toggleButton).toHaveTextContent('Hide Path')
		expect(toggleButton).toHaveAttribute('aria-label', 'Hide trajectory paths')
	})
})

test('Frame navigation functions work correctly', async () => {
	const user = userEvent.setup()
	const { container } = renderWithRouter(
		<VideoPlayer src="/test-video.mp4" trackingObjects={[]} />,
	)

	await waitFor(() => {
		const video = container.querySelector('video')
		expect(video).toBeInTheDocument()
	})

	const video = container.querySelector('video') as HTMLVideoElement
	let currentTimeValue = 50 // Start at 50 seconds
	const fps = 30
	const videoDuration = 100
	const totalFrames = Math.ceil(videoDuration * fps) // 100 second video = 3000 frames
	const lastFrameTime = (totalFrames - 1) / fps

	Object.defineProperty(video, 'paused', {
		configurable: true,
		get: () => true,
	})

	Object.defineProperty(video, 'currentTime', {
		configurable: true,
		get: () => currentTimeValue,
		set: (value) => {
			currentTimeValue = value
		},
	})

	Object.defineProperty(video, 'duration', {
		configurable: true,
		writable: true,
		value: videoDuration,
	})

	video.pause = vi.fn()

	// Trigger loadedmetadata event to set duration state in component
	video.dispatchEvent(new Event('loadedmetadata'))

	// Wait for duration state to be set
	await waitFor(() => {
		// Component should now have duration state set
	})

	// Test previous frame button
	currentTimeValue = 50
	const previousFrameButton = screen.getByLabelText('Previous frame')
	await user.click(previousFrameButton)
	expect(currentTimeValue).toBeCloseTo(50 - 1 / fps, 2)

	// Test next frame button
	currentTimeValue = 50
	const nextFrameButton = screen.getByLabelText('Next frame')
	await user.click(nextFrameButton)
	expect(currentTimeValue).toBeCloseTo(50 + 1 / fps, 2)
})

test('Frame number input validates and jumps to frame', async () => {
	const user = userEvent.setup()
	const { container } = renderWithRouter(
		<VideoPlayer src="/test-video.mp4" trackingObjects={[]} />,
	)

	await waitFor(() => {
		const video = container.querySelector('video')
		expect(video).toBeInTheDocument()
	})

	const video = container.querySelector('video') as HTMLVideoElement
	let currentTimeValue = 50
	const fps = 30
	const videoDuration = 100
	const totalFrames = Math.ceil(videoDuration * fps) - 1 // Component uses Math.ceil(duration * 30) - 1

	Object.defineProperty(video, 'paused', {
		configurable: true,
		get: () => true,
	})

	Object.defineProperty(video, 'currentTime', {
		configurable: true,
		get: () => currentTimeValue,
		set: (value) => {
			currentTimeValue = value
		},
	})

	Object.defineProperty(video, 'duration', {
		configurable: true,
		writable: true,
		value: videoDuration,
	})

	Object.defineProperty(video, 'readyState', {
		configurable: true,
		writable: true,
		value: 4, // HAVE_ENOUGH_DATA
	})

	video.pause = vi.fn()

	// Trigger loadedmetadata event to set duration state in component
	video.dispatchEvent(new Event('loadedmetadata'))
	// Also trigger canplay event as a fallback
	video.dispatchEvent(new Event('canplay'))

	// Wait for duration state to be set and frame input to update
	await waitFor(
		() => {
			const frameInput = screen.getByLabelText(
				'Frame number',
			) as HTMLInputElement
			expect(frameInput).toHaveAttribute('max', totalFrames.toString())
		},
		{ timeout: 3000 },
	)

	// Find frame input
	const frameInput = screen.getByLabelText('Frame number') as HTMLInputElement
	expect(frameInput).toBeInTheDocument()
	expect(frameInput).toHaveAttribute('type', 'number')
	expect(frameInput).toHaveAttribute('min', '0')
	expect(frameInput).toHaveAttribute('max', totalFrames.toString())

	// Test jumping to a specific frame (frame 100)
	// Component uses frame directly: frameTime = frame / fps (0-indexed)
	const targetFrame = 100
	const targetTime = targetFrame / fps // Component uses frame directly, not frame - 1

	// Clear and type the frame number
	await user.clear(frameInput)
	// Wait a bit for the clear to complete
	await waitFor(() => {
		expect(frameInput.value).toBe('')
	})

	// Type the frame number
	await user.type(frameInput, targetFrame.toString())

	// Wait for the input value to be set
	await waitFor(() => {
		expect(frameInput.value).toBe(targetFrame.toString())
	})

	// Submit the form by pressing Enter
	await user.keyboard('{Enter}')

	// Wait for the video to seek to the target time
	// Frame 100 at 30fps = 100/30 = 3.333...
	await waitFor(
		() => {
			expect(currentTimeValue).toBeCloseTo(targetTime, 1) // Use 1 decimal place tolerance
		},
		{ timeout: 3000 },
	)

	// Test that input is clamped to valid range (too high)
	currentTimeValue = 50
	await user.clear(frameInput)
	await waitFor(() => {
		expect(frameInput.value).toBe('')
	})
	await user.type(frameInput, (totalFrames + 100).toString())
	await waitFor(() => {
		expect(frameInput.value).toBe((totalFrames + 100).toString())
	})
	await user.keyboard('{Enter}')

	await waitFor(
		() => {
			// Should clamp to last frame
			// Component uses: frameIndex = Math.min(totalFrames - 1, frameNumber)
			// frameTime = frameIndex / fps
			const lastFrameTime = (totalFrames - 1) / fps
			expect(currentTimeValue).toBeCloseTo(lastFrameTime, 1) // Use 1 decimal place tolerance for floating point precision
		},
		{ timeout: 3000 },
	)

	// Test that input is clamped to valid range (too low)
	currentTimeValue = 50
	await user.clear(frameInput)
	await waitFor(() => {
		expect(frameInput.value).toBe('')
	})
	await user.type(frameInput, '0')
	await waitFor(() => {
		expect(frameInput.value).toBe('0')
	})
	await user.keyboard('{Enter}')

	await waitFor(
		() => {
			// Should clamp to first frame (frame 1 = time 0)
			expect(currentTimeValue).toBeCloseTo(0, 2)
		},
		{ timeout: 3000 },
	)
})
