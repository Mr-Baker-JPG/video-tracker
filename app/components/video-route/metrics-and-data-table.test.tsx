/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, beforeEach, vi } from 'vitest'
import { MetricsAndDataTable } from './metrics-and-data-table.tsx'

beforeEach(() => {
	// Mock window.matchMedia for responsive behavior
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	})
})

test('Fullscreen button renders in data table header', () => {
	const trackingPoints = [
		{ id: '1', frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]

	render(
		<MetricsAndDataTable
			trackingPoints={trackingPoints}
			scale={null}
			axis={null}
			currentFrame={0}
			onSeekToFrame={null}
			isMetricsCollapsed={false}
			onMetricsCollapsedChange={vi.fn()}
		/>,
	)

	// Find the fullscreen button by its aria-label
	const fullscreenButton = screen.getByLabelText(
		'Open data table in fullscreen',
	)
	expect(fullscreenButton).toBeInTheDocument()
})

test('Modal opens when fullscreen button is clicked', async () => {
	const user = userEvent.setup()
	const trackingPoints = [
		{ id: '1', frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]

	render(
		<MetricsAndDataTable
			trackingPoints={trackingPoints}
			scale={null}
			axis={null}
			currentFrame={0}
			onSeekToFrame={null}
			isMetricsCollapsed={false}
			onMetricsCollapsedChange={vi.fn()}
		/>,
	)

	// Initially modal should not be visible
	expect(screen.queryByText('Data Points')).not.toBeInTheDocument()

	// Click the fullscreen button
	const fullscreenButton = screen.getByLabelText(
		'Open data table in fullscreen',
	)
	await user.click(fullscreenButton)

	// Modal should now be visible with title
	expect(screen.getByText('Data Points')).toBeInTheDocument()
})

test('Modal closes when close button is clicked', async () => {
	const user = userEvent.setup()
	const trackingPoints = [
		{ id: '1', frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]

	render(
		<MetricsAndDataTable
			trackingPoints={trackingPoints}
			scale={null}
			axis={null}
			currentFrame={0}
			onSeekToFrame={null}
			isMetricsCollapsed={false}
			onMetricsCollapsedChange={vi.fn()}
		/>,
	)

	// Open modal
	const fullscreenButton = screen.getByLabelText(
		'Open data table in fullscreen',
	)
	await user.click(fullscreenButton)

	// Modal should be visible
	expect(screen.getByText('Data Points')).toBeInTheDocument()

	// Click close button
	const closeButton = screen.getByLabelText('Close modal')
	await user.click(closeButton)

	// Modal should be closed
	await expect(screen.queryByText('Data Points')).not.toBeInTheDocument()
})

test('Modal closes when ESC key is pressed', async () => {
	const user = userEvent.setup()
	const trackingPoints = [
		{ id: '1', frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]

	render(
		<MetricsAndDataTable
			trackingPoints={trackingPoints}
			scale={null}
			axis={null}
			currentFrame={0}
			onSeekToFrame={null}
			isMetricsCollapsed={false}
			onMetricsCollapsedChange={vi.fn()}
		/>,
	)

	// Open modal
	const fullscreenButton = screen.getByLabelText(
		'Open data table in fullscreen',
	)
	await user.click(fullscreenButton)

	// Modal should be visible
	expect(screen.getByText('Data Points')).toBeInTheDocument()

	// Press ESC key
	await user.keyboard('{Escape}')

	// Modal should be closed
	await expect(screen.queryByText('Data Points')).not.toBeInTheDocument()
})

test('Modal closes when backdrop is clicked', async () => {
	const user = userEvent.setup()
	const trackingPoints = [
		{ id: '1', frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]

	render(
		<MetricsAndDataTable
			trackingPoints={trackingPoints}
			scale={null}
			axis={null}
			currentFrame={0}
			onSeekToFrame={null}
			isMetricsCollapsed={false}
			onMetricsCollapsedChange={vi.fn()}
		/>,
	)

	// Open modal
	const fullscreenButton = screen.getByLabelText(
		'Open data table in fullscreen',
	)
	await user.click(fullscreenButton)

	// Modal should be visible
	expect(screen.getByText('Data Points')).toBeInTheDocument()

	// Click on backdrop (the overlay element with bg-black/50)
	const modalContainer = screen.getByText('Data Points').closest('.fixed')
	const backdrop = modalContainer?.previousElementSibling as HTMLElement | null
	if (backdrop) {
		await user.click(backdrop)
		// Modal should be closed
		await expect(screen.queryByText('Data Points')).not.toBeInTheDocument()
	}
})
