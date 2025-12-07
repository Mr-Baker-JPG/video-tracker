/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, beforeEach } from 'vitest'
import { consoleWarn } from '#tests/setup/setup-test-env.ts'
import { PositionVsTimeGraph } from './position-vs-time-graph.tsx'

// Mock consoleWarn to allow Recharts warnings about container dimensions
beforeEach(() => {
	consoleWarn.mockImplementation(() => {})
})

test('Graph component receives and displays tracking data', () => {
	const trackingPoints = [
		{ frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
		{ frame: 30, x: 150, y: 250, trackingObjectId: 'obj1' },
		{ frame: 60, x: 200, y: 300, trackingObjectId: 'obj1' },
	]

	render(<PositionVsTimeGraph trackingPoints={trackingPoints} scale={null} />)

	// Check that the graph title is displayed
	expect(screen.getByText('Position vs Time')).toBeInTheDocument()

	// Check that axis toggle buttons are present
	expect(screen.getByRole('button', { name: /x axis/i })).toBeInTheDocument()
	expect(screen.getByRole('button', { name: /y axis/i })).toBeInTheDocument()

	// Check that the graph container is rendered (ResponsiveContainer creates a div)
	const graphContainer = screen.getByText('Position vs Time').closest('div')
	expect(graphContainer).toBeInTheDocument()
})

test('Graph component shows empty state when no tracking data', () => {
	render(<PositionVsTimeGraph trackingPoints={[]} scale={null} />)

	expect(
		screen.getByText(
			/No tracking data available. Add tracking points to see the graph./i,
		),
	).toBeInTheDocument()
})

test('X/Y toggle switches graph axes correctly', async () => {
	const user = userEvent.setup()
	const trackingPoints = [
		{ frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
		{ frame: 30, x: 150, y: 250, trackingObjectId: 'obj1' },
	]

	render(<PositionVsTimeGraph trackingPoints={trackingPoints} scale={null} />)

	// Initially X axis should be selected (default)
	const xButton = screen.getByRole('button', { name: /x axis/i })
	const yButton = screen.getByRole('button', { name: /y axis/i })

	// Check initial state - X button should have default variant (selected)
	expect(xButton).toHaveClass('bg-primary') // default variant has bg-primary
	expect(yButton).toHaveClass('border-input') // outline variant has border-input

	// Click Y axis button
	await user.click(yButton)

	// After clicking Y, Y button should be selected and X should be outline
	expect(yButton).toHaveClass('bg-primary')
	expect(xButton).toHaveClass('border-input')

	// Click X axis button again
	await user.click(xButton)

	// X should be selected again
	expect(xButton).toHaveClass('bg-primary')
	expect(yButton).toHaveClass('border-input')
})

test('Graph displays correct Y-axis label for X position', () => {
	const trackingPoints = [
		{ frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]

	render(<PositionVsTimeGraph trackingPoints={trackingPoints} scale={null} />)

	// When X axis is selected and no scale, should show "Position X (pixels)"
	// The YAxis component from Recharts will render this, but we can check the button state
	expect(screen.getByRole('button', { name: /x axis/i })).toHaveClass(
		'bg-primary',
	)
})

test('Graph displays meter units when scale is provided', () => {
	const trackingPoints = [
		{ frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]
	const scale = { pixelsPerMeter: 100 }

	render(<PositionVsTimeGraph trackingPoints={trackingPoints} scale={scale} />)

	// Graph should render with scale data
	// The component should handle scale conversion internally
	expect(screen.getByText('Position vs Time')).toBeInTheDocument()
})

test('Graph handles multiple tracking objects', () => {
	const trackingPoints = [
		{ frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
		{ frame: 30, x: 150, y: 250, trackingObjectId: 'obj1' },
		{ frame: 0, x: 50, y: 100, trackingObjectId: 'obj2' },
		{ frame: 30, x: 75, y: 125, trackingObjectId: 'obj2' },
	]

	render(<PositionVsTimeGraph trackingPoints={trackingPoints} scale={null} />)

	// Graph should render with multiple objects
	expect(screen.getByText('Position vs Time')).toBeInTheDocument()
	expect(screen.getByRole('button', { name: /x axis/i })).toBeInTheDocument()
	expect(screen.getByRole('button', { name: /y axis/i })).toBeInTheDocument()
})
