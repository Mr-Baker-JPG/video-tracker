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
import { prisma } from '#app/utils/db.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { uploadVideo } from '#app/utils/storage.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { isValidYouTubeUrl, extractYouTubeVideoId } from '#app/utils/youtube.ts'
import { type Route } from './+types/new.ts'

export const handle = {
	breadcrumb: <Icon name="file">Upload Video</Icon>,
}

// Valid video MIME types
const VALID_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_FILE_SIZE = 1024 * 1024 * 500 // 500MB

export const VideoUploadSchema = z
	.object({
		uploadType: z.enum(['file', 'youtube']),
		videoFile: z.instanceof(File).optional(),
		youtubeUrl: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.uploadType === 'file') {
			if (!data.videoFile || !(data.videoFile instanceof File)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Video file is required',
					path: ['videoFile'],
				})
				return
			}

			if (data.videoFile.size === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Video file is required',
					path: ['videoFile'],
				})
			}

			if (data.videoFile.size > MAX_FILE_SIZE) {
				const fileSizeMB = (data.videoFile.size / (1024 * 1024)).toFixed(2)
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `File size (${fileSizeMB} MB) exceeds the maximum allowed size of 500 MB. Please compress the video or use a smaller file.`,
					path: ['videoFile'],
				})
			}

			if (!VALID_VIDEO_TYPES.includes(data.videoFile.type)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Invalid file type. Please upload a video file in MP4, WebM, or MOV format. Detected type: ${data.videoFile.type || 'unknown'}`,
					path: ['videoFile'],
				})
			}
		} else if (data.uploadType === 'youtube') {
			if (!data.youtubeUrl || data.youtubeUrl.trim().length === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'YouTube URL is required',
					path: ['youtubeUrl'],
				})
				return
			}

			if (!isValidYouTubeUrl(data.youtubeUrl)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Please enter a valid YouTube URL',
					path: ['youtubeUrl'],
				})
				return
			}

			const videoId = extractYouTubeVideoId(data.youtubeUrl)
			if (!videoId) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Could not extract video ID from YouTube URL',
					path: ['youtubeUrl'],
				})
			}
		}
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

	const submissionValue = submission.value

	if (submissionValue.uploadType === 'youtube') {
		// For YouTube URLs, we don't process them yet - just show a message
		// In the future, this would trigger video download/processing
		const videoId = extractYouTubeVideoId(submissionValue.youtubeUrl || '')
		return redirectWithToast('/videos/new', {
			title: 'YouTube video detected',
			description: `YouTube video processing is not yet available. Video ID: ${videoId}`,
			type: 'message',
		})
	}

	// Handle file upload (existing logic)
	const videoFile = submissionValue.videoFile
	if (!videoFile) {
		return data(
			{
				result: submission.reply({
					formErrors: ['Video file is required'],
				}),
			},
			{ status: 400 },
		)
	}

	try {
		// Upload video to storage
		const objectKey = await uploadVideo(userId, videoFile)

		// Save video metadata to database
		// SQLite auto-commits transactions, so no need for explicit commit
		const video = await prisma.video.create({
			data: {
				filename: videoFile.name,
				url: objectKey,
				userId,
				// duration is nullable and can be calculated later
			},
			select: {
				id: true,
			},
		})

		return redirectWithToast(`/videos/${video.id}`, {
			title: 'Video uploaded',
			description: `Successfully uploaded ${videoFile.name}`,
			type: 'success',
		})
	} catch (error) {
		console.error('Video upload error:', error)
		return data(
			{
				result: submission.reply({
					formErrors: [
						error instanceof Error
							? error.message
							: 'Failed to upload video. Please try again.',
					],
				}),
			},
			{ status: 500 },
		)
	}
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
	const [uploadType, setUploadType] = useState<'file' | 'youtube'>('file')
	const [uploadProgress, setUploadProgress] = useState<number>(0)

	const [form, fields] = useForm({
		id: 'video-upload',
		constraint: getZodConstraint(VideoUploadSchema),
		lastResult: actionData?.result,
		defaultValue: {
			uploadType: 'file',
			youtubeUrl: '',
		},
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: VideoUploadSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	const isPending = useIsPending()
	const pendingIntent = isPending ? navigation.formData?.get('intent') : null

	// Show upload progress during submission (will be replaced with real progress in F002)
	const isUploading = navigation.state === 'submitting'

	// Simulate progress during upload (for F001, will be real progress in F002)
	useEffect(() => {
		if (isUploading && uploadType === 'file') {
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
	}, [isUploading, uploadType])

	const youtubeUrlValue = fields.youtubeUrl?.value?.toString() || ''
	const isYouTubeUrlValid =
		uploadType === 'youtube' &&
		youtubeUrlValue &&
		isValidYouTubeUrl(youtubeUrlValue)
	const canSubmit =
		(uploadType === 'file' && selectedFile) ||
		(uploadType === 'youtube' && isYouTubeUrlValid)

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
					setUploadType('file')
				}}
				{...getFormProps(form)}
			>
				<input type="hidden" name="uploadType" value={uploadType} />

				{/* Upload Type Selection */}
				<div className="flex gap-2">
					<Button
						type="button"
						variant={uploadType === 'file' ? 'default' : 'outline'}
						onClick={() => {
							setUploadType('file')
							setSelectedFile(null)
						}}
					>
						<Icon name="upload" className="size-4">
							Upload File
						</Icon>
					</Button>
					<Button
						type="button"
						variant={uploadType === 'youtube' ? 'default' : 'outline'}
						onClick={() => {
							setUploadType('youtube')
							setSelectedFile(null)
						}}
					>
						<Icon name="link-2" className="size-4">
							YouTube URL
						</Icon>
					</Button>
				</div>

				{uploadType === 'file' ? (
					<>
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
							errors={fields.videoFile?.errors}
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
					</>
				) : (
					<>
						<Field
							labelProps={{ children: 'YouTube URL' }}
							inputProps={{
								...getInputProps(fields.youtubeUrl, { type: 'url' }),
								placeholder: 'https://www.youtube.com/watch?v=...',
								onChange: () => {
									// Trigger validation on change
									setTimeout(() => {
										form.validate()
									}, 0)
								},
							}}
							errors={fields.youtubeUrl?.errors}
						/>

						{youtubeUrlValue && isYouTubeUrlValid && (
							<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
								<div className="flex items-start gap-2">
									<Icon name="check" className="text-blue-600" />
									<div className="flex-1 space-y-2">
										<p className="font-medium text-blue-900">
											Valid YouTube URL detected
										</p>
										<p className="text-sm text-blue-700">
											Video ID:{' '}
											<code className="rounded bg-blue-100 px-1 py-0.5 text-xs">
												{extractYouTubeVideoId(youtubeUrlValue)}
											</code>
										</p>
										<div className="mt-3 rounded-md border border-blue-200 bg-white p-3">
											<p className="text-muted-foreground text-sm">
												<strong>Note:</strong> YouTube video processing is not
												yet available. This feature will allow you to analyze
												videos directly from YouTube in a future update.
											</p>
										</div>
									</div>
								</div>
							</div>
						)}

						{youtubeUrlValue && !isYouTubeUrlValid && (
							<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
								<div className="flex items-start gap-2">
									<Icon
										name="question-mark-circled"
										className="text-yellow-600"
									/>
									<div className="flex-1">
										<p className="text-sm text-yellow-800">
											Please enter a valid YouTube URL (e.g.,{' '}
											<code className="rounded bg-yellow-100 px-1 py-0.5 text-xs">
												https://www.youtube.com/watch?v=VIDEO_ID
											</code>{' '}
											or{' '}
											<code className="rounded bg-yellow-100 px-1 py-0.5 text-xs">
												https://youtu.be/VIDEO_ID
											</code>
											)
										</p>
									</div>
								</div>
							</div>
						)}
					</>
				)}

				<div className="flex gap-4">
					<StatusButton
						type="submit"
						disabled={!canSubmit}
						status={
							pendingIntent
								? 'pending'
								: form.status === 'error'
									? 'error'
									: form.status === 'success'
										? 'success'
										: 'idle'
						}
					>
						{uploadType === 'file' ? (
							<>
								<Icon name="upload" className="size-4">
									Upload
								</Icon>
							</>
						) : (
							<>
								<Icon name="link-2" className="size-4">
									Submit URL
								</Icon>
							</>
						)}
					</StatusButton>
					{(selectedFile || (uploadType === 'youtube' && youtubeUrlValue)) && (
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
