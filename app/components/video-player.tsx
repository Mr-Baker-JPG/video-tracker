import { useRef, useState, useEffect, useCallback } from 'react'
import { useFetcher } from 'react-router'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Input } from '#app/components/ui/input.tsx'

interface TrackingPoint {
	id: string
	frame: number
	x: number
	y: number
	trackingObjectId: string
}

interface TrackingObject {
	id: string
	name: string | null
	color: string | null
}

interface Scale {
	id: string
	startX: number
	startY: number
	endX: number
	endY: number
	distanceMeters: number
	pixelsPerMeter: number
}

interface VideoPlayerProps {
	src: string
	className?: string
	videoId?: string
	trackingPoints?: TrackingPoint[]
	trackingObjects?: TrackingObject[]
	activeTrackingObjectId?: string | null
	onActiveTrackingObjectChange?: (id: string | null) => void
	scale?: Scale | null
	onScaleCalibrationModeChange?: (isActive: boolean) => void
	isScaleCalibrationModeExternal?: boolean
}

function formatTime(seconds: number): string {
	if (!isFinite(seconds) || isNaN(seconds)) return '0:00.000'
	const mins = Math.floor(seconds / 60)
	const secs = Math.floor(seconds % 60)
	const milliseconds = Math.floor((seconds % 1) * 1000)
	return `${mins}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
}

export function VideoPlayer({
	src,
	className,
	videoId,
	trackingPoints = [],
	trackingObjects = [],
	activeTrackingObjectId: externalActiveTrackingObjectId,
	onActiveTrackingObjectChange,
	scale: initialScale = null,
	onScaleCalibrationModeChange,
	isScaleCalibrationModeExternal = false,
}: VideoPlayerProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const isSeekingRef = useRef(false)
	const seekTimeRef = useRef<number | null>(null)
	// useFetcher must be called unconditionally (React hook rule)
	// We'll only use it when videoId is provided
	const fetcher = useFetcher()
	const [isPlaying, setIsPlaying] = useState(false)
	const [isEnded, setIsEnded] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [isSeeking, setIsSeeking] = useState(false)
	const [seekTime, setSeekTime] = useState<number | null>(null)
	const [localTrackingPoints, setLocalTrackingPoints] =
		useState<TrackingPoint[]>(trackingPoints)
	const [localTrackingObjects, setLocalTrackingObjects] =
		useState<TrackingObject[]>(trackingObjects)
	const [internalActiveTrackingObjectId, setInternalActiveTrackingObjectId] =
		useState<string | null>(null)

	// Use external activeTrackingObjectId if provided, otherwise use internal state
	const activeTrackingObjectId =
		externalActiveTrackingObjectId !== undefined
			? externalActiveTrackingObjectId
			: internalActiveTrackingObjectId

	const setActiveTrackingObjectId = useCallback(
		(id: string | null) => {
			if (onActiveTrackingObjectChange) {
				onActiveTrackingObjectChange(id)
			} else {
				setInternalActiveTrackingObjectId(id)
			}
		},
		[onActiveTrackingObjectChange],
	)

	// Helper function to get tracking object info
	const getTrackingObject = useCallback(
		(id: string): TrackingObject | null => {
			return localTrackingObjects.find((obj) => obj.id === id) || null
		},
		[localTrackingObjects],
	)

	// Helper function to get color for a tracking object
	const getTrackingObjectColor = useCallback(
		(id: string): string => {
			const obj = getTrackingObject(id)
			if (obj?.color) return obj.color
			// Generate color from ID hash if no color set
			const hash = id.split('').reduce((acc, char) => {
				return char.charCodeAt(0) + ((acc << 5) - acc)
			}, 0)
			const hue = Math.abs(hash) % 360
			return `hsl(${hue}, 70%, 50%)`
		},
		[getTrackingObject],
	)

	// Helper function to get name for a tracking object
	const getTrackingObjectName = useCallback(
		(id: string): string => {
			const obj = getTrackingObject(id)
			return obj?.name || `Object ${id.slice(-6)}`
		},
		[getTrackingObject],
	)
	// Trajectory path visibility toggle
	const [showTrajectoryPaths, setShowTrajectoryPaths] = useState(true)
	// Scale calibration state
	const [isScaleCalibrationMode, setIsScaleCalibrationMode] = useState(false)

	// Sync external scale calibration mode
	useEffect(() => {
		if (isScaleCalibrationModeExternal !== undefined) {
			setIsScaleCalibrationMode(isScaleCalibrationModeExternal)
		}
	}, [isScaleCalibrationModeExternal])

	// Notify parent of scale calibration mode changes
	useEffect(() => {
		onScaleCalibrationModeChange?.(isScaleCalibrationMode)
	}, [isScaleCalibrationMode, onScaleCalibrationModeChange])
	const [scaleStartPoint, setScaleStartPoint] = useState<{
		x: number
		y: number
	} | null>(null)
	const [scaleEndPoint, setScaleEndPoint] = useState<{
		x: number
		y: number
	} | null>(null)
	const [distanceMeters, setDistanceMeters] = useState<string>('')
	const [scale, setScale] = useState<Scale | null>(initialScale)

	const handlePlayPause = useCallback(() => {
		const video = videoRef.current
		if (!video) return

		// If at the end of the video, restart from beginning
		if (currentTime >= duration && duration > 0) {
			video.currentTime = 0
			setCurrentTime(0)
			setIsEnded(false)
			video.play().catch((error) => {
				console.error('Error playing video:', error)
				setIsPlaying(false)
			})
			return
		}

		if (video.paused) {
			video.play().catch((error) => {
				// Handle play promise rejection (e.g., autoplay blocked)
				console.error('Error playing video:', error)
				setIsPlaying(false)
			})
			// Don't set isPlaying here - let the onPlay event handler do it
		} else {
			video.pause()
			// Don't set isPlaying here - let the onPause event handler do it
		}
	}, [currentTime, duration])

	const handleSeek = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const video = videoRef.current
			if (!video) return
			const newTime = parseFloat(e.target.value)
			isSeekingRef.current = true
			seekTimeRef.current = newTime
			setSeekTime(newTime)
			// Update state immediately for smooth UI
			setCurrentTime(newTime)
			// Update video currentTime (may take a moment to seek)
			video.currentTime = newTime
			// Reset ended state if seeking away from the end
			if (isEnded && newTime < video.duration) {
				setIsEnded(false)
			}
		},
		[isEnded],
	)

	const handleSeekInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			// Update UI immediately while dragging for smooth experience
			const newTime = parseFloat(e.target.value)
			seekTimeRef.current = newTime
			setSeekTime(newTime)
			setCurrentTime(newTime)
		},
		[],
	)

	const handleSeekStart = useCallback(() => {
		isSeekingRef.current = true
		setIsSeeking(true)
		seekTimeRef.current = currentTime
		setSeekTime(currentTime)
	}, [currentTime])

	const handleSeekEnd = useCallback(() => {
		isSeekingRef.current = false
		setIsSeeking(false)
		seekTimeRef.current = null
		setSeekTime(null)
	}, [])

	const handleTimeUpdate = useCallback(() => {
		// Don't update if user is currently seeking
		if (isSeekingRef.current) return
		const video = videoRef.current
		if (!video) return
		setCurrentTime(video.currentTime)
	}, [])

	const handleLoadedMetadata = useCallback(() => {
		const video = videoRef.current
		if (!video) {
			console.log('handleLoadedMetadata: video ref is null')
			return
		}
		const duration = video.duration
		if (isFinite(duration) && duration > 0) {
			setDuration(duration)
		}
		// Don't set frame here - let handleTimeUpdate handle it to avoid duplicates
	}, [])

	const handleCanPlay = useCallback(() => {
		// Fallback: try to get duration when video can play
		const video = videoRef.current
		if (!video) return
		const duration = video.duration
		if (isFinite(duration) && duration > 0 && duration !== Infinity) {
			setDuration(duration)
		}
	}, [])

	const handleLoadedData = useCallback(() => {
		// Another fallback: try to get duration when data is loaded
		const video = videoRef.current
		if (!video) return
		const duration = video.duration
		if (isFinite(duration) && duration > 0 && duration !== Infinity) {
			setDuration(duration)
		}
	}, [])

	const handleError = useCallback(
		(e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
			const video = e.currentTarget
			console.error('Video error:', video.error)
			if (video.error) {
				console.error('Error code:', video.error.code)
				console.error('Error message:', video.error.message)
			}
		},
		[],
	)

	const goToPreviousFrame = useCallback(() => {
		const video = videoRef.current
		if (!video) return
		const fps = 30
		const frameTime = 1 / fps
		const newTime = Math.max(0, video.currentTime - frameTime)
		video.currentTime = newTime
		setCurrentTime(newTime)
		setIsPlaying(false)
		video.pause()
	}, [])

	const goToNextFrame = useCallback(() => {
		const video = videoRef.current
		if (!video) return
		const fps = 30
		const frameTime = 1 / fps
		const newTime = Math.min(video.duration, video.currentTime + frameTime)
		video.currentTime = newTime
		setCurrentTime(newTime)
		setIsPlaying(false)
		video.pause()
	}, [])

	const seekBackward = useCallback(() => {
		const video = videoRef.current
		if (!video) return
		const seekAmount = 3 // seconds
		const newTime = Math.max(0, video.currentTime - seekAmount)
		video.currentTime = newTime
		setCurrentTime(newTime)
		setIsPlaying(false)
		video.pause()
	}, [])

	const seekForward = useCallback(() => {
		const video = videoRef.current
		if (!video) return
		const seekAmount = 3 // seconds
		const newTime = Math.min(video.duration, video.currentTime + seekAmount)
		video.currentTime = newTime
		setCurrentTime(newTime)
		setIsPlaying(false)
		video.pause()
	}, [])

	const handlePlay = useCallback(() => {
		setIsPlaying(true)
		// Reset ended state when video starts playing
		if (isEnded) {
			setIsEnded(false)
		}
	}, [isEnded])

	const handlePause = useCallback(() => {
		setIsPlaying(false)
	}, [])

	const handleEnded = useCallback(() => {
		setIsPlaying(false)
		setIsEnded(true)
	}, [])

	// Effect to check duration when src changes or component mounts
	useEffect(() => {
		const video = videoRef.current
		if (!video) return

		// Function to check and set duration
		const checkDuration = () => {
			const duration = video.duration
			if (isFinite(duration) && duration > 0 && duration !== Infinity) {
				setDuration(duration)
			}
		}

		// Check immediately if video is already loaded
		if (video.readyState >= 1) {
			checkDuration()
		}

		// Set up interval to periodically check duration (fallback)
		const interval = setInterval(() => {
			checkDuration()
		}, 500)

		// Cleanup
		return () => clearInterval(interval)
	}, [src])

	// Update local tracking points when prop changes
	// Use a ref to track previous value to avoid infinite loops
	const prevTrackingPointsRef = useRef<string>('')
	useEffect(() => {
		const newStr = JSON.stringify(trackingPoints)
		if (prevTrackingPointsRef.current !== newStr) {
			prevTrackingPointsRef.current = newStr
			setLocalTrackingPoints(trackingPoints)
		}
	}, [trackingPoints])

	// Convert canvas coordinates to video coordinates
	const convertCanvasToVideoCoords = useCallback(
		(canvasX: number, canvasY: number) => {
			const canvas = canvasRef.current
			const video = videoRef.current
			if (!canvas || !video) return null

			const videoAspect = video.videoWidth / video.videoHeight
			const canvasAspect = canvas.width / canvas.height

			let x: number
			let y: number

			if (videoAspect > canvasAspect) {
				// Video is wider - letterboxing on top/bottom
				const scale = canvas.width / video.videoWidth
				const scaledHeight = video.videoHeight * scale
				const offsetY = (canvas.height - scaledHeight) / 2
				x = canvasX / scale
				y = (canvasY - offsetY) / scale
			} else {
				// Video is taller - letterboxing on left/right
				const scale = canvas.height / video.videoHeight
				const scaledWidth = video.videoWidth * scale
				const offsetX = (canvas.width - scaledWidth) / 2
				x = (canvasX - offsetX) / scale
				y = canvasY / scale
			}

			// Ensure coordinates are within video bounds
			x = Math.max(0, Math.min(x, video.videoWidth))
			y = Math.max(0, Math.min(y, video.videoHeight))

			return { x, y }
		},
		[],
	)

	// Handle canvas click to place tracking point or draw scale line
	const handleCanvasClick = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			if (!videoId || !canvasRef.current || !videoRef.current) return

			// Handle scale calibration mode
			if (isScaleCalibrationMode) {
				const canvas = canvasRef.current
				const rect = canvas.getBoundingClientRect()
				const canvasX = e.clientX - rect.left
				const canvasY = e.clientY - rect.top

				const coords = convertCanvasToVideoCoords(canvasX, canvasY)
				if (!coords) return

				if (!scaleStartPoint) {
					// First click - set start point
					setScaleStartPoint(coords)
				} else if (!scaleEndPoint) {
					// Second click - set end point
					setScaleEndPoint(coords)
				} else {
					// Reset and start over
					setScaleStartPoint(coords)
					setScaleEndPoint(null)
				}
				return
			}

			// Handle tracking point placement (existing logic)
			const canvas = canvasRef.current
			if (!canvas) return

			const rect = canvas.getBoundingClientRect()

			// Get click position relative to canvas
			const canvasX = e.clientX - rect.left
			const canvasY = e.clientY - rect.top

			const coords = convertCanvasToVideoCoords(canvasX, canvasY)
			if (!coords) return
			const { x, y } = coords

			// Calculate current frame (assuming 30 fps)
			const fps = 30
			const frame = Math.floor(currentTime * fps)

			// Check if there's an existing point nearby (within 50 pixels) in a previous frame
			// to continue tracking the same object
			let trackingObjectIdToUse: string | null = null
			if (activeTrackingObjectId) {
				// Use the active tracking object
				trackingObjectIdToUse = activeTrackingObjectId
			} else {
				// Try to find a nearby point from a previous frame to continue tracking
				const nearbyPoint = localTrackingPoints.find((point) => {
					const distance = Math.sqrt(
						Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2),
					)
					return distance < 50 && point.frame < frame
				})
				if (nearbyPoint) {
					trackingObjectIdToUse = nearbyPoint.trackingObjectId
					setActiveTrackingObjectId(nearbyPoint.trackingObjectId)
				}
			}

			// Create tracking point locally for immediate feedback
			const tempTrackingObjectId = trackingObjectIdToUse || `temp-${Date.now()}`
			const newPoint: TrackingPoint = {
				id: `temp-${Date.now()}`,
				frame,
				x,
				y,
				trackingObjectId: tempTrackingObjectId,
			}

			// Update local state: replace existing point for this object at this frame, or add new one
			setLocalTrackingPoints((prev) => {
				const filtered = prev.filter(
					(p) =>
						!(p.trackingObjectId === tempTrackingObjectId && p.frame === frame),
				)
				return [...filtered, newPoint]
			})

			// Save to server
			const formData = new FormData()
			formData.append('intent', 'create-tracking-point')
			formData.append('videoId', videoId)
			formData.append('frame', frame.toString())
			formData.append('x', x.toString())
			formData.append('y', y.toString())
			if (trackingObjectIdToUse) {
				formData.append('trackingObjectId', trackingObjectIdToUse)
			}

			if (videoId && fetcher) {
				void fetcher.submit(formData, {
					method: 'POST',
				})
			}
		},
		[
			videoId,
			currentTime,
			fetcher,
			activeTrackingObjectId,
			localTrackingPoints,
			isScaleCalibrationMode,
			convertCanvasToVideoCoords,
			scaleStartPoint,
			scaleEndPoint,
			setActiveTrackingObjectId,
		],
	)

	// Handle saving scale calibration
	const handleSaveScale = useCallback(() => {
		if (!videoId || !scaleStartPoint || !scaleEndPoint || !distanceMeters)
			return

		const distance = parseFloat(distanceMeters)
		if (isNaN(distance) || distance <= 0) return

		const formData = new FormData()
		formData.append('intent', 'save-scale')
		formData.append('videoId', videoId)
		formData.append('startX', scaleStartPoint.x.toString())
		formData.append('startY', scaleStartPoint.y.toString())
		formData.append('endX', scaleEndPoint.x.toString())
		formData.append('endY', scaleEndPoint.y.toString())
		formData.append('distanceMeters', distance.toString())

		if (fetcher) {
			void fetcher.submit(formData, {
				method: 'POST',
			})
			// Reset scale calibration state
			setScaleStartPoint(null)
			setScaleEndPoint(null)
			setDistanceMeters('')
			// Exit scale calibration mode - will be synced with external state
			setIsScaleCalibrationMode(false)
		}
	}, [videoId, scaleStartPoint, scaleEndPoint, distanceMeters, fetcher])

	// Reset scale calibration mode
	const handleCancelScale = useCallback(() => {
		setScaleStartPoint(null)
		setScaleEndPoint(null)
		setDistanceMeters('')
		setIsScaleCalibrationMode(false)
	}, [])

	// Update scale when fetcher returns new data
	useEffect(() => {
		if (fetcher?.data?.success) {
			// Handle scale save response
			if (fetcher.data?.scale) {
				const newScale = fetcher.data.scale as Scale
				setScale(newScale)
				// Reset scale calibration state
				setScaleStartPoint(null)
				setScaleEndPoint(null)
				setDistanceMeters('')
				// Exit scale calibration mode - will sync with external state
				setIsScaleCalibrationMode(false)
			}
		}
	}, [fetcher?.data, onScaleCalibrationModeChange])

	// Draw tracking points on canvas
	useEffect(() => {
		const canvas = canvasRef.current
		const video = videoRef.current
		if (!canvas || !video) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		// Don't draw if video dimensions aren't loaded yet
		if (video.videoWidth === 0 || video.videoHeight === 0) return

		// Set canvas size to match video display size
		const updateCanvasSize = () => {
			const rect = video.getBoundingClientRect()
			canvas.width = rect.width
			canvas.height = rect.height
		}

		updateCanvasSize()

		// Redraw when video size changes or tracking points change
		const drawPoints = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height)

			// Don't draw if video dimensions aren't loaded yet
			if (video.videoWidth === 0 || video.videoHeight === 0) return

			// Calculate scaling factor to convert video coordinates to canvas coordinates
			const videoAspect = video.videoWidth / video.videoHeight
			const canvasAspect = canvas.width / canvas.height

			let canvasScale: number
			let offsetX = 0
			let offsetY = 0

			if (videoAspect > canvasAspect) {
				// Video is wider - letterboxing on top/bottom
				canvasScale = canvas.width / video.videoWidth
				const scaledHeight = video.videoHeight * canvasScale
				offsetY = (canvas.height - scaledHeight) / 2
			} else {
				// Video is taller - letterboxing on left/right
				canvasScale = canvas.height / video.videoHeight
				const scaledWidth = video.videoWidth * canvasScale
				offsetX = (canvas.width - scaledWidth) / 2
			}

			// Draw scale line if it exists
			if (scale) {
				ctx.strokeStyle = '#00ff00'
				ctx.lineWidth = 2
				ctx.beginPath()
				const canvasStartX = scale.startX * canvasScale + offsetX
				const canvasStartY = scale.startY * canvasScale + offsetY
				const canvasEndX = scale.endX * canvasScale + offsetX
				const canvasEndY = scale.endY * canvasScale + offsetY
				ctx.moveTo(canvasStartX, canvasStartY)
				ctx.lineTo(canvasEndX, canvasEndY)
				ctx.stroke()
				// Draw endpoints
				ctx.fillStyle = '#00ff00'
				ctx.beginPath()
				ctx.arc(canvasStartX, canvasStartY, 4, 0, 2 * Math.PI)
				ctx.fill()
				ctx.beginPath()
				ctx.arc(canvasEndX, canvasEndY, 4, 0, 2 * Math.PI)
				ctx.fill()
			}

			// Draw scale line being drawn (if in calibration mode)
			if (isScaleCalibrationMode && scaleStartPoint) {
				ctx.strokeStyle = '#00ff00'
				ctx.lineWidth = 2
				ctx.setLineDash([5, 5]) // Dashed line for in-progress
				ctx.beginPath()
				const canvasStartX = scaleStartPoint.x * canvasScale + offsetX
				const canvasStartY = scaleStartPoint.y * canvasScale + offsetY
				ctx.moveTo(canvasStartX, canvasStartY)
				if (scaleEndPoint) {
					const canvasEndX = scaleEndPoint.x * canvasScale + offsetX
					const canvasEndY = scaleEndPoint.y * canvasScale + offsetY
					ctx.lineTo(canvasEndX, canvasEndY)
				} else {
					// Draw line from start to current mouse position (if available)
					ctx.lineTo(canvasStartX + 50, canvasStartY + 50) // Placeholder
				}
				ctx.stroke()
				ctx.setLineDash([]) // Reset dash
				// Draw start point
				ctx.fillStyle = '#00ff00'
				ctx.beginPath()
				ctx.arc(canvasStartX, canvasStartY, 4, 0, 2 * Math.PI)
				ctx.fill()
				if (scaleEndPoint) {
					const canvasEndX = scaleEndPoint.x * canvasScale + offsetX
					const canvasEndY = scaleEndPoint.y * canvasScale + offsetY
					ctx.beginPath()
					ctx.arc(canvasEndX, canvasEndY, 4, 0, 2 * Math.PI)
					ctx.fill()
				}
			}

			// Draw points for the active tracking object across all frames
			// If no active object, show all points for the current frame
			const fps = 30
			const frame = Math.floor(currentTime * fps)

			let pointsToDraw: TrackingPoint[]
			if (activeTrackingObjectId) {
				// Show all points for the active tracking object
				pointsToDraw = localTrackingPoints.filter(
					(point) => point.trackingObjectId === activeTrackingObjectId,
				)
			} else {
				// Show only points for the current frame
				pointsToDraw = localTrackingPoints.filter(
					(point) => point.frame === frame,
				)
			}

			if (pointsToDraw.length === 0) return

			// Draw trajectory paths for all tracking objects when toggle is enabled
			if (showTrajectoryPaths && localTrackingPoints.length > 0) {
				// Group points by trackingObjectId
				const pointsByObject = new Map<string, TrackingPoint[]>()
				localTrackingPoints.forEach((point) => {
					const existing = pointsByObject.get(point.trackingObjectId) || []
					pointsByObject.set(point.trackingObjectId, [...existing, point])
				})

				// Draw trajectory line for each tracking object
				pointsByObject.forEach((objectPoints, trackingObjectId) => {
					if (objectPoints.length < 2) return // Need at least 2 points for a line

					// Use tracking object color if available, otherwise generate from ID
					const trajectoryColor = getTrackingObjectColor(trackingObjectId)

					ctx.strokeStyle = trajectoryColor
					ctx.lineWidth = 2
					ctx.beginPath()
					const sortedPoints = [...objectPoints].sort(
						(a, b) => a.frame - b.frame,
					)
					sortedPoints.forEach((point, index) => {
						const canvasX = point.x * canvasScale + offsetX
						const canvasY = point.y * canvasScale + offsetY
						if (index === 0) {
							ctx.moveTo(canvasX, canvasY)
						} else {
							ctx.lineTo(canvasX, canvasY)
						}
					})
					ctx.stroke()
				})
			}

			pointsToDraw.forEach((point) => {
				// Convert video coordinates to canvas coordinates
				const canvasX = point.x * canvasScale + offsetX
				const canvasY = point.y * canvasScale + offsetY

				// Use different color/style for current frame point
				const isCurrentFrame = point.frame === frame
				const pointColor = isCurrentFrame ? '#ff0000' : '#ff6666'
				const pointSize = isCurrentFrame ? 6 : 4

				// Draw point
				ctx.fillStyle = pointColor
				ctx.beginPath()
				ctx.arc(canvasX, canvasY, pointSize, 0, 2 * Math.PI)
				ctx.fill()

				// Draw crosshair for current frame point
				if (isCurrentFrame) {
					ctx.strokeStyle = pointColor
					ctx.lineWidth = 1
					ctx.beginPath()
					ctx.moveTo(canvasX - 10, canvasY)
					ctx.lineTo(canvasX + 10, canvasY)
					ctx.moveTo(canvasX, canvasY - 10)
					ctx.lineTo(canvasX, canvasY + 10)
					ctx.stroke()
				}
			})
		}

		drawPoints()

		// Update canvas size on video resize
		const resizeObserver = new ResizeObserver(() => {
			updateCanvasSize()
			drawPoints()
		})

		resizeObserver.observe(video)

		// Also redraw when video metadata loads (to get video dimensions)
		const handleVideoLoaded = () => {
			updateCanvasSize()
			drawPoints()
		}

		video.addEventListener('loadedmetadata', handleVideoLoaded)

		return () => {
			resizeObserver.disconnect()
			video.removeEventListener('loadedmetadata', handleVideoLoaded)
		}
	}, [
		currentTime,
		localTrackingPoints,
		activeTrackingObjectId,
		scale,
		isScaleCalibrationMode,
		scaleStartPoint,
		scaleEndPoint,
		showTrajectoryPaths,
		getTrackingObjectColor,
	])

	// Sync local tracking objects when prop changes
	useEffect(() => {
		setLocalTrackingObjects(trackingObjects)
	}, [trackingObjects])

	// Update local tracking points when fetcher returns new data
	useEffect(() => {
		if (fetcher?.data?.success && fetcher.data?.trackingPoint) {
			const newPoint = fetcher.data.trackingPoint as TrackingPoint
			setLocalTrackingPoints((prev) => {
				// Replace temp point with real one if it exists (match by trackingObjectId and frame)
				const tempIndex = prev.findIndex(
					(p) =>
						p.id.startsWith('temp-') &&
						p.trackingObjectId === newPoint.trackingObjectId &&
						p.frame === newPoint.frame,
				)
				if (tempIndex >= 0) {
					const updated = [...prev]
					updated[tempIndex] = newPoint
					return updated
				}
				// Check if point already exists for this object at this frame and replace it
				const existingIndex = prev.findIndex(
					(p) =>
						p.trackingObjectId === newPoint.trackingObjectId &&
						p.frame === newPoint.frame,
				)
				if (existingIndex >= 0) {
					const updated = [...prev]
					updated[existingIndex] = newPoint
					return updated
				}
				// Otherwise add new point
				return [...prev, newPoint]
			})
			// Set active tracking object if not already set
			if (!activeTrackingObjectId) {
				setActiveTrackingObjectId(newPoint.trackingObjectId)
			}
		}
	}, [fetcher?.data, activeTrackingObjectId, setActiveTrackingObjectId])

	return (
		<div className={className}>
			<div className="relative" ref={containerRef}>
				<video
					ref={videoRef}
					src={src}
					className="w-full"
					preload="metadata"
					onTimeUpdate={handleTimeUpdate}
					onLoadedMetadata={handleLoadedMetadata}
					onLoadedData={handleLoadedData}
					onCanPlay={handleCanPlay}
					onPlay={handlePlay}
					onPause={handlePause}
					onEnded={handleEnded}
					onError={handleError}
					aria-label="Video content"
				/>
				{videoId && (
					<canvas
						ref={canvasRef}
						className="absolute top-0 left-0 cursor-crosshair"
						onClick={handleCanvasClick}
						style={{ pointerEvents: 'auto' }}
						aria-label={
							isScaleCalibrationMode
								? 'Scale calibration canvas - click to draw scale line'
								: 'Tracking canvas - click to place tracking points'
						}
					/>
				)}

				{/* Scale Input Overlay - shown when both points are set */}
				{isScaleCalibrationMode && scaleStartPoint && scaleEndPoint && (
					<ScaleInputOverlay
						startPoint={scaleStartPoint}
						endPoint={scaleEndPoint}
						containerRef={
							containerRef as React.RefObject<HTMLDivElement | null>
						}
						canvasRef={canvasRef as React.RefObject<HTMLCanvasElement | null>}
						value={distanceMeters}
						onChange={setDistanceMeters}
						onSave={handleSaveScale}
						onCancel={handleCancelScale}
					/>
				)}
			</div>

			{/* Controls Below Video */}
			<div className="mt-4 space-y-2 px-4 pb-4">
				{/* Seek bar */}
				<div className="group/scrubber mb-3 flex items-center gap-3">
					<span className="w-12 text-right font-mono text-[10px] text-slate-600">
						{formatTime(currentTime)}
					</span>
					<div className="relative flex flex-1 cursor-pointer items-center">
						{/* Progress bar background */}
						<div
							className="absolute h-1 w-full rounded-full transition-all group-hover/scrubber:h-1.5"
							style={{
								backgroundColor: 'var(--player-progress-bg)',
							}}
						/>
						{/* Timeline markers for tracked frames */}
						{localTrackingPoints.length > 0 &&
							duration > 0 &&
							Array.from(new Set(localTrackingPoints.map((p) => p.frame))).map(
								(frame) => {
									const frameTime = frame / 30 // Assuming 30fps
									const position = (frameTime / duration) * 100
									return (
										<div
											key={frame}
											className="absolute top-0 h-1 w-0.5 rounded-sm opacity-60 transition-all hover:h-3 hover:bg-[var(--data-select)] hover:opacity-100"
											style={{
												left: `${position}%`,
												backgroundColor: 'var(--data-position)',
												transform: 'translateX(-50%)',
											}}
											title={`Frame ${frame + 1}`}
										/>
									)
								},
							)}
						{/* Progress bar filled portion - green when tracking, primary when not */}
						<div
							className="absolute h-1 rounded-full transition-all group-hover/scrubber:h-1.5"
							style={{
								width: `${
									duration ? ((seekTime ?? currentTime) / duration) * 100 : 0
								}%`,
								backgroundColor:
									localTrackingPoints.length > 0
										? 'var(--data-position)'
										: 'var(--primary)',
								// No transition for width during playback - update immediately for smoothness
								// Only transition background color changes
								transition: isSeeking
									? 'none'
									: isPlaying
										? 'background-color 0.2s ease'
										: 'width 0.05s linear, background-color 0.2s ease',
							}}
						/>
						<input
							type="range"
							min="0"
							max={duration || 0}
							value={seekTime ?? currentTime}
							onChange={handleSeek}
							onInput={handleSeekInput}
							onMouseDown={handleSeekStart}
							onMouseUp={handleSeekEnd}
							onTouchStart={handleSeekStart}
							onTouchEnd={handleSeekEnd}
							step="0.0001"
							className="absolute z-10 h-3 w-full cursor-pointer appearance-none bg-transparent opacity-0"
							aria-label="Video seek"
						/>
						{/* Scrubber handle */}
						<div
							className="pointer-events-none absolute h-3 w-3 rounded-full border-2 bg-white shadow transition-all group-hover/scrubber:scale-[1.3] group-hover/scrubber:border-[var(--data-select)] group-hover/scrubber:shadow-[0_0_0_4px_var(--data-select)/0.2]"
							style={{
								left: `${
									duration ? ((seekTime ?? currentTime) / duration) * 100 : 0
								}%`,
								transform: 'translateX(-50%)',
								borderColor:
									localTrackingPoints.length > 0
										? 'var(--data-position)'
										: 'var(--primary)',
								// No transition for position during playback - update immediately for smoothness
								// Only transition border color changes
								transition: isSeeking
									? 'none'
									: isPlaying
										? 'border-color 0.2s ease'
										: 'left 0.05s linear, border-color 0.2s ease',
							}}
						/>
					</div>
					<span className="w-12 font-mono text-[10px] text-slate-600">
						{formatTime(duration)}
					</span>
				</div>

				{/* Controls */}
				<div className="grid grid-cols-3 items-center gap-4">
					{/* Left spacer or tracking indicator */}
					<div className="flex items-center gap-2">
						{activeTrackingObjectId && (
							<div
								className="flex items-center gap-2 rounded-2xl px-3 py-1.5"
								style={{
									backgroundColor: getTrackingObjectColor(
										activeTrackingObjectId,
									),
									color: 'white',
								}}
							>
								<div
									className="h-2 w-2 rounded-full"
									style={{
										backgroundColor: 'white',
										animation: 'pulse 2s ease-in-out infinite',
									}}
								/>
								<span className="text-xs font-medium">
									Tracking: {getTrackingObjectName(activeTrackingObjectId)}
								</span>
							</div>
						)}
						{/* Trajectory path toggle */}
						{localTrackingPoints.length > 0 && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setShowTrajectoryPaths(!showTrajectoryPaths)}
								aria-label={
									showTrajectoryPaths
										? 'Hide trajectory paths'
										: 'Show trajectory paths'
								}
								title={
									showTrajectoryPaths
										? 'Hide trajectory paths'
										: 'Show trajectory paths'
								}
								className={`h-8 rounded-lg border px-3 text-xs transition-all hover:shadow-sm ${
									showTrajectoryPaths
										? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
										: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
								}`}
							>
								<Icon name="crosshair-2" className="mr-1.5 h-3.5 w-3.5" />
								{showTrajectoryPaths ? 'Hide Path' : 'Show Path'}
							</Button>
						)}
					</div>
					{/* Centered controls */}
					<div className="flex items-center justify-center gap-1">
						{/* Double left: 3 seconds backward */}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={seekBackward}
							aria-label="Seek backward 3 seconds"
							title="Seek backward 3 seconds"
							className="cursor-pointer rounded-full bg-white text-[var(--player-bg)] transition-all hover:bg-[var(--primary)] hover:text-white hover:shadow-[0_0_0_3px_var(--primary)/0.2]"
						>
							<Icon name="double-arrow-left" className="h-6 w-6" />
						</Button>
						{/* Single left: Previous frame */}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={goToPreviousFrame}
							aria-label="Previous frame"
							title="Previous frame"
							className="cursor-pointer rounded-full bg-white text-[var(--player-bg)] transition-all hover:bg-[var(--primary)] hover:text-white hover:shadow-[0_0_0_3px_var(--primary)/0.2]"
						>
							<Icon name="chevron-left" className="h-6 w-6" />
						</Button>
						{/* Play/Pause/Restart button */}
						<Button
							type="button"
							variant="default"
							size="icon"
							className="cursor-pointer rounded-full bg-white text-[var(--player-bg)] transition-all hover:bg-[var(--primary)] hover:text-white hover:shadow-[0_0_0_3px_var(--primary)/0.2] active:bg-[var(--primary-hover)]"
							onClick={handlePlayPause}
							aria-label={
								currentTime >= duration && duration > 0
									? 'Restart'
									: isPlaying
										? 'Pause'
										: 'Play'
							}
							title={
								currentTime >= duration && duration > 0
									? 'Restart'
									: isPlaying
										? 'Pause'
										: 'Play'
							}
						>
							{currentTime >= duration && duration > 0 ? (
								<Icon name="reload" />
							) : isPlaying ? (
								<Icon name="pause" />
							) : (
								<Icon name="play" className="fill-current" />
							)}
						</Button>
						{/* Single right: Next frame */}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={goToNextFrame}
							aria-label="Next frame"
							title="Next frame"
							className="cursor-pointer rounded-full bg-white text-[var(--player-bg)] transition-all hover:bg-[var(--primary)] hover:text-white hover:shadow-[0_0_0_3px_var(--primary)/0.2]"
						>
							<Icon name="chevron-right" className="h-6 w-6" />
						</Button>
						{/* Double right: 3 seconds forward */}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={seekForward}
							aria-label="Seek forward 3 seconds"
							title="Seek forward 3 seconds"
							className="cursor-pointer rounded-full bg-white text-[var(--player-bg)] transition-all hover:bg-[var(--primary)] hover:text-white hover:shadow-[0_0_0_3px_var(--primary)/0.2]"
						>
							<Icon name="double-arrow-right" className="h-6 w-6" />
						</Button>
					</div>
					{/* Frame display on the right */}
					<div className="flex items-center justify-end gap-2 pl-4">
						<div className="flex flex-col items-center">
							<span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">
								Frame
							</span>
							<div
								className="flex items-baseline gap-1 rounded px-2 py-1 font-mono text-xs"
								style={{
									backgroundColor: 'var(--player-progress-bg)',
									color: 'var(--muted-foreground)',
								}}
							>
								<span className="font-bold text-white">
									{Math.ceil(currentTime * 30) + 1}
								</span>
								<span className="text-slate-500">
									/ {duration ? Math.ceil(duration * 30) + 1 : 0}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

// Scale Input Overlay Component - shows input field mid-line when both points are set
function ScaleInputOverlay({
	startPoint,
	endPoint,
	containerRef,
	canvasRef,
	value,
	onChange,
	onSave,
	onCancel,
}: {
	startPoint: { x: number; y: number }
	endPoint: { x: number; y: number }
	containerRef: React.RefObject<HTMLDivElement | null>
	canvasRef: React.RefObject<HTMLCanvasElement | null>
	value: string
	onChange: (value: string) => void
	onSave: () => void
	onCancel: () => void
}) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [position, setPosition] = useState({ x: 0, y: 0 })

	// Calculate position for input field (mid-point of the line)
	useEffect(() => {
		if (!containerRef.current || !canvasRef.current) return

		const canvas = canvasRef.current
		const video = containerRef.current.querySelector('video')
		if (!video) return

		// Use the same logic as canvas drawing
		const videoAspect = video.videoWidth / video.videoHeight
		const canvasAspect = canvas.width / canvas.height

		let canvasScale: number
		let offsetX = 0
		let offsetY = 0

		if (videoAspect > canvasAspect) {
			// Video is wider - letterboxing on top/bottom
			canvasScale = canvas.width / video.videoWidth
			const scaledHeight = video.videoHeight * canvasScale
			offsetY = (canvas.height - scaledHeight) / 2
		} else {
			// Video is taller - letterboxing on left/right
			canvasScale = canvas.height / video.videoHeight
			const scaledWidth = video.videoWidth * canvasScale
			offsetX = (canvas.width - scaledWidth) / 2
		}

		// Mid-point of the scale line in video coordinates
		const midX = (startPoint.x + endPoint.x) / 2
		const midY = (startPoint.y + endPoint.y) / 2

		// Convert to canvas coordinates
		const canvasX = midX * canvasScale + offsetX
		const canvasY = midY * canvasScale + offsetY

		// Get canvas position relative to container
		const containerRect = containerRef.current.getBoundingClientRect()
		const canvasRect = canvas.getBoundingClientRect()

		setPosition({
			x: canvasX + (canvasRect.left - containerRect.left),
			y: canvasY + (canvasRect.top - containerRect.top),
		})
	}, [startPoint, endPoint, containerRef, canvasRef])

	// Focus input when it appears
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus()
		}
	}, [])

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			if (value && parseFloat(value) > 0) {
				onSave()
			}
		} else if (e.key === 'Escape') {
			e.preventDefault()
			onCancel()
		}
	}

	return (
		<div
			className="absolute z-20"
			style={{
				left: `${position.x}px`,
				top: `${position.y}px`,
				transform: 'translate(-50%, -50%)',
			}}
		>
			<div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white p-2 shadow-lg">
				<Input
					ref={inputRef}
					type="number"
					step="0.01"
					min="0.01"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Distance (m)"
					className="h-8 w-24 text-sm"
				/>
				<span className="text-xs text-slate-500">m</span>
			</div>
		</div>
	)
}
