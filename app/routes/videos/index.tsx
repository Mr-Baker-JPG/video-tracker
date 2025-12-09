import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { formatDistanceToNow } from 'date-fns'
import { data, Form, Link } from 'react-router'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getVideoSrc, useIsPending, useDoubleCheck } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { type Route } from './+types/index.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)

	const videos = await prisma.video.findMany({
		where: { userId },
		select: {
			id: true,
			filename: true,
			url: true,
			uploadedAt: true,
			duration: true,
			_count: {
				select: {
					trackingPoints: true,
				},
			},
		},
		orderBy: { uploadedAt: 'desc' },
	})

	return { videos }
}

const DeleteFormSchema = z.object({
	intent: z.literal('delete-video'),
	videoId: z.string(),
})

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: DeleteFormSchema,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { videoId } = submission.value

	const video = await prisma.video.findFirst({
		select: { id: true, userId: true },
		where: { id: videoId },
	})

	invariantResponse(video, 'Video not found', { status: 404 })
	invariantResponse(
		video.userId === userId,
		'You do not have permission to delete this video',
		{ status: 403 },
	)

	await prisma.video.delete({ where: { id: video.id } })

	return redirectWithToast('/videos', {
		type: 'success',
		title: 'Success',
		description: 'Your video has been deleted.',
	})
}

function formatDuration(seconds: number | null | undefined): string {
	if (!seconds) return 'Unknown'
	const mins = Math.floor(seconds / 60)
	const secs = Math.floor(seconds % 60)
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function VideosRoute({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	return (
		<div className="min-h-screen bg-slate-50">
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
								<Icon name="upload" className="h-10 w-10" />
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
									<Icon name="link-2" className="h-4 w-4" />
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
								<Icon name="plus" className="h-4 w-4" />
								New Analysis
							</Link>
						</div>
					</div>
				</div>

				{/* Recent Analyses Section - Improved */}
				{loaderData.videos.length > 0 && (
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
								<Icon name="arrow-right" className="h-4 w-4" />
							</Link>
						</div>

						{/* Video Cards Grid */}
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{loaderData.videos.map((video) => (
								<VideoCard
									key={video.id}
									video={video}
									actionData={actionData}
								/>
							))}
						</div>
					</div>
				)}
			</main>
		</div>
	)
}

function VideoCard({
	video,
	actionData,
}: {
	video: {
		id: string
		filename: string
		url: string
		uploadedAt: Date
		duration: number | null
		_count: {
			trackingPoints: number
		}
	}
	actionData: Route.ComponentProps['actionData']
}) {
	const dc = useDoubleCheck()
	const isPending = useIsPending()
	const [form] = useForm({
		id: `delete-video-${video.id}`,
		lastResult: actionData?.result,
	})

	const timeAgo = formatDistanceToNow(new Date(video.uploadedAt), {
		addSuffix: true,
	})
	const videoSrc = getVideoSrc(video.url)

	// Determine status based on tracking data
	const trackingPointCount = video._count.trackingPoints
	let status: 'Completed' | 'Draft' | 'In Progress'
	if (trackingPointCount >= 10) {
		status = 'Completed'
	} else if (trackingPointCount > 0) {
		status = 'In Progress'
	} else {
		status = 'Draft'
	}

	const statusConfig = {
		Completed: {
			text: 'text-green-700',
			border: 'border-green-200',
			bgLight: 'bg-green-50',
		},
		'In Progress': {
			text: 'text-amber-700',
			border: 'border-amber-200',
			bgLight: 'bg-amber-50',
		},
		Draft: {
			text: 'text-slate-600',
			border: 'border-slate-200',
			bgLight: 'bg-slate-100',
		},
	}

	const config = statusConfig[status]

	return (
		<div className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:shadow-lg">
			<Link
				to={`/videos/${video.id}`}
				className="focus:ring-primary block focus:ring-2 focus:outline-none"
			>
				{/* Video Thumbnail with Status Badge at Top-Left */}
				<div className="relative aspect-video overflow-hidden bg-slate-100">
					<video
						src={videoSrc}
						className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
						muted
						preload="metadata"
					/>

					{/* Status Badge - Top-Left */}
					<div
						className={`absolute top-3 left-3 rounded-full border ${config.border} ${config.bgLight} px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${config.text}`}
					>
						{status}
					</div>

					{/* Hover Overlay - Dark veil + Play icon */}
					<div className="absolute inset-0 bg-slate-900/0 transition-all group-hover:bg-slate-900/40">
						<div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
							<div className="rounded-full bg-white/95 p-4 shadow-xl">
								<Icon
									name="play"
									className="h-8 w-8 fill-current text-blue-600"
								/>
							</div>
						</div>
					</div>

					{/* Duration Badge - Bottom-Right */}
					{video.duration && (
						<span className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
							{formatDuration(video.duration)}
						</span>
					)}
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
								<Icon name="clock" className="h-4 w-4" />
								{timeAgo}
							</span>
							{trackingPointCount > 0 && (
								<span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
									<Icon name="crosshair-1" className="h-4 w-4" />
									{trackingPointCount} pts
								</span>
							)}
						</div>

						{/* Menu Button - Appears on hover */}
						<div className="group/menu relative opacity-0 transition-opacity group-hover:opacity-100">
							<Form method="POST" {...getFormProps(form)}>
								<input type="hidden" name="videoId" value={video.id} />
								<StatusButton
									type="submit"
									name="intent"
									value="delete-video"
									variant="ghost"
									size="sm"
									status={isPending ? 'pending' : (form.status ?? 'idle')}
									disabled={isPending}
									{...dc.getButtonProps()}
									className="h-5 w-5 p-0 text-slate-400 transition-colors hover:text-slate-600"
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										dc.getButtonProps().onClick?.(e)
									}}
								>
									<Icon name="dropdown-menu" className="h-5 w-5" />
								</StatusButton>
							</Form>
							<ErrorList errors={form.errors} id={form.errorId} />
						</div>
					</div>
				</div>
			</Link>
		</div>
	)
}
