import { useRef, useState, useCallback } from 'react'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

interface VideoPlayerProps {
	src: string
	className?: string
}

function formatTime(seconds: number): string {
	if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
	const mins = Math.floor(seconds / 60)
	const secs = Math.floor(seconds % 60)
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function VideoPlayer({ src, className }: VideoPlayerProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const [isPlaying, setIsPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [currentFrame, setCurrentFrame] = useState(0)

	const video = videoRef.current

	const handlePlayPause = useCallback(() => {
		if (!video) return

		if (video.paused) {
			video.play()
			setIsPlaying(true)
		} else {
			video.pause()
			setIsPlaying(false)
		}
	}, [video])

	const handleSeek = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (!video) return
			const newTime = parseFloat(e.target.value)
			video.currentTime = newTime
			setCurrentTime(newTime)
		},
		[video],
	)

	const handleTimeUpdate = useCallback(() => {
		if (!video) return
		setCurrentTime(video.currentTime)
		// Calculate current frame (assuming 30 fps, can be adjusted)
		const fps = 30
		setCurrentFrame(Math.floor(video.currentTime * fps))
	}, [video])

	const handleLoadedMetadata = useCallback(() => {
		if (!video) return
		setDuration(video.duration)
		const fps = 30
		setCurrentFrame(Math.floor(video.currentTime * fps))
	}, [video])

	const goToPreviousFrame = useCallback(() => {
		if (!video) return
		const fps = 30
		const frameTime = 1 / fps
		const newTime = Math.max(0, video.currentTime - frameTime)
		video.currentTime = newTime
		setCurrentTime(newTime)
		setIsPlaying(false)
		video.pause()
	}, [video])

	const goToNextFrame = useCallback(() => {
		if (!video) return
		const fps = 30
		const frameTime = 1 / fps
		const newTime = Math.min(video.duration, video.currentTime + frameTime)
		video.currentTime = newTime
		setCurrentTime(newTime)
		setIsPlaying(false)
		video.pause()
	}, [video])

	const handlePlay = useCallback(() => {
		setIsPlaying(true)
	}, [])

	const handlePause = useCallback(() => {
		setIsPlaying(false)
	}, [])

	return (
		<div className={className}>
			<div className="relative">
				<video
					ref={videoRef}
					src={src}
					className="w-full rounded-lg"
					onTimeUpdate={handleTimeUpdate}
					onLoadedMetadata={handleLoadedMetadata}
					onPlay={handlePlay}
					onPause={handlePause}
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
					step="0.1"
					className="w-full"
					aria-label="Video seek"
				/>

				{/* Controls */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={handlePlayPause}
							aria-label={isPlaying ? 'Pause' : 'Play'}
						>
							{isPlaying ? 'Pause' : 'Play'}
						</Button>

						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={goToPreviousFrame}
							aria-label="Previous frame"
						>
							<Icon name="arrow-left" />
						</Button>

						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={goToNextFrame}
							aria-label="Next frame"
						>
							<Icon name="arrow-right" />
						</Button>
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
