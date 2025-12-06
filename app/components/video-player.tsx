import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

interface VideoPlayerProps {
	src: string
	className?: string
}

function formatTime(seconds: number): string {
	if (!isFinite(seconds) || isNaN(seconds)) return '0:00.000'
	const mins = Math.floor(seconds / 60)
	const secs = Math.floor(seconds % 60)
	const milliseconds = Math.floor((seconds % 1) * 1000)
	return `${mins}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
}

export function VideoPlayer({ src, className }: VideoPlayerProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const isSeekingRef = useRef(false)
	const [isPlaying, setIsPlaying] = useState(false)
	const [isEnded, setIsEnded] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [currentFrame, setCurrentFrame] = useState(0)

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

	return (
		<div className={className}>
			<div className="relative">
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
