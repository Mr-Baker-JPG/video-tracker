import { calculateStatistics, type Scale, type TrackingPoint } from '#app/utils/statistics.ts'

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

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold text-slate-900">
					Analysis Dashboard
				</h2>
				<p className="mt-1 text-sm text-slate-500">
					Summary statistics from tracking data
				</p>
			</div>

			{trackingPoints.length === 0 ? (
				<div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
					<p className="text-slate-500">
						No tracking data available. Place tracking points on the video to
						see statistics.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{/* Total Distance Card */}
					<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-slate-600">
									Total Distance
								</p>
								<p className="mt-2 text-2xl font-semibold text-slate-900">
									{formatNumber(stats.totalDistance)}
									<span className="ml-1 text-base font-normal text-slate-500">
										{distanceUnit}
									</span>
								</p>
							</div>
							<div className="rounded-full bg-blue-100 p-3">
								<svg
									className="h-6 w-6 text-blue-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
									/>
								</svg>
							</div>
						</div>
					</div>

					{/* Average Velocity Card */}
					<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-slate-600">
									Average Velocity
								</p>
								<p className="mt-2 text-2xl font-semibold text-slate-900">
									{formatNumber(stats.averageVelocity)}
									<span className="ml-1 text-base font-normal text-slate-500">
										{velocityUnit}
									</span>
								</p>
							</div>
							<div className="rounded-full bg-green-100 p-3">
								<svg
									className="h-6 w-6 text-green-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
							</div>
						</div>
					</div>

					{/* Max Velocity Card */}
					<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-slate-600">
									Max Velocity
								</p>
								<p className="mt-2 text-2xl font-semibold text-slate-900">
									{formatNumber(stats.maxVelocity)}
									<span className="ml-1 text-base font-normal text-slate-500">
										{velocityUnit}
									</span>
								</p>
							</div>
							<div className="rounded-full bg-amber-100 p-3">
								<svg
									className="h-6 w-6 text-amber-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
									/>
								</svg>
							</div>
						</div>
					</div>

					{/* Average Acceleration Card */}
					<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-slate-600">
									Average Acceleration
								</p>
								<p className="mt-2 text-2xl font-semibold text-slate-900">
									{formatNumber(stats.averageAcceleration)}
									<span className="ml-1 text-base font-normal text-slate-500">
										{accelerationUnit}
									</span>
								</p>
							</div>
							<div className="rounded-full bg-purple-100 p-3">
								<svg
									className="h-6 w-6 text-purple-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
