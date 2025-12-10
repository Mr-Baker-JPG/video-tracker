export function WorkflowStepper({
	hasScale,
	hasTrackingPoints,
}: {
	hasScale: boolean
	hasTrackingPoints: boolean
}) {
	return (
		<div className="border-b border-slate-200 bg-white">
			<div className="mx-auto max-w-[1920px] px-6 py-4">
				<div className="flex items-center justify-center gap-8">
					{/* Step 1: Set Scale */}
					<div className="flex items-center gap-3">
						<div
							className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
								hasScale
									? 'bg-blue-600 text-white'
									: 'bg-slate-200 text-slate-500'
							}`}
						>
							1
						</div>
						<div>
							<div
								className={`text-sm font-semibold ${
									hasScale ? 'text-slate-900' : 'text-slate-500'
								}`}
							>
								Set Scale
							</div>
							<div className="text-xs text-slate-500">Calibrate distance</div>
						</div>
					</div>

					<div className="h-px w-16 bg-slate-300" />

					{/* Step 2: Track Object */}
					<div className="flex items-center gap-3">
						<div
							className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
								hasTrackingPoints
									? 'bg-blue-600 text-white'
									: 'bg-slate-200 text-slate-500'
							}`}
						>
							2
						</div>
						<div>
							<div
								className={`text-sm font-semibold ${
									hasTrackingPoints ? 'text-slate-900' : 'text-slate-500'
								}`}
							>
								Track Object
							</div>
							<div className="text-xs text-slate-500">
								Click to place points
							</div>
						</div>
					</div>

					<div className="h-px w-16 bg-slate-300" />

					{/* Step 3: Review Path */}
					<div className="flex items-center gap-3">
						<div
							className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
								hasTrackingPoints && hasScale
									? 'bg-blue-600 text-white'
									: 'bg-slate-200 text-slate-500'
							}`}
						>
							3
						</div>
						<div>
							<div
								className={`text-sm font-semibold ${
									hasTrackingPoints && hasScale
										? 'text-slate-900'
										: 'text-slate-500'
								}`}
							>
								Review Path
							</div>
							<div className="text-xs text-slate-400">Verify trajectory</div>
						</div>
					</div>

					<div className="h-px w-16 bg-slate-300" />

					{/* Step 4: Export Data */}
					<div className="flex items-center gap-3">
						<div
							className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
								hasTrackingPoints && hasScale
									? 'bg-blue-600 text-white'
									: 'bg-slate-200 text-slate-500'
							}`}
						>
							4
						</div>
						<div>
							<div
								className={`text-sm font-semibold ${
									hasTrackingPoints && hasScale
										? 'text-slate-900'
										: 'text-slate-500'
								}`}
							>
								Export Data
							</div>
							<div className="text-xs text-slate-400">Download results</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
