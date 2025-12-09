import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { data, useFetcher, useFetchers } from 'react-router'
import { z } from 'zod'
import {
	useOptionalRequestInfo,
	useRequestInfo,
} from '#app/utils/request-info.ts'
import { type VideoLayout, setLayout } from '#app/utils/layout.server.ts'
import { type Route } from './+types/layout-switch.ts'

const LayoutFormSchema = z.object({
	layout: z.enum(['split', 'full-width']),
})

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: LayoutFormSchema,
	})

	invariantResponse(submission.status === 'success', 'Invalid layout received')

	const { layout } = submission.value

	const responseInit = {
		headers: { 'set-cookie': setLayout(layout) },
	}

	return data({ result: submission.reply() }, responseInit)
}

/**
 * If the user's changing their layout preference, this will return the
 * value it's being changed to.
 */
export function useOptimisticLayout() {
	const fetchers = useFetchers()
	const layoutFetcher = fetchers.find(
		(f) => f.formAction === '/resources/layout-switch',
	)

	if (layoutFetcher && layoutFetcher.formData) {
		const submission = parseWithZod(layoutFetcher.formData, {
			schema: LayoutFormSchema,
		})

		if (submission.status === 'success') {
			return submission.value.layout
		}
	}
}

/**
 * @returns the user's layout preference, or 'split' if the user has not set a preference.
 */
export function useLayout(): VideoLayout {
	const requestInfo = useRequestInfo()
	const optimisticLayout = useOptimisticLayout()
	if (optimisticLayout) {
		return optimisticLayout
	}
	return requestInfo.userPrefs.layout ?? 'split'
}

export function useOptionalLayout(): VideoLayout | null {
	const optionalRequestInfo = useOptionalRequestInfo()
	const optimisticLayout = useOptimisticLayout()
	if (optimisticLayout) {
		return optimisticLayout
	}
	return optionalRequestInfo?.userPrefs.layout ?? null
}
