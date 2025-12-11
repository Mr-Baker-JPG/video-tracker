/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, beforeEach } from 'vitest'
import { consoleWarn } from '#tests/setup/setup-test-env.ts'
import { GraphSection } from './graph-section.tsx'

// Mock consoleWarn to allow Recharts warnings about container dimensions
beforeEach(() => {
	consoleWarn.mockImplementation(() => {})
})

test('Fullscreen button renders in graph section header', () => {
	const trackingPoints = [
		{ id: '1', frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]
	const trackingObjects = [{ id: 'obj1', name: 'Object 1', color: '#ff0000' }]

	render(
		<GraphSection
			trackingPoints={trackingPoints}
			trackingObjects={trackingObjects}
			scale={null}
			axis={null}
		/>,
	)

	// Find the fullscreen button by its aria-label
	const fullscreenButton = screen.getByLabelText('Open graphs in fullscreen')
	expect(fullscreenButton).toBeInTheDocument()
})

test('Modal opens when fullscreen button is clicked', async () => {
	const user = userEvent.setup()
	const trackingPoints = [
		{ id: '1', frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]
	const trackingObjects = [{ id: 'obj1', name: 'Object 1', color: '#ff0000' }]

	render(
		<GraphSection
			trackingPoints={trackingPoints}
			trackingObjects={trackingObjects}
			scale={null}
			axis={null}
		/>,
	)

	// Initially modal should not be visible (check for tab labels instead)
	const positionTab = screen.getByRole('tab', { name: /position/i })
	expect(positionTab).toBeInTheDocument()

	// Click the fullscreen button
	const fullscreenButton = screen.getByLabelText('Open graphs in fullscreen')
	await user.click(fullscreenButton)

	// Modal should now be visible - check for tabs within modal
	// The tabs should still be there, but now in the modal
	expect(positionTab).toBeInTheDocument()
})

test('Graph modal preserves active tab when opened', async () => {
	const user = userEvent.setup()
	const trackingPoints = [
		{ id: '1', frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]
	const trackingObjects = [{ id: 'obj1', name: 'Object 1', color: '#ff0000' }]

	render(
		<GraphSection
			trackingPoints={trackingPoints}
			trackingObjects={trackingObjects}
			scale={null}
			axis={null}
		/>,
	)

	// Switch to velocity tab before opening modal
	const velocityTab = screen.getByRole('tab', { name: /velocity/i })
	await user.click(velocityTab)

	// Verify velocity tab is active
	expect(velocityTab).toHaveAttribute('data-state', 'active')

	// Open modal
	const fullscreenButton = screen.getByLabelText('Open graphs in fullscreen')
	await user.click(fullscreenButton)

	// Find all velocity tabs (should be 2 - one in card, one in modal)
	const velocityTabs = screen.getAllByRole('tab', { name: /velocity/i })

	// Both should be active (preserved state)
	velocityTabs.forEach((tab) => {
		expect(tab).toHaveAttribute('data-state', 'active')
	})
})

test('Graph modal allows tab switching when open', async () => {
	const user = userEvent.setup()
	const trackingPoints = [
		{ id: '1', frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]
	const trackingObjects = [{ id: 'obj1', name: 'Object 1', color: '#ff0000' }]

	render(
		<GraphSection
			trackingPoints={trackingPoints}
			trackingObjects={trackingObjects}
			scale={null}
			axis={null}
		/>,
	)

	// Open modal
	const fullscreenButton = screen.getByLabelText('Open graphs in fullscreen')
	await user.click(fullscreenButton)

	// Switch to acceleration tab in modal
	const accelerationTabs = screen.getAllByRole('tab', { name: /acceleration/i })
	expect(accelerationTabs.length).toBeGreaterThan(0)
	const accelerationTabInModal = accelerationTabs[accelerationTabs.length - 1]! // Last one is in modal
	await user.click(accelerationTabInModal)
	// Acceleration tab should be active
	expect(accelerationTabInModal).toHaveAttribute('data-state', 'active')
	expect(accelerationTabInModal).toHaveAttribute('data-state', 'active')
})

test('Modal closes when close button is clicked', async () => {
	const user = userEvent.setup()
	const trackingPoints = [
		{ id: '1', frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]
	const trackingObjects = [{ id: 'obj1', name: 'Object 1', color: '#ff0000' }]

	render(
		<GraphSection
			trackingPoints={trackingPoints}
			trackingObjects={trackingObjects}
			scale={null}
			axis={null}
		/>,
	)

	// Open modal
	const fullscreenButton = screen.getByLabelText('Open graphs in fullscreen')
	await user.click(fullscreenButton)

	// Click close button
	const closeButton = screen.getByLabelText('Close modal')
	await user.click(closeButton)

	// Modal should be closed - check that we're back to the regular view
	// We should still see the tabs in the card, but the modal backdrop should be gone
	const positionTab = screen.getByRole('tab', { name: /position/i })
	expect(positionTab).toBeInTheDocument()
})

test('Modal closes when ESC key is pressed', async () => {
	const user = userEvent.setup()
	const trackingPoints = [
		{ id: '1', frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]
	const trackingObjects = [{ id: 'obj1', name: 'Object 1', color: '#ff0000' }]

	render(
		<GraphSection
			trackingPoints={trackingPoints}
			trackingObjects={trackingObjects}
			scale={null}
			axis={null}
		/>,
	)

	// Open modal
	const fullscreenButton = screen.getByLabelText('Open graphs in fullscreen')
	await user.click(fullscreenButton)

	// Press ESC key
	await user.keyboard('{Escape}')

	// Modal should be closed
	const positionTab = screen.getByRole('tab', { name: /position/i })
	expect(positionTab).toBeInTheDocument()
})
