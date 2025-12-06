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
		<div className="mx-auto max-w-6xl">
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-h1">My Videos</h1>
				<Link
					to="/videos/new"
					className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2"
				>
					<Icon name="plus" className="size-4">
						Upload Video
					</Icon>
				</Link>
			</div>

			{loaderData.videos.length === 0 ? (
				<div className="py-12 text-center">
					<Icon
						name="video"
						className="text-muted-foreground mx-auto mb-4 size-16"
					/>
					<p className="text-muted-foreground mb-2 text-lg">No videos yet</p>
					<p className="text-muted-foreground mb-4 text-sm">
						Upload your first video to get started
					</p>
					<Link
						to="/videos/new"
						className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2"
					>
						<Icon name="plus" className="size-4">
							Upload Video
						</Icon>
					</Link>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{loaderData.videos.map((video) => (
						<VideoCard key={video.id} video={video} actionData={actionData} />
					))}
				</div>
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

	return (
		<div className="group bg-card relative overflow-hidden rounded-lg border">
			<Link
				to={`/videos/${video.id}`}
				className="focus:ring-primary block focus:ring-2 focus:outline-none"
			>
				{/* Video Thumbnail Placeholder */}
				<div className="bg-muted relative flex aspect-video items-center justify-center overflow-hidden">
					<video
						src={videoSrc}
						className="h-full w-full object-cover"
						muted
						preload="metadata"
					/>
					<div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
						<Icon
							name="play"
							className="size-12 text-white opacity-80 transition-opacity group-hover:opacity-100"
						/>
					</div>
					{video.duration && (
						<div className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
							{formatDuration(video.duration)}
						</div>
					)}
				</div>

				{/* Video Info */}
				<div className="p-4">
					<h3 className="mb-1 line-clamp-2 font-semibold">{video.filename}</h3>
					<p className="text-muted-foreground text-sm">{timeAgo}</p>
				</div>
			</Link>

			{/* Delete Button */}
			<div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
				<Form method="POST" {...getFormProps(form)}>
					<input type="hidden" name="videoId" value={video.id} />
					<StatusButton
						type="submit"
						name="intent"
						value="delete-video"
						variant={dc.doubleCheck ? 'destructive' : 'secondary'}
						size="sm"
						status={isPending ? 'pending' : (form.status ?? 'idle')}
						disabled={isPending}
						{...dc.getButtonProps()}
						className="h-8 w-8 p-0"
					>
						<Icon name={dc.doubleCheck ? 'trash' : 'trash'} className="size-4">
							{dc.doubleCheck ? 'Delete?' : ''}
						</Icon>
					</StatusButton>
				</Form>
				<ErrorList errors={form.errors} id={form.errorId} />
			</div>
		</div>
	)
}
