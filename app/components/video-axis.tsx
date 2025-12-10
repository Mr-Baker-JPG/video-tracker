import { useState, useEffect, useCallback, useRef } from 'react'

export interface Axis {
	id: string
	originX: number
	originY: number
	rotationAngle: number // In radians
}

interface VideoAxisProps {
	axis: Axis | null
	onAxisChange?: (axis: Axis | null) => void
	onAxisConfigurationModeChange?: (isActive: boolean) => void
	isAxisConfigurationModeExternal?: boolean
	videoId?: string
	canvasRef: React.RefObject<HTMLCanvasElement | null>
	videoRef: React.RefObject<HTMLVideoElement | null>
	convertCanvasToVideoCoords: (
		canvasX: number,
		canvasY: number,
	) => {
		x: number
		y: number
	} | null
	onCanvasClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void
	onCanvasMouseDown?: (e: React.MouseEvent<HTMLCanvasElement>) => void
	onCanvasMouseMove?: (e: React.MouseEvent<HTMLCanvasElement>) => void
	onCanvasMouseUp?: () => void
}

export function VideoAxis({
	axis: initialAxis,
	onAxisChange,
	isAxisConfigurationModeExternal = false,
	onAxisConfigurationModeChange,
	canvasRef,
	videoRef,
	convertCanvasToVideoCoords,
	onCanvasClick,
	onCanvasMouseDown,
	onCanvasMouseMove,
	onCanvasMouseUp,
}: VideoAxisProps) {
	const [axis, setAxis] = useState<Axis | null>(initialAxis)
	const [axisOrigin, setAxisOrigin] = useState<{ x: number; y: number } | null>(
		initialAxis ? { x: initialAxis.originX, y: initialAxis.originY } : null,
	)
	const [axisRotation, setAxisRotation] = useState<number>(
		initialAxis?.rotationAngle || 0,
	)
	const [showAxis, setShowAxis] = useState<boolean>(!!initialAxis)
	const [isDraggingAxis, setIsDraggingAxis] = useState<
		'origin' | 'rotation' | null
	>(null)
	const [dragStartPos, setDragStartPos] = useState<{
		x: number
		y: number
	} | null>(null)
	const [dragStartOrigin, setDragStartOrigin] = useState<{
		x: number
		y: number
	} | null>(null)
	const [dragStartRotation, setDragStartRotation] = useState<number | null>(
		null,
	)
	const [isHoveringRotationHandle, setIsHoveringRotationHandle] =
		useState(false)
	const [isAxisConfigurationMode, setIsAxisConfigurationMode] = useState(false)
	const justFinishedRotationDragRef = useRef(false)

	// Sync external axis configuration mode
	useEffect(() => {
		if (isAxisConfigurationModeExternal !== undefined) {
			setIsAxisConfigurationMode(isAxisConfigurationModeExternal)
		}
	}, [isAxisConfigurationModeExternal])

	// Notify parent of axis configuration mode changes
	useEffect(() => {
		onAxisConfigurationModeChange?.(isAxisConfigurationMode)
	}, [isAxisConfigurationMode, onAxisConfigurationModeChange])

	// Sync axis state when initialAxis prop changes
	useEffect(() => {
		console.log('initialAxis', initialAxis)
		if (initialAxis) {
			setAxis(initialAxis)
			setAxisOrigin({ x: initialAxis.originX, y: initialAxis.originY })
			setAxisRotation(initialAxis.rotationAngle)
			setShowAxis(true)
		} else {
			setAxis(null)
			setAxisOrigin(null)
			setAxisRotation(0)
			setShowAxis(false)
		}
	}, [initialAxis])

	// Update axis state when axisOrigin or axisRotation changes
	// Only notify parent when NOT dragging to prevent excessive updates
	useEffect(() => {
		if (axisOrigin) {
			const newAxis: Axis = {
				id: axis?.id || 'temp',
				originX: axisOrigin.x,
				originY: axisOrigin.y,
				rotationAngle: axisRotation,
			}
			setAxis(newAxis)
			// Only notify parent when not dragging to prevent continuous updates during drag
			if (!isDraggingAxis) {
				onAxisChange?.(newAxis)
			}
		} else {
			setAxis(null)
			// Always notify parent when clearing axis (not dragging)
			if (!isDraggingAxis) {
				onAxisChange?.(null)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [axisOrigin, axisRotation, onAxisChange, isDraggingAxis])

	// When dragging ends, notify parent with final axis value
	const prevIsDraggingAxisRef = useRef(isDraggingAxis)
	useEffect(() => {
		// If we just finished dragging (was dragging, now not dragging)
		if (prevIsDraggingAxisRef.current !== null && isDraggingAxis === null) {
			// Notify parent with final axis value
			if (axisOrigin) {
				const finalAxis: Axis = {
					id: axis?.id || 'temp',
					originX: axisOrigin.x,
					originY: axisOrigin.y,
					rotationAngle: axisRotation,
				}
				onAxisChange?.(finalAxis)
			}
		}
		prevIsDraggingAxisRef.current = isDraggingAxis
	}, [isDraggingAxis, axisOrigin, axisRotation, axis, onAxisChange])

	// Helper function to check if mouse is over rotation handle
	const checkRotationHandleHover = useCallback(
		(canvasX: number, canvasY: number): boolean => {
			if (
				!isAxisConfigurationMode ||
				!axisOrigin ||
				!canvasRef.current ||
				!videoRef.current
			) {
				return false
			}

			const canvas = canvasRef.current
			const video = videoRef.current

			// Calculate canvas scale and offset
			const videoAspect = video.videoWidth / video.videoHeight
			const canvasAspect = canvas.width / canvas.height
			let canvasScale: number
			let offsetX = 0
			let offsetY = 0

			if (videoAspect > canvasAspect) {
				canvasScale = canvas.width / video.videoWidth
				const scaledHeight = video.videoHeight * canvasScale
				offsetY = (canvas.height - scaledHeight) / 2
			} else {
				canvasScale = canvas.height / video.videoHeight
				const scaledWidth = video.videoWidth * canvasScale
				offsetX = (canvas.width - scaledWidth) / 2
			}

			const coords = convertCanvasToVideoCoords(canvasX, canvasY)
			if (!coords) return false

			const axisLength = 50 // Length of axis line in video pixels
			const handleX = axisOrigin.x + axisLength * Math.cos(axisRotation)
			const handleY = axisOrigin.y + axisLength * Math.sin(axisRotation)

			// Check distance to the vertical line (perpendicular distance)
			const perpAngle = axisRotation + Math.PI / 2
			const handleLength = 8 / canvasScale // Convert to video pixels
			const handleStartX = handleX - (handleLength / 2) * Math.cos(perpAngle)
			const handleStartY = handleY - (handleLength / 2) * Math.sin(perpAngle)
			const handleEndX = handleX + (handleLength / 2) * Math.cos(perpAngle)
			const handleEndY = handleY + (handleLength / 2) * Math.sin(perpAngle)

			// Calculate perpendicular distance from click point to the line segment
			const dx = handleEndX - handleStartX
			const dy = handleEndY - handleStartY
			const length = Math.sqrt(dx * dx + dy * dy)
			const toClickX = coords.x - handleStartX
			const toClickY = coords.y - handleStartY
			const t = Math.max(
				0,
				Math.min(1, (toClickX * dx + toClickY * dy) / (length * length)),
			)
			const projX = handleStartX + t * dx
			const projY = handleStartY + t * dy
			const distToHandle = Math.sqrt(
				Math.pow(coords.x - projX, 2) + Math.pow(coords.y - projY, 2),
			)

			return distToHandle < 10 / canvasScale
		},
		[
			isAxisConfigurationMode,
			axisOrigin,
			axisRotation,
			convertCanvasToVideoCoords,
			canvasRef,
			videoRef,
		],
	)

	// Helper function to check if mouse is over rotation handle (reusable)
	const checkRotationHandleHit = useCallback(
		(canvasX: number, canvasY: number): boolean => {
			if (
				!isAxisConfigurationMode ||
				!axisOrigin ||
				!canvasRef.current ||
				!videoRef.current
			) {
				return false
			}

			const canvas = canvasRef.current
			const video = videoRef.current

			// Calculate canvas scale and offset
			const videoAspect = video.videoWidth / video.videoHeight
			const canvasAspect = canvas.width / canvas.height
			let canvasScale: number
			let offsetX = 0
			let offsetY = 0

			if (videoAspect > canvasAspect) {
				canvasScale = canvas.width / video.videoWidth
				const scaledHeight = video.videoHeight * canvasScale
				offsetY = (canvas.height - scaledHeight) / 2
			} else {
				canvasScale = canvas.height / video.videoHeight
				const scaledWidth = video.videoWidth * canvasScale
				offsetX = (canvas.width - scaledWidth) / 2
			}

			const coords = convertCanvasToVideoCoords(canvasX, canvasY)
			if (!coords) return false

			const axisLength = 50 // Length of axis line in video pixels
			const handleX = axisOrigin.x + axisLength * Math.cos(axisRotation)
			const handleY = axisOrigin.y + axisLength * Math.sin(axisRotation)

			// Check distance to the vertical line (perpendicular distance)
			const perpAngle = axisRotation + Math.PI / 2
			const handleLength = 8 / canvasScale // Convert to video pixels
			const handleStartX = handleX - (handleLength / 2) * Math.cos(perpAngle)
			const handleStartY = handleY - (handleLength / 2) * Math.sin(perpAngle)
			const handleEndX = handleX + (handleLength / 2) * Math.cos(perpAngle)
			const handleEndY = handleY + (handleLength / 2) * Math.sin(perpAngle)

			// Calculate perpendicular distance from click point to the line segment
			const dx = handleEndX - handleStartX
			const dy = handleEndY - handleStartY
			const length = Math.sqrt(dx * dx + dy * dy)
			const toClickX = coords.x - handleStartX
			const toClickY = coords.y - handleStartY
			const t = Math.max(
				0,
				Math.min(1, (toClickX * dx + toClickY * dy) / (length * length)),
			)
			const projX = handleStartX + t * dx
			const projY = handleStartY + t * dy
			const distToHandle = Math.sqrt(
				Math.pow(coords.x - projX, 2) + Math.pow(coords.y - projY, 2),
			)

			return distToHandle < 10 / canvasScale
		},
		[
			isAxisConfigurationMode,
			axisOrigin,
			axisRotation,
			convertCanvasToVideoCoords,
			canvasRef,
			videoRef,
		],
	)

	// Handle canvas mousedown for rotation handle dragging
	const handleAxisMouseDown = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			if (!isAxisConfigurationMode) {
				onCanvasMouseDown?.(e)
				return
			}

			// Clear the flag when starting a new drag
			justFinishedRotationDragRef.current = false

			const canvas = canvasRef.current
			if (!canvas) {
				onCanvasMouseDown?.(e)
				return
			}

			const rect = canvas.getBoundingClientRect()
			const canvasX = e.clientX - rect.left
			const canvasY = e.clientY - rect.top

			// Check if clicking on rotation handle
			if (axisOrigin && checkRotationHandleHit(canvasX, canvasY)) {
				// Start dragging rotation handle
				setIsDraggingAxis('rotation')
				setDragStartPos({ x: canvasX, y: canvasY })
				setDragStartRotation(axisRotation)
				e.preventDefault() // Prevent default to avoid text selection
				return
			}

			onCanvasMouseDown?.(e)
		},
		[
			isAxisConfigurationMode,
			axisOrigin,
			axisRotation,
			checkRotationHandleHit,
			canvasRef,
			onCanvasMouseDown,
		],
	)

	// Handle canvas click for axis configuration (setting origin)
	const handleAxisClick = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			if (!isAxisConfigurationMode) {
				onCanvasClick?.(e)
				return
			}

			// Don't set origin if we just finished dragging rotation
			if (
				isDraggingAxis === 'rotation' ||
				justFinishedRotationDragRef.current
			) {
				return
			}

			const canvas = canvasRef.current
			if (!canvas) {
				onCanvasClick?.(e)
				return
			}

			const rect = canvas.getBoundingClientRect()
			const canvasX = e.clientX - rect.left
			const canvasY = e.clientY - rect.top

			const coords = convertCanvasToVideoCoords(canvasX, canvasY)
			if (!coords) {
				onCanvasClick?.(e)
				return
			}

			// Check if clicking on rotation handle - if so, don't move origin
			if (axisOrigin && checkRotationHandleHit(canvasX, canvasY)) {
				return
			}

			// Move axis origin to click position
			setAxisOrigin(coords)
			// If this is the first time placing the origin, set default rotation
			if (!axisOrigin) {
				setAxisRotation(0) // Default rotation (x-axis pointing right)
			}
		},
		[
			isAxisConfigurationMode,
			axisOrigin,
			isDraggingAxis,
			checkRotationHandleHit,
			convertCanvasToVideoCoords,
			canvasRef,
			onCanvasClick,
		],
	)

	// Handle mouse move for axis dragging and cursor updates
	const handleAxisMouseMove = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			const canvas = canvasRef.current
			const video = videoRef.current
			if (!canvas || !video) {
				onCanvasMouseMove?.(e)
				return
			}

			const rect = canvas.getBoundingClientRect()
			const canvasX = e.clientX - rect.left
			const canvasY = e.clientY - rect.top

			// Check if hovering over rotation handle (when not dragging)
			if (!isDraggingAxis && isAxisConfigurationMode) {
				const isOverHandle = checkRotationHandleHover(canvasX, canvasY)
				setIsHoveringRotationHandle(isOverHandle)
			} else {
				setIsHoveringRotationHandle(false)
			}

			// Handle dragging
			if (
				!isDraggingAxis ||
				!dragStartPos ||
				!canvasRef.current ||
				!videoRef.current
			) {
				onCanvasMouseMove?.(e)
				return
			}

			if (isDraggingAxis === 'origin' && dragStartOrigin) {
				// Drag origin
				const coords = convertCanvasToVideoCoords(canvasX, canvasY)
				if (coords) {
					setAxisOrigin(coords)
				}
			} else if (isDraggingAxis === 'rotation' && dragStartRotation !== null) {
				// Drag rotation handle
				if (!axisOrigin) {
					onCanvasMouseMove?.(e)
					return
				}

				// Calculate canvas scale and offset
				const videoAspect = video.videoWidth / video.videoHeight
				const canvasAspect = canvas.width / canvas.height
				let canvasScale: number
				let offsetX = 0
				let offsetY = 0

				if (videoAspect > canvasAspect) {
					canvasScale = canvas.width / video.videoWidth
					const scaledHeight = video.videoHeight * canvasScale
					offsetY = (canvas.height - scaledHeight) / 2
				} else {
					canvasScale = canvas.height / video.videoHeight
					const scaledWidth = video.videoWidth * canvasScale
					offsetX = (canvas.width - scaledWidth) / 2
				}

				const originCanvasX = axisOrigin.x * canvasScale + offsetX
				const originCanvasY = axisOrigin.y * canvasScale + offsetY

				// Calculate angle from origin to current mouse position
				const dx = canvasX - originCanvasX
				const dy = canvasY - originCanvasY
				// Convert canvas coordinates to video coordinates for angle calculation
				const videoDx = dx / canvasScale
				const videoDy = dy / canvasScale
				const newAngle = Math.atan2(videoDy, videoDx)

				setAxisRotation(newAngle)
			}

			onCanvasMouseMove?.(e)
		},
		[
			isDraggingAxis,
			dragStartPos,
			dragStartOrigin,
			dragStartRotation,
			axisOrigin,
			convertCanvasToVideoCoords,
			isAxisConfigurationMode,
			checkRotationHandleHover,
			canvasRef,
			videoRef,
			onCanvasMouseMove,
		],
	)

	// Handle mouse up to stop dragging
	const handleAxisMouseUp = useCallback(() => {
		// Track if we just finished a rotation drag to prevent click handler from moving origin
		if (isDraggingAxis === 'rotation') {
			justFinishedRotationDragRef.current = true
			// Clear the flag after a short delay to allow click event to be ignored
			setTimeout(() => {
				justFinishedRotationDragRef.current = false
			}, 100)
		}
		setIsDraggingAxis(null)
		setDragStartPos(null)
		setDragStartOrigin(null)
		setDragStartRotation(null)
		onCanvasMouseUp?.()
	}, [onCanvasMouseUp, isDraggingAxis])

	// Add global mouse move and mouse up listeners when dragging rotation
	useEffect(() => {
		if (
			isDraggingAxis === 'rotation' &&
			axisOrigin &&
			dragStartRotation !== null
		) {
			const handleGlobalMouseMove = (e: MouseEvent) => {
				const canvas = canvasRef.current
				const video = videoRef.current
				if (!canvas || !video) return

				const rect = canvas.getBoundingClientRect()
				const canvasX = e.clientX - rect.left
				const canvasY = e.clientY - rect.top

				// Calculate canvas scale and offset
				const videoAspect = video.videoWidth / video.videoHeight
				const canvasAspect = canvas.width / canvas.height
				let canvasScale: number
				let offsetX = 0
				let offsetY = 0

				if (videoAspect > canvasAspect) {
					canvasScale = canvas.width / video.videoWidth
					const scaledHeight = video.videoHeight * canvasScale
					offsetY = (canvas.height - scaledHeight) / 2
				} else {
					canvasScale = canvas.height / video.videoHeight
					const scaledWidth = video.videoWidth * canvasScale
					offsetX = (canvas.width - scaledWidth) / 2
				}

				const originCanvasX = axisOrigin.x * canvasScale + offsetX
				const originCanvasY = axisOrigin.y * canvasScale + offsetY

				// Calculate angle from origin to current mouse position
				const dx = canvasX - originCanvasX
				const dy = canvasY - originCanvasY
				// Convert canvas coordinates to video coordinates for angle calculation
				const videoDx = dx / canvasScale
				const videoDy = dy / canvasScale
				const newAngle = Math.atan2(videoDy, videoDx)

				setAxisRotation(newAngle)
			}

			const handleGlobalMouseUp = () => {
				handleAxisMouseUp()
			}

			window.addEventListener('mousemove', handleGlobalMouseMove)
			window.addEventListener('mouseup', handleGlobalMouseUp)
			return () => {
				window.removeEventListener('mousemove', handleGlobalMouseMove)
				window.removeEventListener('mouseup', handleGlobalMouseUp)
			}
		}
	}, [
		isDraggingAxis,
		axisOrigin,
		dragStartRotation,
		handleAxisMouseUp,
		canvasRef,
		videoRef,
	])

	// Draw axis on canvas
	const drawAxis = useCallback(
		(
			ctx: CanvasRenderingContext2D,
			canvasScale: number,
			offsetX: number,
			offsetY: number,
		) => {
			// Draw axis if it exists and is visible
			if (showAxis && axisOrigin) {
				const axisLength = 50 // Length of axis line in video pixels
				const originCanvasX = axisOrigin.x * canvasScale + offsetX
				const originCanvasY = axisOrigin.y * canvasScale + offsetY

				// Draw x-axis (magenta)
				const xAxisEndX = axisOrigin.x + axisLength * Math.cos(axisRotation)
				const xAxisEndY = axisOrigin.y + axisLength * Math.sin(axisRotation)
				const xAxisEndCanvasX = xAxisEndX * canvasScale + offsetX
				const xAxisEndCanvasY = xAxisEndY * canvasScale + offsetY

				ctx.strokeStyle = '#ff00ff' // Magenta
				ctx.lineWidth = 2
				ctx.beginPath()
				ctx.moveTo(originCanvasX, originCanvasY)
				ctx.lineTo(xAxisEndCanvasX, xAxisEndCanvasY)
				ctx.stroke()

				// Draw y-axis (magenta) - perpendicular to x-axis
				const yAxisEndX =
					axisOrigin.x + axisLength * Math.cos(axisRotation + Math.PI / 2)
				const yAxisEndY =
					axisOrigin.y + axisLength * Math.sin(axisRotation + Math.PI / 2)
				const yAxisEndCanvasX = yAxisEndX * canvasScale + offsetX
				const yAxisEndCanvasY = yAxisEndY * canvasScale + offsetY

				ctx.strokeStyle = '#ff00ff' // Magenta
				ctx.lineWidth = 2
				ctx.beginPath()
				ctx.moveTo(originCanvasX, originCanvasY)
				ctx.lineTo(yAxisEndCanvasX, yAxisEndCanvasY)
				ctx.stroke()

				// Draw origin point (white circle)
				ctx.fillStyle = '#ffffff'
				ctx.strokeStyle = '#000000'
				ctx.lineWidth = 2
				ctx.beginPath()
				ctx.arc(originCanvasX, originCanvasY, 5, 0, 2 * Math.PI)
				ctx.fill()
				ctx.stroke()

				// Draw rotation handle (small vertical line on x-axis) - only in configuration mode
				if (isAxisConfigurationMode) {
					// Draw a small vertical line perpendicular to the x-axis at the x-axis endpoint
					const handleLength = 8 // Length of the vertical line in canvas pixels
					const perpAngle = axisRotation + Math.PI / 2 // Perpendicular to x-axis
					const handleStartX =
						xAxisEndCanvasX - (handleLength / 2) * Math.cos(perpAngle)
					const handleStartY =
						xAxisEndCanvasY - (handleLength / 2) * Math.sin(perpAngle)
					const handleEndX =
						xAxisEndCanvasX + (handleLength / 2) * Math.cos(perpAngle)
					const handleEndY =
						xAxisEndCanvasY + (handleLength / 2) * Math.sin(perpAngle)

					ctx.strokeStyle = '#ff00ff' // Magenta to match axis color
					ctx.lineWidth = 2
					ctx.beginPath()
					ctx.moveTo(handleStartX, handleStartY)
					ctx.lineTo(handleEndX, handleEndY)
					ctx.stroke()
				}
			}
		},
		[showAxis, axisOrigin, axisRotation, isAxisConfigurationMode],
	)

	return {
		// State
		axis,
		showAxis,
		setShowAxis,
		isHoveringRotationHandle,
		isDraggingAxis,
		isAxisConfigurationMode,
		// Handlers
		handleAxisClick,
		handleAxisMouseDown,
		handleAxisMouseMove,
		handleAxisMouseUp,
		// Drawing function
		drawAxis,
	}
}
