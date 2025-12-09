/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VideoAnalysisDashboard } from './video-analysis-dashboard.tsx'

describe('VideoAnalysisDashboard', () => {
	it('displays empty state when no tracking points', () => {
		render(
			<VideoAnalysisDashboard trackingPoints={[]} scale={null} />,
		)

		expect(
			screen.getByText(/No tracking data available/i),
		).toBeInTheDocument()
	})

	it('displays all metric cards when tracking points exist', () => {
		const trackingPoints = [
			{
				frame: 0,
				x: 0,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 30,
				x: 100,
				y: 0,
				trackingObjectId: 'obj1',
			},
		]

		render(
			<VideoAnalysisDashboard trackingPoints={trackingPoints} scale={null} />,
		)

		expect(screen.getByText('Total Distance')).toBeInTheDocument()
		expect(screen.getByText('Average Velocity')).toBeInTheDocument()
		expect(screen.getByText('Max Velocity')).toBeInTheDocument()
		expect(screen.getByText('Average Acceleration')).toBeInTheDocument()
	})

	it('displays statistics with pixel units when scale is not set', () => {
		const trackingPoints = [
			{
				frame: 0,
				x: 0,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 30,
				x: 100,
				y: 0,
				trackingObjectId: 'obj1',
			},
		]

		render(
			<VideoAnalysisDashboard trackingPoints={trackingPoints} scale={null} />,
		)

		// Check that units are displayed (px, px/s, px/s²)
		const distanceCard = screen.getByText('Total Distance').closest('div')
		expect(distanceCard).toHaveTextContent('px')

		const velocityCard = screen.getByText('Average Velocity').closest('div')
		expect(velocityCard).toHaveTextContent('px/s')
	})

	it('displays statistics with meter units when scale is set', () => {
		const trackingPoints = [
			{
				frame: 0,
				x: 0,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 30,
				x: 100,
				y: 0,
				trackingObjectId: 'obj1',
			},
		]

		const scale = {
			pixelsPerMeter: 10,
		}

		render(
			<VideoAnalysisDashboard trackingPoints={trackingPoints} scale={scale} />,
		)

		// Check that units are displayed (m, m/s, m/s²)
		const distanceCard = screen.getByText('Total Distance').closest('div')
		expect(distanceCard).toHaveTextContent('m')

		const velocityCard = screen.getByText('Average Velocity').closest('div')
		expect(velocityCard).toHaveTextContent('m/s')

		const accelerationCard = screen
			.getByText('Average Acceleration')
			.closest('div')
		expect(accelerationCard).toHaveTextContent('m/s²')
	})

	it('displays dashboard title and description', () => {
		const trackingPoints = [
			{
				frame: 0,
				x: 0,
				y: 0,
				trackingObjectId: 'obj1',
			},
		]

		render(
			<VideoAnalysisDashboard trackingPoints={trackingPoints} scale={null} />,
		)

		expect(screen.getByText('Analysis Dashboard')).toBeInTheDocument()
		expect(
			screen.getByText(/Summary statistics from tracking data/i),
		).toBeInTheDocument()
	})

	it('displays numeric values for all metrics', () => {
		const trackingPoints = [
			{
				frame: 0,
				x: 0,
				y: 0,
				trackingObjectId: 'obj1',
			},
			{
				frame: 30,
				x: 100,
				y: 0,
				trackingObjectId: 'obj1',
			},
		]

		const { container } = render(
			<VideoAnalysisDashboard trackingPoints={trackingPoints} scale={null} />,
		)

		// All metrics should display numeric values (not "0.00" necessarily, but numbers)
		const cards = screen.getAllByText(/Total Distance|Average Velocity|Max Velocity|Average Acceleration/)
		expect(cards.length).toBeGreaterThan(0)

		// Check that the container has numeric values displayed (format like "100.00")
		expect(container.textContent).toMatch(/\d+\.\d{2}/)
	})
})
