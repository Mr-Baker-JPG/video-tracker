import { useRef, useState, useCallback, useEffect } from 'react'
import { useFetcher } from 'react-router'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

interface TrackingPoint {
	id: string
	frame: number
	x: number
	y: number
}

interface VideoPlayerProps {
	src: string
	className?: string
	videoId?: string
	trackingPoints?: TrackingPoint[]
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

	// Handle canvas click to place tracking point
	const handleCanvasClick = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			if (!videoId || !canvasRef.current || !videoRef.current) return

			const canvas = canvasRef.current
			const video = videoRef.current
			const rect = canvas.getBoundingClientRect()

			// Get click position relative to canvas
			const canvasX = e.clientX - rect.left
			const canvasY = e.clientY - rect.top

			// Convert to video coordinates (accounting for video scaling)
			// The video might be scaled to fit the container, so we need to calculate
			// the actual video dimensions vs displayed dimensions
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

			// Calculate current frame (assuming 30 fps)
			const fps = 30
			const frame = Math.floor(currentTime * fps)

			// Create tracking point locally for immediate feedback
			const newPoint: TrackingPoint = {
				id: `temp-${Date.now()}`,
				frame,
				x,
				y,
			}

			setLocalTrackingPoints((prev) => [...prev, newPoint])

			// Save to server
			const formData = new FormData()
			formData.append('intent', 'create-tracking-point')
			formData.append('videoId', videoId)
			formData.append('frame', frame.toString())
			formData.append('x', x.toString())
			formData.append('y', y.toString())

			if (videoId && fetcher) {
				void fetcher.submit(formData, {
					method: 'POST',
				})
			}
		},
		[videoId, currentTime, fetcher],
	)

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

			// Only draw points for the current frame
			const fps = 30
			const frame = Math.floor(currentTime * fps)

			const pointsForFrame = localTrackingPoints.filter(
				(point) => point.frame === frame,
			)

			if (pointsForFrame.length === 0) return

			// Calculate scaling factor to convert video coordinates to canvas coordinates
			const videoAspect = video.videoWidth / video.videoHeight
			const canvasAspect = canvas.width / canvas.height

			let scale: number
			let offsetX = 0
			let offsetY = 0

			if (videoAspect > canvasAspect) {
				// Video is wider - letterboxing on top/bottom
				scale = canvas.width / video.videoWidth
				const scaledHeight = video.videoHeight * scale
				offsetY = (canvas.height - scaledHeight) / 2
			} else {
				// Video is taller - letterboxing on left/right
				scale = canvas.height / video.videoHeight
				const scaledWidth = video.videoWidth * scale
				offsetX = (canvas.width - scaledWidth) / 2
			}

			pointsForFrame.forEach((point) => {
				// Convert video coordinates to canvas coordinates
				const canvasX = point.x * scale + offsetX
				const canvasY = point.y * scale + offsetY

				// Draw point
				ctx.fillStyle = '#ff0000'
				ctx.beginPath()
				ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI)
				ctx.fill()

				// Draw crosshair
				ctx.strokeStyle = '#ff0000'
				ctx.lineWidth = 1
				ctx.beginPath()
				ctx.moveTo(canvasX - 10, canvasY)
				ctx.lineTo(canvasX + 10, canvasY)
				ctx.moveTo(canvasX, canvasY - 10)
				ctx.lineTo(canvasX, canvasY + 10)
				ctx.stroke()
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
	}, [currentTime, localTrackingPoints])

	// Update local tracking points when fetcher returns new data
	useEffect(() => {
		if (fetcher?.data?.success && fetcher.data?.trackingPoint) {
			const newPoint = fetcher.data.trackingPoint as TrackingPoint
			setLocalTrackingPoints((prev) => {
				// Replace temp point with real one if it exists
				const tempIndex = prev.findIndex((p) => p.id.startsWith('temp-'))
				if (tempIndex >= 0) {
					const updated = [...prev]
					updated[tempIndex] = newPoint
					return updated
				}
				// Otherwise add new point
				return [...prev, newPoint]
			})
		}
	}, [fetcher?.data])

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
						className="absolute left-0 top-0 cursor-crosshair rounded-lg"
						onClick={handleCanvasClick}
						style={{ pointerEvents: 'auto' }}
						aria-label="Tracking canvas - click to place tracking points"
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
		</div>
	)
}
