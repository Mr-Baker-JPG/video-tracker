import {
	calculateStatistics,
	type Scale,
	type TrackingPoint,
} from '#app/utils/statistics.ts'

export type VideoAnalysisDashboardProps = {
	trackingPoints: TrackingPoint[]
	scale: Scale
}

export function VideoAnalysisDashboard({
	trackingPoints,
	scale,
}: VideoAnalysisDashboardProps) {
	const stats = calculateStatistics(trackingPoints, scale)

	// Determine units based on whether scale is available
	const distanceUnit = scale ? 'm' : 'px'
	const velocityUnit = scale ? 'm/s' : 'px/s'
	const accelerationUnit = scale ? 'm/s²' : 'px/s²'

	// Format numbers with appropriate precision
	const formatNumber = (value: number, decimals = 2): string => {
		return value.toFixed(decimals)
	}

	if (trackingPoints.length === 0) {
		return (
			<div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
				<p className="text-slate-500">
					No tracking data available. Place tracking points on the video to see
					statistics.
				</p>
			</div>
		)
	}

	return (
		<div className="grid grid-cols-2 gap-4">
			{/* Row 1: Distance & Velocity */}
			<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
				<div className="mb-1 text-xs font-medium text-slate-500">
					Total Distance
				</div>
				<div className="flex items-baseline gap-1">
					<span className="text-2xl font-bold text-slate-900">
						{formatNumber(stats.totalDistance)}
					</span>
					<span className="text-base font-medium text-slate-600">
						{distanceUnit}
					</span>
				</div>
			</div>
			<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
				<div className="mb-1 text-xs font-medium text-slate-500">
					Avg Velocity
				</div>
				<div className="flex items-baseline gap-1">
					<span className="text-2xl font-bold text-slate-900">
						{formatNumber(stats.averageVelocity)}
					</span>
					<span className="text-base font-medium text-slate-600">
						{velocityUnit}
					</span>
				</div>
			</div>
			{/* Row 2: Max Velocity & Acceleration */}
			<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
				<div className="mb-1 text-xs font-medium text-slate-500">
					Max Velocity
				</div>
				<div className="flex items-baseline gap-1">
					<span className="text-2xl font-bold text-slate-900">
						{formatNumber(stats.maxVelocity)}
					</span>
					<span className="text-base font-medium text-slate-600">
						{velocityUnit}
					</span>
				</div>
			</div>
			<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
				<div className="mb-1 text-xs font-medium text-slate-500">
					Acceleration
				</div>
				<div className="flex items-baseline gap-1">
					<span className="text-2xl font-bold text-slate-900">
						{formatNumber(stats.averageAcceleration)}
					</span>
					<span className="text-base font-medium text-slate-600">
						{accelerationUnit}
					</span>
				</div>
			</div>
		</div>
	)
}
