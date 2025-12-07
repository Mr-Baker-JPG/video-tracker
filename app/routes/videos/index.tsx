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
		<div className="space-y-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-slate-900">
						My Experiments
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						Manage and analyze your physics videos.
					</p>
				</div>
				<Link
					to="/videos/new"
					className="bg-primary flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-600"
				>
					<Icon name="plus" className="h-4 w-4" />
					New Analysis
				</Link>
			</div>

			{loaderData.videos.length === 0 ? (
				<Link
					to="/videos/new"
					className="group hover:border-primary flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center transition-all hover:bg-slate-50"
				>
					<div className="text-primary mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 transition-transform group-hover:scale-110">
						<Icon name="upload" className="h-7 w-7" />
					</div>
					<h3 className="text-lg font-semibold text-slate-900">
						Upload your experiment video
					</h3>
					<p className="mt-2 text-sm text-slate-500">
						Drag and drop MP4, WebM or MOV (max 100MB)
					</p>
					<div className="mt-6 flex justify-center">
						<button
							type="button"
							className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
						>
							<Icon name="link-2" className="h-3 w-3" />
							Paste YouTube URL
						</button>
					</div>
				</Link>
			) : (
				<>
					<Link
						to="/videos/new"
						className="group hover:border-primary flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center transition-all hover:bg-slate-50"
					>
						<div className="text-primary mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 transition-transform group-hover:scale-110">
							<Icon name="upload" className="h-7 w-7" />
						</div>
						<h3 className="text-lg font-semibold text-slate-900">
							Upload your experiment video
						</h3>
						<p className="mt-2 text-sm text-slate-500">
							Drag and drop MP4, WebM or MOV (max 100MB)
						</p>
						<div className="mt-6 flex justify-center">
							<button
								type="button"
								className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
							>
								<Icon name="link-2" className="h-3 w-3" />
								Paste YouTube URL
							</button>
						</div>
					</Link>

					<div>
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-slate-900">
								Recent Analyses
							</h2>
							<button className="text-primary text-sm hover:underline">
								View All
							</button>
						</div>

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
				</>
			)}
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
	const statusColor =
		status === 'Completed'
			? 'bg-green-50 text-green-700 border-green-200'
			: status === 'In Progress'
				? 'bg-amber-50 text-amber-700 border-amber-200'
				: 'bg-slate-100 text-slate-600 border-slate-200'

	return (
		<div className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-blue-100 hover:shadow-md">
			<Link
				to={`/videos/${video.id}`}
				className="focus:ring-primary block focus:ring-2 focus:outline-none"
			>
				{/* Video Thumbnail */}
				<div className="relative aspect-video overflow-hidden bg-slate-100">
					<video
						src={videoSrc}
						className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
						muted
						preload="metadata"
					/>
					<div className="absolute inset-0 bg-slate-900/10 transition-colors group-hover:bg-slate-900/0" />
					<div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
						<div className="rounded-full bg-white/90 p-3 shadow-lg">
							<Icon name="play" className="text-primary h-6 w-6 fill-current" />
						</div>
					</div>
					{video.duration && (
						<span className="absolute right-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
							{formatDuration(video.duration)}
						</span>
					)}
				</div>

				{/* Video Info */}
				<div className="p-4">
					<div className="mb-2 flex items-start justify-between">
						<h3 className="group-hover:text-primary truncate pr-2 font-semibold text-slate-900 transition-colors">
							{video.filename}
						</h3>
						<div className="group/tooltip relative">
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
									className="h-4 w-4 p-0 text-slate-400 hover:text-red-500"
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										dc.getButtonProps().onClick?.(e)
									}}
								>
									<Icon name="dropdown-menu" className="h-4 w-4" />
								</StatusButton>
							</Form>
							<ErrorList errors={form.errors} id={form.errorId} />
						</div>
					</div>
					<div className="mt-3 flex items-center justify-between">
						<span className="flex items-center gap-1 text-xs text-slate-500">
							<Icon name="clock" className="h-3 w-3" />
							{timeAgo}
						</span>
						<span
							className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${statusColor}`}
						>
							{status}
						</span>
					</div>
				</div>
			</Link>
		</div>
	)
}
