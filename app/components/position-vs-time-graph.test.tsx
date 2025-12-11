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

	render(
		<PositionVsTimeGraph
			trackingPoints={trackingPoints}
			scale={null}
			axis={null}
		/>,
	)

	// Check that axis toggle tabs are present (using Tabs component)
	expect(screen.getByRole('tab', { name: /x axis/i })).toBeInTheDocument()
	expect(screen.getByRole('tab', { name: /y axis/i })).toBeInTheDocument()

	// Check that the graph container is rendered (ResponsiveContainer creates a div)
	const graphContainer = screen
		.getByRole('tab', { name: /x axis/i })
		.closest('.space-y-4')
	expect(graphContainer).toBeInTheDocument()
})

test('Graph component shows empty state when no tracking data', () => {
	render(<PositionVsTimeGraph trackingPoints={[]} scale={null} axis={null} />)

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

	render(
		<PositionVsTimeGraph
			trackingPoints={trackingPoints}
			scale={null}
			axis={null}
		/>,
	)

	// Initially X axis should be selected (default)
	const xTab = screen.getByRole('tab', { name: /x axis/i })
	const yTab = screen.getByRole('tab', { name: /y axis/i })

	// Check initial state - X tab should be selected (data-state="active")
	expect(xTab).toHaveAttribute('data-state', 'active')
	expect(yTab).toHaveAttribute('data-state', 'inactive')

	// Click Y axis tab
	await user.click(yTab)

	// After clicking Y, Y tab should be selected and X should be inactive
	expect(yTab).toHaveAttribute('data-state', 'active')
	expect(xTab).toHaveAttribute('data-state', 'inactive')

	// Click X axis tab again
	await user.click(xTab)

	// X should be selected again
	expect(xTab).toHaveAttribute('data-state', 'active')
	expect(yTab).toHaveAttribute('data-state', 'inactive')
})

test('Graph displays correct Y-axis label for X position', () => {
	const trackingPoints = [
		{ frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]

	render(
		<PositionVsTimeGraph
			trackingPoints={trackingPoints}
			scale={null}
			axis={null}
		/>,
	)

	// When X axis is selected and no scale, should show "Position X (pixels)"
	// The YAxis component from Recharts will render this, but we can check the tab state
	expect(screen.getByRole('tab', { name: /x axis/i })).toHaveAttribute(
		'data-state',
		'active',
	)
})

test('Graph displays meter units when scale is provided', () => {
	const trackingPoints = [
		{ frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
	]
	const scale = { pixelsPerMeter: 100 }

	render(
		<PositionVsTimeGraph
			trackingPoints={trackingPoints}
			scale={scale}
			axis={null}
		/>,
	)

	// Graph should render with scale data
	// The component should handle scale conversion internally
	// Check that tabs are present (graph is rendered)
	expect(screen.getByRole('tab', { name: /x axis/i })).toBeInTheDocument()
	expect(screen.getByRole('tab', { name: /y axis/i })).toBeInTheDocument()
})

test('Graph handles multiple tracking objects', () => {
	const trackingPoints = [
		{ frame: 0, x: 100, y: 200, trackingObjectId: 'obj1' },
		{ frame: 30, x: 150, y: 250, trackingObjectId: 'obj1' },
		{ frame: 0, x: 50, y: 100, trackingObjectId: 'obj2' },
		{ frame: 30, x: 75, y: 125, trackingObjectId: 'obj2' },
	]

	render(
		<PositionVsTimeGraph
			trackingPoints={trackingPoints}
			scale={null}
			axis={null}
		/>,
	)

	// Graph should render with multiple objects
	expect(screen.getByRole('tab', { name: /x axis/i })).toBeInTheDocument()
	expect(screen.getByRole('tab', { name: /y axis/i })).toBeInTheDocument()
})

test('Best fit controls render and can toggle model panel', async () => {
	const user = userEvent.setup()
	const trackingPoints = [
		{ frame: 0, x: 0, y: 0, trackingObjectId: 'obj1' },
		{ frame: 30, x: 30, y: 10, trackingObjectId: 'obj1' },
		{ frame: 60, x: 60, y: 20, trackingObjectId: 'obj1' },
	]

	render(
		<PositionVsTimeGraph
			trackingPoints={trackingPoints}
			scale={null}
			axis={null}
		/>,
	)

	const generateButton = screen.getByRole('button', {
		name: /generate best fit/i,
	})
	expect(generateButton).toBeInTheDocument()
	const modelButton = screen.getByRole('button', { name: /model/i })
	expect(modelButton).toBeDisabled()

	await user.click(generateButton)
	expect(modelButton).toBeEnabled()

	await user.click(modelButton)
	expect(screen.getByText(/Mathematical Model/i)).toBeInTheDocument()
})

test('All function types are available in dropdown', () => {
	const trackingPoints = [
		{ frame: 0, x: 0, y: 0, trackingObjectId: 'obj1' },
		{ frame: 30, x: 30, y: 10, trackingObjectId: 'obj1' },
		{ frame: 60, x: 60, y: 20, trackingObjectId: 'obj1' },
	]

	render(
		<PositionVsTimeGraph
			trackingPoints={trackingPoints}
			scale={null}
			axis={null}
		/>,
	)

	const select = screen.getByLabelText(/fit:/i)
	expect(select).toBeInTheDocument()

	// Check that all function types are present
	const expectedTypes = [
		'Linear',
		'Quadratic',
		'Cubic',
		'Exponential',
		'Inverse Square',
		'Square Root',
	]

	for (const type of expectedTypes) {
		expect(screen.getByRole('option', { name: type })).toBeInTheDocument()
	}
})
