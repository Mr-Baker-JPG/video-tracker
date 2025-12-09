/**
 * Video Tracker Mockup - Improved UX Design
 *
 * This mockup incorporates all video tracking features with improved UX:
 * - Workflow stepper for clear user guidance
 * - Card-based layout for better visual hierarchy
 * - Enhanced video controls with larger, unified styling
 * - Improved graph readability with better contrast
 * - Better typography and spacing throughout
 * - Visual backplates for tracking path overlays
 */

export default function Mockup() {
	return (
		<div className="min-h-screen bg-slate-50">
			{/* Top Navigation Bar */}

			{/* Workflow Stepper */}
			<div className="border-b border-slate-200 bg-white">
				<div className="mx-auto max-w-[1920px] px-6 py-4">
					<div className="flex items-center justify-center gap-8">
						{/* Step 1: Set Scale */}
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
								1
							</div>
							<div>
								<div className="text-sm font-semibold text-slate-900">
									Set Scale
								</div>
								<div className="text-xs text-slate-500">Calibrate distance</div>
							</div>
						</div>

						<div className="h-px w-16 bg-slate-300" />

						{/* Step 2: Track Object */}
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
								2
							</div>
							<div>
								<div className="text-sm font-semibold text-slate-900">
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
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-500">
								3
							</div>
							<div>
								<div className="text-sm font-semibold text-slate-500">
									Review Path
								</div>
								<div className="text-xs text-slate-400">Verify trajectory</div>
							</div>
						</div>

						<div className="h-px w-16 bg-slate-300" />

						{/* Step 4: Export Data */}
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-500">
								4
							</div>
							<div>
								<div className="text-sm font-semibold text-slate-500">
									Export Data
								</div>
								<div className="text-xs text-slate-400">Download results</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="mx-auto max-w-[1920px] px-6 py-6">
				<div className="grid grid-cols-12 gap-6">
					{/* Left Column: Video + Tools */}
					<div className="col-span-12 space-y-4 lg:col-span-8">
						{/* Video Player Container */}
						<div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-lg">
							{/* Video placeholder */}
							<div className="relative aspect-video bg-slate-800">
								{/* Video would go here */}
								<div className="absolute inset-0 flex items-center justify-center">
									<svg
										className="h-24 w-24 text-slate-600"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
										/>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</div>

								{/* Tracking path overlay with backplate */}
								<div className="absolute inset-0">
									{/* Semi-transparent backplate for path visibility */}
									<svg className="absolute inset-0 h-full w-full">
										<defs>
											<filter id="backplate">
												<feGaussianBlur
													in="SourceAlpha"
													stdDeviation="3"
													result="blur"
												/>
												<feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
												<feFlood floodColor="rgba(0,0,0,0.3)" />
												<feComposite
													in2="offsetBlur"
													operator="in"
													result="backplate"
												/>
											</filter>
										</defs>
										{/* Trajectory path */}
										<path
											d="M 100 200 Q 200 150 300 200 T 500 200"
											stroke="hsl(200, 70%, 50%)"
											strokeWidth="3"
											fill="none"
											filter="url(#backplate)"
										/>
										{/* Tracking points */}
										<circle cx="100" cy="200" r="6" fill="#ff0000" />
										<circle cx="300" cy="200" r="4" fill="#ff6666" />
										<circle cx="500" cy="200" r="4" fill="#ff6666" />
									</svg>
								</div>

								{/* Scale line indicator */}
								<div className="absolute top-4 left-4 rounded-lg bg-green-500/20 px-3 py-1.5 backdrop-blur-sm">
									<div className="flex items-center gap-2">
										<div className="h-2 w-2 rounded-full bg-green-500" />
										<span className="text-xs font-medium text-white">
											Scale: 1.5m
										</span>
									</div>
								</div>

								{/* Active tracking indicator */}
								<div className="absolute top-4 right-4 rounded-lg bg-blue-500/20 px-3 py-1.5 backdrop-blur-sm">
									<div className="flex items-center gap-2">
										<div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
										<span className="text-xs font-medium text-white">
											Tracking: Object 1
										</span>
									</div>
								</div>
							</div>

							{/* Enhanced Video Controls */}
							<div className="border-t border-slate-700 bg-slate-800/50 p-4 backdrop-blur-sm">
								{/* Timeline with markers */}
								<div className="mb-4">
									<div className="relative flex items-center gap-3">
										<span className="w-16 text-right font-mono text-xs text-slate-300">
											0:12.345
										</span>
										<div className="relative flex-1">
											{/* Timeline background */}
											<div className="h-2 rounded-full bg-slate-700" />
											{/* Progress bar */}
											<div
												className="absolute top-0 h-2 rounded-full bg-green-500"
												style={{ width: '45%' }}
											/>
											{/* Frame markers */}
											<div
												className="absolute top-0 h-2 w-0.5 bg-blue-400"
												style={{ left: '15%' }}
											/>
											<div
												className="absolute top-0 h-2 w-0.5 bg-blue-400"
												style={{ left: '30%' }}
											/>
											<div
												className="absolute top-0 h-2 w-0.5 bg-blue-400"
												style={{ left: '45%' }}
											/>
											{/* Scrubber handle */}
											<div
												className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-green-500 shadow-lg"
												style={{
													left: '45%',
													transform: 'translate(-50%, -50%)',
												}}
											/>
										</div>
										<span className="w-16 font-mono text-xs text-slate-300">
											0:27.890
										</span>
									</div>
								</div>

								{/* Control buttons - Larger, unified styling */}
								<div className="flex items-center justify-between">
									{/* Left: Tracking controls */}
									<div className="flex items-center gap-2">
										<button className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-700">
											<svg
												className="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
											Hide Path
										</button>
									</div>

									{/* Center: Playback controls */}
									<div className="flex items-center gap-1">
										<button className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
											<svg
												className="h-6 w-6"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
												/>
											</svg>
										</button>
										<button className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
											<svg
												className="h-6 w-6"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M15 19l-7-7 7-7"
												/>
											</svg>
										</button>
										<button className="rounded-full bg-white p-3 text-slate-900 shadow-lg transition-transform hover:scale-105">
											<svg
												className="h-8 w-8"
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path d="M8 5v14l11-7z" />
											</svg>
										</button>
										<button className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
											<svg
												className="h-6 w-6"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 5l7 7-7 7"
												/>
											</svg>
										</button>
										<button className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
											<svg
												className="h-6 w-6"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M13 5l7 7-7 7M5 5l7 7-7 7"
												/>
											</svg>
										</button>
									</div>

									{/* Right: Frame display */}
									<div className="flex items-center gap-2">
										<div className="text-center">
											<div className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
												Frame
											</div>
											<div className="flex items-center gap-1">
												<input
													type="number"
													value="370"
													className="h-8 w-16 rounded border border-slate-600 bg-slate-700 text-center font-mono text-sm text-white"
												/>
												<span className="text-xs text-slate-400">/</span>
												<span className="font-mono text-xs text-slate-400">
													836
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Tools Bar - Step-based design */}
						<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
										Tools
									</span>
									<div className="h-6 w-px bg-slate-200" />
									<button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
										<svg
											className="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M4 6h16M4 12h16M4 18h16"
											/>
										</svg>
										Set Scale
									</button>
									<button className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
										<svg
											className="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
											/>
										</svg>
										Track Object
									</button>
								</div>

								{/* Object selector */}
								<div className="flex items-center gap-2">
									<button className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
										<div className="h-3 w-3 rounded-full bg-blue-500" />
										<span>Object 1</span>
										<svg
											className="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column: Analysis Dashboard */}
					<div className="col-span-12 space-y-4 lg:col-span-4">
						{/* Metrics Card - Grouped logically */}
						<div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
							<h3 className="mb-4 text-sm font-semibold text-slate-800">
								Analysis Metrics
							</h3>
							<div className="grid grid-cols-2 gap-4">
								{/* Row 1: Distance & Velocity */}
								<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
									<div className="mb-1 text-xs font-medium text-slate-500">
										Total Distance
									</div>
									<div className="flex items-baseline gap-1">
										<span className="text-2xl font-bold text-slate-900">
											2.45
										</span>
										<span className="text-base font-medium text-slate-600">
											m
										</span>
									</div>
								</div>
								<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
									<div className="mb-1 text-xs font-medium text-slate-500">
										Avg Velocity
									</div>
									<div className="flex items-baseline gap-1">
										<span className="text-2xl font-bold text-slate-900">
											1.23
										</span>
										<span className="text-base font-medium text-slate-600">
											m/s
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
											2.10
										</span>
										<span className="text-base font-medium text-slate-600">
											m/s
										</span>
									</div>
								</div>
								<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
									<div className="mb-1 text-xs font-medium text-slate-500">
										Acceleration
									</div>
									<div className="flex items-baseline gap-1">
										<span className="text-2xl font-bold text-slate-900">
											0.45
										</span>
										<span className="text-base font-medium text-slate-600">
											m/s²
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Graph Card - Enhanced contrast and bounding */}
						<div className="flex min-h-[400px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
							{/* Tab header - Primary, not secondary */}
							<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
								<div className="flex gap-1">
									<button className="rounded-t-lg border-b-2 border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600">
										Position
									</button>
									<button className="rounded-t-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
										Velocity
									</button>
									<button className="rounded-t-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
										Acceleration
									</button>
								</div>
							</div>

							{/* Graph area with card container */}
							<div className="flex-1 p-6">
								<div className="h-full rounded-lg border border-slate-200 bg-white p-4 shadow-inner">
									{/* Graph placeholder */}
									<div className="relative h-full">
										{/* Y-axis */}
										<div className="absolute top-0 left-0 flex h-full flex-col justify-between py-2">
											<span className="text-xs font-medium text-slate-700">
												2.0
											</span>
											<span className="text-xs font-medium text-slate-700">
												1.0
											</span>
											<span className="text-xs font-medium text-slate-700">
												0.0
											</span>
										</div>
										{/* X-axis */}
										<div className="absolute right-0 bottom-0 left-8 flex justify-between px-2">
											<span className="text-xs font-medium text-slate-700">
												0
											</span>
											<span className="text-xs font-medium text-slate-700">
												5
											</span>
											<span className="text-xs font-medium text-slate-700">
												10
											</span>
											<span className="text-xs font-medium text-slate-700">
												15
											</span>
											<span className="text-xs font-medium text-slate-700">
												20
											</span>
										</div>
										{/* Graph line */}
										<svg className="absolute inset-0 h-full w-full">
											<defs>
												<linearGradient
													id="gradient"
													x1="0%"
													y1="0%"
													x2="0%"
													y2="100%"
												>
													<stop
														offset="0%"
														stopColor="rgba(59, 130, 246, 0.3)"
													/>
													<stop
														offset="100%"
														stopColor="rgba(59, 130, 246, 0)"
													/>
												</linearGradient>
											</defs>
											<path
												d="M 40 80 Q 120 60 200 80 T 360 80"
												stroke="#3b82f6"
												strokeWidth="2"
												fill="none"
											/>
											<path
												d="M 40 80 L 40 200 L 360 200 L 360 80 Q 280 60 200 80 T 40 80 Z"
												fill="url(#gradient)"
											/>
											{/* Data points */}
											<circle cx="40" cy="80" r="4" fill="#3b82f6" />
											<circle cx="200" cy="80" r="4" fill="#3b82f6" />
											<circle cx="360" cy="80" r="4" fill="#3b82f6" />
										</svg>
										{/* Axis labels */}
										<div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-xs font-semibold text-slate-700">
											Time (s)
										</div>
										<div className="absolute top-1/2 left-0 -translate-x-8 -translate-y-1/2 -rotate-90 text-xs font-semibold text-slate-700">
											Position (m)
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Data Table Card - Enhanced with zebra striping */}
						<div className="flex max-h-[400px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
							<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
								<h3 className="text-sm font-semibold text-slate-800">
									Data Points
								</h3>
								<span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
									26 pts
								</span>
							</div>
							<div className="flex-1 overflow-y-auto">
								<table className="w-full text-left text-xs">
									<thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
										<tr>
											<th className="px-4 py-3">Frame</th>
											<th className="px-4 py-3">Time (s)</th>
											<th className="px-4 py-3">X (m)</th>
											<th className="px-4 py-3">Y (m)</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100">
										{/* Sample rows with zebra striping */}
										<tr className="bg-blue-50/50">
											<td className="px-4 py-2 font-mono text-slate-600">1</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.00
											</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.00
											</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.00
											</td>
										</tr>
										<tr>
											<td className="px-4 py-2 font-mono text-slate-600">2</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.03
											</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.05
											</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.02
											</td>
										</tr>
										<tr className="bg-blue-50/50">
											<td className="px-4 py-2 font-mono text-slate-600">3</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.07
											</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.10
											</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.04
											</td>
										</tr>
										<tr>
											<td className="px-4 py-2 font-mono text-slate-600">4</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.10
											</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.15
											</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.06
											</td>
										</tr>
										<tr className="bg-blue-50/50 ring-2 ring-blue-500">
											<td className="px-4 py-2 font-mono font-bold text-blue-600">
												5
											</td>
											<td className="px-4 py-2 font-mono font-bold text-blue-600">
												0.13
											</td>
											<td className="px-4 py-2 font-mono font-bold text-blue-600">
												0.20
											</td>
											<td className="px-4 py-2 font-mono font-bold text-blue-600">
												0.08
											</td>
										</tr>
										<tr>
											<td className="px-4 py-2 font-mono text-slate-600">6</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.17
											</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.25
											</td>
											<td className="px-4 py-2 font-mono text-slate-600">
												0.10
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
