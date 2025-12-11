import { authSessionStorage } from './session.server.ts'

const SESSION_KEY = 'activeTrackingObjectId'

/**
 * Get the active tracking object ID for a specific video from session storage
 */
export async function getActiveTrackingObjectId(
	request: Request,
	videoId: string,
): Promise<string | null> {
	const session = await authSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const activeObjects = session.get(SESSION_KEY) as
		| Record<string, string>
		| undefined
	return activeObjects?.[videoId] ?? null
}

/**
 * Set the active tracking object ID for a specific video in session storage
 */
export async function setActiveTrackingObjectId(
	request: Request,
	videoId: string,
	trackingObjectId: string | null,
): Promise<string> {
	const session = await authSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const activeObjects =
		(session.get(SESSION_KEY) as Record<string, string> | undefined) ?? {}

	if (trackingObjectId === null) {
		// Remove the entry for this video
		const { [videoId]: _, ...rest } = activeObjects
		session.set(SESSION_KEY, rest)
	} else {
		// Set the entry for this video
		session.set(SESSION_KEY, {
			...activeObjects,
			[videoId]: trackingObjectId,
		})
	}

	return await authSessionStorage.commitSession(session)
}




