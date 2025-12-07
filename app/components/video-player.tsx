import { useRef, useState, useCallback, useEffect } from 'react'
import { useFetcher } from 'react-router'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'

interface TrackingPoint {
	id: string
	frame: number
	x: number
	y: number
	trackingObjectId: string
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
	scale?: Scale | null
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
	scale: initialScale = null,
}: VideoPlayerProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const isSeekingRef = useRef(false)
	// useFetcher must be called unconditionally (React hook rule)
	// We'll only use it when videoId is provided
	const fetcher = useFetcher()
	const [isPlaying, setIsPlaying] = useState(false)
	const [isEnded, setIsEnded] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [currentFrame, setCurrentFrame] = useState(0)
	const [localTrackingPoints, setLocalTrackingPoints] =
		useState<TrackingPoint[]>(trackingPoints)
	const [activeTrackingObjectId, setActiveTrackingObjectId] = useState<
		string | null
	>(null)
	// Scale calibration state
	const [isScaleCalibrationMode, setIsScaleCalibrationMode] = useState(false)
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
			// Update state immediately for smooth UI
			setCurrentTime(newTime)
			// Update video currentTime (may take a moment to seek)
			video.currentTime = newTime
			// Reset ended state if seeking away from the end
			if (isEnded && newTime < video.duration) {
				setIsEnded(false)
			}
			// Calculate current frame (assuming 30 fps, can be adjusted)
			const fps = 30
			setCurrentFrame(Math.floor(newTime * fps))
		},
		[isEnded],
	)

	const handleSeekInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			// Update UI immediately while dragging for smooth experience
			const newTime = parseFloat(e.target.value)
			setCurrentTime(newTime)
			// Calculate current frame (assuming 30 fps, can be adjusted)
			const fps = 30
			setCurrentFrame(Math.floor(newTime * fps))
		},
		[],
	)

	const handleSeekStart = useCallback(() => {
		isSeekingRef.current = true
	}, [])

	const handleSeekEnd = useCallback(() => {
		isSeekingRef.current = false
	}, [])

	const handleTimeUpdate = useCallback(() => {
		// Don't update if user is currently seeking
		if (isSeekingRef.current) return
		const video = videoRef.current
		if (!video) return
		setCurrentTime(video.currentTime)
		// Calculate current frame (assuming 30 fps, can be adjusted)
		const fps = 30
		setCurrentFrame(Math.floor(video.currentTime * fps))
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
		const fps = 30
		setCurrentFrame(Math.floor(video.currentTime * fps))
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
		// Calculate current frame (assuming 30 fps, can be adjusted)
		const fps = 30
		setCurrentFrame(Math.floor(newTime * fps))
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
		// Calculate current frame (assuming 30 fps, can be adjusted)
		const fps = 30
		setCurrentFrame(Math.floor(newTime * fps))
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
			// Immediately exit scale calibration mode so user can place tracking points
			// The useEffect will update the scale when the response comes back
			setIsScaleCalibrationMode(false)
			setScaleStartPoint(null)
			setScaleEndPoint(null)
			setDistanceMeters('')
		}
	}, [videoId, scaleStartPoint, scaleEndPoint, distanceMeters, fetcher])

	// Reset scale calibration mode
	const handleCancelScale = useCallback(() => {
		setIsScaleCalibrationMode(false)
		setScaleStartPoint(null)
		setScaleEndPoint(null)
		setDistanceMeters('')
	}, [])

	// Update scale when fetcher returns new data
	useEffect(() => {
		if (fetcher?.data?.success) {
			// Handle scale save response
			if (fetcher.data?.scale) {
				const newScale = fetcher.data.scale as Scale
				setScale(newScale)
				setIsScaleCalibrationMode(false)
				setScaleStartPoint(null)
				setScaleEndPoint(null)
				setDistanceMeters('')
			}
		}
	}, [fetcher?.data])

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

			// Draw trajectory line connecting points (if multiple points)
			if (pointsToDraw.length > 1 && activeTrackingObjectId) {
				ctx.strokeStyle = '#ff0000'
				ctx.lineWidth = 2
				ctx.beginPath()
				const sortedPoints = [...pointsToDraw].sort((a, b) => a.frame - b.frame)
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
	])

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
	}, [fetcher?.data, activeTrackingObjectId])

	return (
		<div className={className}>
			<div className="relative" ref={containerRef}>
				<video
					ref={videoRef}
					src={src}
					className="w-full rounded-lg"
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
						className="absolute top-0 left-0 cursor-crosshair rounded-lg"
						onClick={handleCanvasClick}
						style={{ pointerEvents: 'auto' }}
						aria-label={
							isScaleCalibrationMode
								? 'Scale calibration canvas - click to draw scale line'
								: 'Tracking canvas - click to place tracking points'
						}
					/>
				)}
			</div>

			<div className="mt-4 space-y-2">
				{/* Seek bar */}
				<input
					type="range"
					min="0"
					max={duration || 0}
					value={currentTime}
					onChange={handleSeek}
					onInput={handleSeekInput}
					onMouseDown={handleSeekStart}
					onMouseUp={handleSeekEnd}
					onTouchStart={handleSeekStart}
					onTouchEnd={handleSeekEnd}
					step="0.001"
					className="w-full"
					aria-label="Video seek"
				/>

				{/* Controls */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{/* Navigation buttons: [double left] [left] [play] [right] [double right] */}
						<div
							className="flex items-center gap-1"
							role="group"
							aria-label="Video navigation controls"
						>
							{/* Double left: 3 seconds backward */}
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={seekBackward}
								aria-label="Seek backward 3 seconds"
								title="Seek backward 3 seconds"
							>
								<Icon name="double-arrow-left" />
							</Button>

							{/* Single left: Previous frame */}
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={goToPreviousFrame}
								aria-label="Previous frame"
								title="Previous frame"
							>
								<Icon name="chevron-left" />
							</Button>

							{/* Play/Pause/Restart button in the middle */}
							<Button
								type="button"
								variant="outline"
								size="icon"
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
									<Icon name="play" />
								)}
							</Button>

							{/* Single right: Next frame */}
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={goToNextFrame}
								aria-label="Next frame"
								title="Next frame"
							>
								<Icon name="chevron-right" />
							</Button>

							{/* Double right: 3 seconds forward */}
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={seekForward}
								aria-label="Seek forward 3 seconds"
								title="Seek forward 3 seconds"
							>
								<Icon name="double-arrow-right" />
							</Button>
						</div>
					</div>

					{/* Time display */}
					<div className="text-muted-foreground text-sm">
						<span>{formatTime(currentTime)}</span>
						<span className="mx-1">/</span>
						<span>{formatTime(duration)}</span>
						<span className="ml-2 text-xs">(Frame: {currentFrame})</span>
					</div>
				</div>
			</div>

			{/* Export Tracking Data */}
			{videoId && (
				<div className="mt-4 rounded-lg border p-4">
					<div className="mb-3 flex items-center justify-between">
						<h3 className="text-sm font-semibold">Export Tracking Data</h3>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={localTrackingPoints.length === 0}
							onClick={async () => {
								if (!videoId) return
								const formData = new FormData()
								formData.append('intent', 'export-tracking-data')
								formData.append('videoId', videoId)

								try {
									const response = await fetch(`/videos/${videoId}`, {
										method: 'POST',
										body: formData,
									})

									if (!response.ok) {
										throw new Error('Export failed')
									}

									// Get filename from Content-Disposition header
									const contentDisposition = response.headers.get(
										'Content-Disposition',
									)
									let filename = 'tracking_data.csv'
									if (contentDisposition) {
										const filenameMatch =
											contentDisposition.match(/filename="(.+)"/)
										if (filenameMatch) {
											filename = filenameMatch[1]
										}
									}

									// Create blob and download
									const blob = await response.blob()
									const url = window.URL.createObjectURL(blob)
									const a = document.createElement('a')
									a.href = url
									a.download = filename
									document.body.appendChild(a)
									a.click()
									document.body.removeChild(a)
									window.URL.revokeObjectURL(url)
								} catch (error) {
									console.error('Export error:', error)
								}
							}}
						>
							<Icon name="download" className="mr-2" />
							Export CSV
						</Button>
					</div>
					{localTrackingPoints.length === 0 && (
						<p className="text-muted-foreground text-sm">
							No tracking points to export. Place tracking points on the video
							first.
						</p>
					)}
					{localTrackingPoints.length > 0 && (
						<p className="text-muted-foreground text-sm">
							Export {localTrackingPoints.length} tracking point
							{localTrackingPoints.length !== 1 ? 's' : ''} as CSV
							{scale ? ' (includes meter conversions)' : ''}.
						</p>
					)}
				</div>
			)}

			{/* Scale Calibration UI */}
			{videoId && (
				<div className="mt-4 rounded-lg border p-4">
					<div className="mb-3 flex items-center justify-between">
						<h3 className="text-sm font-semibold">Scale Calibration</h3>
						{!isScaleCalibrationMode && (
							<Button
								type="button"
								variant={scale ? 'outline' : 'default'}
								size="sm"
								onClick={() => setIsScaleCalibrationMode(true)}
							>
								{scale ? 'Update Scale' : 'Set Scale'}
							</Button>
						)}
					</div>

					{scale && !isScaleCalibrationMode && (
						<div className="text-muted-foreground space-y-1 text-sm">
							<div>Distance: {scale.distanceMeters} m</div>
							<div>Ratio: {scale.pixelsPerMeter.toFixed(2)} px/m</div>
						</div>
					)}

					{isScaleCalibrationMode && (
						<div className="space-y-3">
							<div className="text-muted-foreground text-sm">
								{!scaleStartPoint
									? 'Click on the video to set the start point of your scale line'
									: !scaleEndPoint
										? 'Click on the video to set the end point of your scale line'
										: 'Enter the real-world distance in meters'}
							</div>

							{scaleStartPoint && scaleEndPoint && (
								<div className="space-y-2">
									<Label htmlFor="distanceMeters">Distance (meters)</Label>
									<Input
										id="distanceMeters"
										type="number"
										step="0.01"
										min="0.01"
										value={distanceMeters}
										onChange={(e) => setDistanceMeters(e.target.value)}
										placeholder="e.g., 1.0"
									/>
								</div>
							)}

							<div className="flex gap-2">
								<Button
									type="button"
									variant="default"
									size="sm"
									onClick={handleSaveScale}
									disabled={
										!scaleStartPoint ||
										!scaleEndPoint ||
										!distanceMeters ||
										parseFloat(distanceMeters) <= 0
									}
								>
									Save Scale
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleCancelScale}
								>
									Cancel
								</Button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
