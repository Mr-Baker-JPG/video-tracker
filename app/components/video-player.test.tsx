/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { test, expect, vi } from 'vitest'
import { VideoPlayer } from './video-player.tsx'

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
	const { container } = renderWithRouter(<VideoPlayer src="/test-video.mp4" />)

	// Check video element exists
	const video = container.querySelector('video')
	expect(video).toBeInTheDocument()
	expect(video?.getAttribute('src')).toBe('/test-video.mp4')

	// Check controls exist
	expect(screen.getByLabelText(/play|pause|restart/i)).toBeInTheDocument()
	expect(screen.getByLabelText('Seek backward 3 seconds')).toBeInTheDocument()
	expect(screen.getByLabelText('Seek forward 3 seconds')).toBeInTheDocument()
	expect(screen.getByLabelText('Previous frame')).toBeInTheDocument()
	expect(screen.getByLabelText('Next frame')).toBeInTheDocument()

	// Check seek bar exists
	const seekBar = screen.getByLabelText('Video seek')
	expect(seekBar).toBeInTheDocument()
	expect(seekBar).toHaveAttribute('type', 'range')
	expect(seekBar).toHaveAttribute('step', '0.001')
})

test('Play/pause functionality works', async () => {
	const user = userEvent.setup()
	const { container } = renderWithRouter(<VideoPlayer src="/test-video.mp4" />)

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

	// Click to pause - this should call video.pause()
	await user.click(playPauseButton)

	// Simulate video paused
	video._paused = true
	video.dispatchEvent(new Event('pause'))

	await waitFor(() => {
		expect(playPauseButton).toHaveAttribute('aria-label', 'Play')
	})
})

test('Reload button appears when at the end of video', async () => {
	const user = userEvent.setup()
	const { container } = renderWithRouter(<VideoPlayer src="/test-video.mp4" />)

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
	const { container } = renderWithRouter(<VideoPlayer src="/test-video.mp4" />)

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

test('Time display includes milliseconds', () => {
	const { container } = renderWithRouter(<VideoPlayer src="/test-video.mp4" />)

	// Time display should show format with milliseconds (MM:SS.mmm)
	// The time is displayed in spans with class "font-mono text-[10px] text-slate-600"
	// There are two spans: one for current time and one for duration
	const timeSpans = container.querySelectorAll(
		'span.font-mono.text-\\[10px\\].text-slate-600',
	)
	expect(timeSpans.length).toBeGreaterThan(0)

	// Check that at least one time span contains the millisecond format
	const timeText = Array.from(timeSpans)
		.map((span) => span.textContent)
		.join(' ')
	expect(timeText).toMatch(/\d+:\d+\.\d{3}/)
})
