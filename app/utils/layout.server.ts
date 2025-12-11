import * as cookie from 'cookie'

const cookieName = 'en_video_layout'
export type VideoLayout = 'split' | 'full-width'

export function getLayout(request: Request): VideoLayout | null {
	const cookieHeader = request.headers.get('cookie')
	const parsed = cookieHeader ? cookie.parse(cookieHeader)[cookieName] : null
	if (parsed === 'split' || parsed === 'full-width') return parsed
	return null
}

export function setLayout(layout: VideoLayout) {
	return cookie.serialize(cookieName, layout, { path: '/', maxAge: 31536000 })
}




