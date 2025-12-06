import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { parseFormData } from '@mjackson/form-data-parser'
import React, { useState, useEffect } from 'react'
import { data, Form, useNavigation } from 'react-router'
import { z } from 'zod'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { uploadVideo } from '#app/utils/storage.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { type Route } from './+types/new.ts'

export const handle = {
	breadcrumb: <Icon name="file">Upload Video</Icon>,
}

// Valid video MIME types
const VALID_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_FILE_SIZE = 1024 * 1024 * 500 // 500MB

export const VideoUploadSchema = z.object({
	videoFile: z
		.instanceof(File)
		.refine((file) => file.size > 0, 'Video file is required')
		.refine(
			(file) => file.size <= MAX_FILE_SIZE,
			'Video file size must be less than 500MB',
		)
		.refine(
			(file) => VALID_VIDEO_TYPES.includes(file.type),
			'Video file must be mp4, webm, or mov format',
		),
})

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserId(request)
	return {}
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)

	const formData = await parseFormData(request, { maxFileSize: MAX_FILE_SIZE })
	const submission = await parseWithZod(formData, {
		schema: VideoUploadSchema,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { videoFile } = submission.value

	// Upload video to storage
	const objectKey = await uploadVideo(userId, videoFile)

	// Save video metadata to database
	await prisma.video.create({
		data: {
			filename: videoFile.name,
			url: objectKey,
			userId,
			// duration is nullable and can be calculated later
		},
	})

	return redirectWithToast('/videos/new', {
		title: 'Video uploaded',
		description: `Successfully uploaded ${videoFile.name}`,
		type: 'success',
	})
}

function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export default function VideoUploadRoute({ actionData }: Route.ComponentProps) {
	const navigation = useNavigation()
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [uploadProgress, setUploadProgress] = useState<number>(0)

	const [form, fields] = useForm({
		id: 'video-upload',
		constraint: getZodConstraint(VideoUploadSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: VideoUploadSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	const isPending = useIsPending()
	const pendingIntent = isPending ? navigation.formData?.get('intent') : null
	const lastSubmissionIntent = fields.videoFile.value

	// Show upload progress during submission (will be replaced with real progress in F002)
	const isUploading = navigation.state === 'submitting'

	// Simulate progress during upload (for F001, will be real progress in F002)
	useEffect(() => {
		if (isUploading) {
			const interval = setInterval(() => {
				setUploadProgress((prev) => {
					if (prev >= 90) return prev
					return prev + 10
				})
			}, 200)
			return () => clearInterval(interval)
		} else {
			setUploadProgress(0)
		}
	}, [isUploading])

	return (
		<div className="mx-auto max-w-2xl">
			<h1 className="text-h1 mb-8">Upload Video</h1>
			<Form
				method="POST"
				encType="multipart/form-data"
				className="flex flex-col gap-6"
				onReset={() => {
					setSelectedFile(null)
					setUploadProgress(0)
				}}
				{...getFormProps(form)}
			>
				<Field
					labelProps={{ children: 'Video File' }}
					inputProps={{
						...getInputProps(fields.videoFile, { type: 'file' }),
						accept: 'video/mp4,video/webm,video/quicktime',
						onChange: (e) => {
							const file = e.currentTarget.files?.[0]
							if (file) {
								setSelectedFile(file)
								setUploadProgress(0)
							}
						},
					}}
					errors={fields.videoFile.errors}
				/>

				{selectedFile && (
					<div className="rounded-lg border p-4">
						<div className="flex items-center gap-2">
							<Icon name="video" className="text-muted-foreground" />
							<div className="flex-1">
								<p className="font-medium">{selectedFile.name}</p>
								<p className="text-muted-foreground text-sm">
									{formatFileSize(selectedFile.size)}
								</p>
							</div>
						</div>
					</div>
				)}

				{isUploading && (
					<div className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span>Uploading...</span>
							<span>{uploadProgress}%</span>
						</div>
						<div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
							<div
								className="bg-primary h-full transition-all duration-300"
								style={{ width: `${uploadProgress}%` }}
							/>
						</div>
					</div>
				)}

				<div className="flex gap-4">
					<StatusButton
						type="submit"
						disabled={!selectedFile}
						status={
							pendingIntent
								? 'pending'
								: lastSubmissionIntent
									? (form.status ?? 'idle')
									: 'idle'
						}
					>
						<Icon name="upload" className="size-4">
							Upload
						</Icon>
					</StatusButton>
					{selectedFile && (
						<Button
							type="reset"
							variant="outline"
							{...form.reset.getButtonProps()}
						>
							Clear
						</Button>
					)}
				</div>

				<ErrorList errors={form.errors} />
			</Form>
		</div>
	)
}
