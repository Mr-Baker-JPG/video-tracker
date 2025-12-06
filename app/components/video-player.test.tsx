/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, vi } from 'vitest'
import { VideoPlayer } from './video-player.tsx'

test('Video player component renders with controls', () => {
	const { container } = render(<VideoPlayer src="/test-video.mp4" />)

	// Check video element exists
	const video = container.querySelector('video')
	expect(video).toBeInTheDocument()
	expect(video?.getAttribute('src')).toBe('/test-video.mp4')

	// Check controls exist
	expect(screen.getByLabelText(/play|pause/i)).toBeInTheDocument()
	expect(screen.getByLabelText('Previous frame')).toBeInTheDocument()
	expect(screen.getByLabelText('Next frame')).toBeInTheDocument()

	// Check seek bar exists
	const seekBar = screen.getByLabelText('Video seek')
	expect(seekBar).toBeInTheDocument()
	expect(seekBar).toHaveAttribute('type', 'range')
})

test('Play/pause functionality works', async () => {
	const user = userEvent.setup()
	const { container } = render(<VideoPlayer src="/test-video.mp4" />)

	// Wait for video element to be rendered
	await waitFor(() => {
		const video = container.querySelector('video')
		expect(video).toBeInTheDocument()
	})

	const video = container.querySelector('video') as HTMLVideoElement
	const playPauseButton = screen.getByLabelText(/play|pause/i)

	// Set up video properties
	Object.defineProperty(video, 'paused', {
		configurable: true,
		get: () => video._paused ?? true,
		set: (value) => {
			video._paused = value
		},
	})
	
	Object.defineProperty(video, 'currentTime', {
		configurable: true,
		writable: true,
		value: 0,
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

	// Initially paused, button should say "Play"
	expect(playPauseButton).toHaveTextContent('Play')

	// Click to play - this should call video.play()
	await user.click(playPauseButton)
	
	// Simulate video playing by updating paused property and triggering event
	video._paused = false
	video.dispatchEvent(new Event('play'))

	await waitFor(() => {
		expect(playPauseButton).toHaveTextContent('Pause')
	})

	// Click to pause - this should call video.pause()
	await user.click(playPauseButton)
	
	// Simulate video paused
	video._paused = true
	video.dispatchEvent(new Event('pause'))

	await waitFor(() => {
		expect(playPauseButton).toHaveTextContent('Play')
	})
})
