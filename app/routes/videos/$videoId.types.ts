export type TrackingPoint = {
	id: string
	frame: number
	x: number
	y: number
	trackingObjectId: string
}

export type TrackingObject = {
	id: string
	name: string | null
	color: string | null
}

export type VideoScale = {
	id: string
	startX: number
	startY: number
	endX: number
	endY: number
	distanceMeters: number
	pixelsPerMeter: number
}

export type VideoAxis = {
	id: string
	originX: number
	originY: number
	rotationAngle: number
}

export type Video = {
	id: string
	filename: string
	url: string
	duration: number | null
	uploadedAt: Date
	userId: string
}

export type VideoRouteLoaderData = {
	video: Video
	videoSrc: string
	trackingPoints: TrackingPoint[]
	trackingObjects: TrackingObject[]
	scale: VideoScale | null
	axis: VideoAxis | null
	activeTrackingObjectId: string | null
}
