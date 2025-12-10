import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { data } from 'react-router'
import { z } from 'zod'
import {
	getActiveTrackingObjectId,
	setActiveTrackingObjectId,
} from '#app/utils/tracking-object-selection.server.ts'
import { type Route } from './+types/tracking-object-selection.ts'

const TrackingObjectSelectionSchema = z.object({
	videoId: z.string(),
	trackingObjectId: z
		.string()
		.transform((val) => (val === '' ? null : val))
		.nullable(),
})

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const videoId = url.searchParams.get('videoId')
	invariantResponse(videoId, 'videoId is required', { status: 400 })

	const activeTrackingObjectId = await getActiveTrackingObjectId(
		request,
		videoId,
	)

	return data({ activeTrackingObjectId })
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: TrackingObjectSelectionSchema,
	})

	invariantResponse(
		submission.status === 'success',
		'Invalid tracking object selection',
	)

	const { videoId, trackingObjectId } = submission.value

	const setCookieHeader = await setActiveTrackingObjectId(
		request,
		videoId,
		trackingObjectId,
	)

	return data(
		{ result: submission.reply() },
		{
			headers: { 'set-cookie': setCookieHeader },
		},
	)
}

