/**
 * Video Tracker Mockup 2 - Improved UX Design
 *
 * This mockup implements the improved dashboard design based on UX feedback:
 * - Strengthened upload section (visually dominant, larger, bolder)
 * - Reorganized hierarchy with better typography
 * - Improved card metadata clarity (status badges at top-left, better spacing)
 * - Fixed whitespace balance and removed floating elements
 * - Clarified difference between "Upload Video" and "New Analysis"
 * - Better hover states and visual feedback
 * - Stronger "View All" link
 */

import { Link } from 'react-router'

export default function Mockup2() {
	// Mock data for demonstration
	const mockVideos = [
		{
			id: '1',
			filename: 'Pendulum Experiment.mp4',
			uploadedAt: '1 day ago',
			duration: '0:45',
			status: 'Completed',
			trackingPoints: 26,
		},
		{
			id: '2',
			filename: 'Pendulum Experiment.mp4',
			uploadedAt: '2 days ago',
			duration: '0:45',
			status: 'Draft',
			trackingPoints: 0,
		},
		{
			id: '3',
			filename: 'Projectile Motion.mp4',
			uploadedAt: '3 days ago',
			duration: '1:23',
			status: 'In Progress',
			trackingPoints: 5,
		},
		{
			id: '4',
			filename: 'Spring Oscillation.mp4',
			uploadedAt: '5 days ago',
			duration: '0:32',
			status: 'Completed',
			trackingPoints: 18,
		},
		{
			id: '5',
			filename: 'Free Fall Analysis.mp4',
			uploadedAt: '1 week ago',
			duration: '2:15',
			status: 'Completed',
			trackingPoints: 42,
		},
		{
			id: '6',
			filename: 'Circular Motion.mp4',
			uploadedAt: '2 weeks ago',
			duration: '0:58',
			status: 'Draft',
			trackingPoints: 0,
		},
	]

	return (
		<div className="min-h-screen bg-slate-50">
			{/* Top Navigation Bar - Enhanced */}

			{/* Main Content */}
			<main className="mx-auto max-w-[1920px] px-6 py-8">
				{/* Header Section - Enhanced Typography */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold tracking-tight text-slate-900">
						My Experiments
					</h1>
					<p className="mt-3 text-base font-medium text-slate-600">
						Upload a video to begin tracking motion, generating data, and
						visualizing physics experiments.
					</p>
				</div>

				{/* Upload Section - Visually Dominant */}
				<div className="mb-12">
					<div className="group relative mx-auto max-w-2xl">
						<Link
							to="/videos/new"
							className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-white p-16 text-center transition-all hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-50 hover:shadow-xl"
						>
							{/* Large, prominent icon */}
							<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform group-hover:scale-110 group-hover:shadow-xl">
								<svg
									className="h-10 w-10"
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
							<h2 className="text-2xl font-bold text-slate-900">
								Upload your experiment video
							</h2>
							<p className="mt-3 text-base text-slate-600">
								Drag video here or click to choose file
							</p>
							<p className="mt-2 text-sm text-slate-500">
								MP4, WebM or MOV (max 100MB)
							</p>
							<div className="mt-6">
								<button
									type="button"
									className="flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
								>
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
											d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
										/>
									</svg>
									Paste YouTube URL
								</button>
							</div>
						</Link>

						{/* "New Analysis" button - Repositioned to the right */}
						<div className="absolute top-0 right-0">
							<Link
								to="/videos/new"
								className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-300"
							>
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
										d="M12 4v16m8-8H4"
									/>
								</svg>
								New Analysis
							</Link>
						</div>
					</div>
				</div>

				{/* Recent Analyses Section - Improved */}
				<div className="mb-8">
					<div className="mb-6 flex items-center justify-between">
						<h2 className="text-2xl font-bold text-slate-900">
							Recent Analyses
						</h2>
						<Link
							to="/videos"
							className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
						>
							View All
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
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</Link>
					</div>

					{/* Video Cards Grid */}
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{mockVideos.map((video) => (
							<VideoCard key={video.id} video={video as any} />
						))}
					</div>
				</div>
			</main>
		</div>
	)
}

function VideoCard({
	video,
}: {
	video: {
		id: string
		filename: string
		uploadedAt: string
		duration: string
		status: 'Completed' | 'Draft' | 'In Progress'
		trackingPoints: number
	}
}) {
	const statusConfig = {
		Completed: {
			bg: 'bg-green-500',
			text: 'text-green-700',
			border: 'border-green-200',
			bgLight: 'bg-green-50',
		},
		'In Progress': {
			bg: 'bg-amber-500',
			text: 'text-amber-700',
			border: 'border-amber-200',
			bgLight: 'bg-amber-50',
		},
		Draft: {
			bg: 'bg-slate-400',
			text: 'text-slate-600',
			border: 'border-slate-200',
			bgLight: 'bg-slate-100',
		},
	}

	const config = statusConfig[video.status]

	return (
		<div className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:shadow-lg">
			<Link
				to={`/videos/${video.id}`}
				className="focus:ring-primary block focus:ring-2 focus:outline-none"
			>
				{/* Video Thumbnail with Status Badge at Top-Left */}
				<div className="relative aspect-video overflow-hidden bg-slate-100">
					{/* Video placeholder */}
					<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
						<svg
							className="h-16 w-16 text-slate-400"
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

					{/* Status Badge - Top-Left */}
					<div
						className={`absolute top-3 left-3 rounded-full border ${config.border} ${config.bgLight} px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${config.text}`}
					>
						{video.status}
					</div>

					{/* Hover Overlay - Dark veil + Play icon */}
					<div className="absolute inset-0 bg-slate-900/0 transition-all group-hover:bg-slate-900/40">
						<div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
							<div className="rounded-full bg-white/95 p-4 shadow-xl">
								<svg
									className="h-8 w-8 text-blue-600"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M8 5v14l11-7z" />
								</svg>
							</div>
						</div>
					</div>

					{/* Duration Badge - Bottom-Right */}
					<span className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
						{video.duration}
					</span>
				</div>

				{/* Video Info - Better spacing and hierarchy */}
				<div className="p-5">
					<h3 className="mb-3 line-clamp-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
						{video.filename}
					</h3>
					<div className="flex items-center justify-between">
						{/* Metadata - More visible */}
						<div className="flex items-center gap-3">
							<span className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
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
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								{video.uploadedAt}
							</span>
							{video.trackingPoints > 0 && (
								<span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
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
											d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
										/>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
									{video.trackingPoints} pts
								</span>
							)}
						</div>

						{/* Menu Button - Appears on hover */}
						<button
							type="button"
							className="opacity-0 transition-opacity group-hover:opacity-100"
							onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()
							}}
						>
							<svg
								className="h-5 w-5 text-slate-400 transition-colors hover:text-slate-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
								/>
							</svg>
						</button>
					</div>
				</div>
			</Link>
		</div>
	)
}
