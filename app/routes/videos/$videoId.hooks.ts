import { useEffect, useRef, useState } from 'react'
import { useFetcher, useRevalidator } from 'react-router'
import { useLayout } from '#app/routes/resources/layout-switch.tsx'
import type { TrackingObject } from './$videoId.types.ts'

// Tracking Objects Hook
export function useTrackingObjects(
	videoId: string,
	initialTrackingObjects: TrackingObject[],
	initialActiveTrackingObjectId: string | null,
) {
	const [optimisticTrackingObjects, setOptimisticTrackingObjects] = useState<
		TrackingObject[]
	>(initialTrackingObjects)
	const [activeTrackingObjectId, setActiveTrackingObjectId] = useState<
		string | null
	>(initialActiveTrackingObjectId)
	const [editingObjectId, setEditingObjectId] = useState<string | null>(null)
	const [editName, setEditName] = useState('')
	const [editColor, setEditColor] = useState('')
	const [deleteObjectId, setDeleteObjectId] = useState<string | null>(null)
	const [showClearPointsDialog, setShowClearPointsDialog] = useState(false)
	const [showCreateObjectDialog, setShowCreateObjectDialog] = useState(false)
	const [newObjectName, setNewObjectName] = useState('')
	const [newObjectColor, setNewObjectColor] = useState('')
	const colorInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

	const trackingObjectsFetcher = useFetcher()
	const clearPointsFetcher = useFetcher()
	const trackingObjectSelectionFetcher = useFetcher()
	const revalidator = useRevalidator()

	// Sync optimistic state with loader data when it changes
	useEffect(() => {
		setOptimisticTrackingObjects(initialTrackingObjects)
	}, [initialTrackingObjects])

	// Sync active tracking object ID with loader data when it changes
	useEffect(() => {
		setActiveTrackingObjectId(initialActiveTrackingObjectId)
	}, [initialActiveTrackingObjectId])

	// Track previous fetcher state to detect transitions
	const prevFetcherStateRef = useRef(trackingObjectsFetcher.state)
	const prevClearPointsFetcherStateRef = useRef(clearPointsFetcher.state)
	const lastRevalidatedTrackingObjectsRef = useRef<number>(0)
	const lastRevalidatedClearPointsRef = useRef<number>(0)

	// Revalidate loader data when fetcher completes successfully (only once per update)
	useEffect(() => {
		const currentState = trackingObjectsFetcher.state
		const prevState = prevFetcherStateRef.current

		// Only revalidate when transitioning from submitting/loading to idle with success
		// This ensures we only revalidate once per update, not on every render
		if (
			(prevState === 'submitting' || prevState === 'loading') &&
			currentState === 'idle' &&
			trackingObjectsFetcher.data?.success
		) {
			// Prevent revalidating multiple times for the same operation
			const now = Date.now()
			if (now - lastRevalidatedTrackingObjectsRef.current > 100) {
				lastRevalidatedTrackingObjectsRef.current = now
				void revalidator.revalidate()
			}
		}

		prevFetcherStateRef.current = currentState
	}, [
		trackingObjectsFetcher.state,
		trackingObjectsFetcher.data?.success,
		revalidator,
	])

	// Revalidate when clear points fetcher completes
	useEffect(() => {
		const currentState = clearPointsFetcher.state
		const prevState = prevClearPointsFetcherStateRef.current

		// Only revalidate when transitioning from submitting/loading to idle with success
		if (
			(prevState === 'submitting' || prevState === 'loading') &&
			currentState === 'idle' &&
			clearPointsFetcher.data?.success
		) {
			// Prevent revalidating multiple times for the same operation
			const now = Date.now()
			if (now - lastRevalidatedClearPointsRef.current > 100) {
				lastRevalidatedClearPointsRef.current = now
				void revalidator.revalidate()
			}
		}

		prevClearPointsFetcherStateRef.current = currentState
	}, [clearPointsFetcher.state, clearPointsFetcher.data?.success, revalidator])

	// Helper to update active tracking object ID and persist to session
	const updateActiveTrackingObjectId = (trackingObjectId: string | null) => {
		setActiveTrackingObjectId(trackingObjectId)
		void trackingObjectSelectionFetcher.submit(
			{
				videoId,
				trackingObjectId: trackingObjectId ?? '',
			},
			{
				method: 'POST',
				action: '/resources/tracking-object-selection',
			},
		)
	}

	// Helper to get tracking object name (uses optimistic state, falls back to loader data)
	const getTrackingObjectName = (id: string): string => {
		// First check optimistic state
		let obj = optimisticTrackingObjects.find((o) => o.id === id)
		// Fall back to initial data if not found in optimistic state
		if (!obj) {
			obj = initialTrackingObjects.find((o) => o.id === id)
		}
		// Return the name if it exists and is not empty, otherwise use fallback
		if (obj?.name && typeof obj.name === 'string' && obj.name.trim()) {
			return obj.name
		}
		return `Object ${id.slice(-6)}`
	}

	// Helper to get tracking object color (uses optimistic state)
	const getTrackingObjectColor = (id: string): string => {
		const obj = optimisticTrackingObjects.find((o) => o.id === id)
		if (obj?.color) return obj.color
		// Generate color from ID hash
		const hash = id.split('').reduce((acc, char) => {
			return char.charCodeAt(0) + ((acc << 5) - acc)
		}, 0)
		const hue = Math.abs(hash) % 360
		return `hsl(${hue}, 70%, 50%)`
	}

	const handleCreateTrackingObject = () => {
		setShowCreateObjectDialog(true)
		setNewObjectName('')
		setNewObjectColor('')
	}

	const handleCreateObjectSubmit = () => {
		const trimmedName = newObjectName.trim()
		const trimmedColor = newObjectColor.trim()

		const formData = new FormData()
		formData.append('intent', 'create-tracking-object')
		formData.append('videoId', videoId)
		if (trimmedName) {
			formData.append('name', trimmedName)
		}
		if (trimmedColor) {
			formData.append('color', trimmedColor)
		}

		void trackingObjectsFetcher.submit(formData, { method: 'POST' })
		setShowCreateObjectDialog(false)
		setNewObjectName('')
		setNewObjectColor('')
	}

	const handleUpdateTrackingObject = (id: string) => {
		const trimmedName = editName.trim()
		const trimmedColor = editColor.trim()

		// Optimistic UI update - update local state immediately
		setOptimisticTrackingObjects((prev) =>
			prev.map((obj) =>
				obj.id === id
					? {
							...obj,
							name: trimmedName || null,
							color: trimmedColor || null,
						}
					: obj,
			),
		)

		// Always send name and color fields when editing, so the server can update them
		const formData: Record<string, string> = {
			intent: 'update-tracking-object',
			videoId,
			trackingObjectId: id,
			name: trimmedName,
			color: trimmedColor,
		}

		void trackingObjectsFetcher.submit(formData, { method: 'POST' })
		setEditingObjectId(null)
		setEditName('')
		setEditColor('')
	}

	const startEditing = (obj: {
		id: string
		name: string | null
		color: string | null
	}) => {
		setEditingObjectId(obj.id)
		setEditName(obj.name || '')
		setEditColor(obj.color || '')
	}

	const handleColorCircleClick = (
		e: React.MouseEvent,
		obj: { id: string; name: string | null; color: string | null },
	) => {
		e.stopPropagation()
		// Start editing if not already editing
		if (editingObjectId !== obj.id) {
			startEditing(obj)
		}
		// Trigger color input click to open color picker
		setTimeout(() => {
			const colorInput = colorInputRefs.current.get(obj.id)
			colorInput?.click()
		}, 50)
	}

	const setColorInputRef = (id: string, el: HTMLInputElement | null) => {
		if (el) {
			colorInputRefs.current.set(id, el)
		} else {
			colorInputRefs.current.delete(id)
		}
	}

	const handleDeleteTrackingObject = (id: string) => {
		void trackingObjectsFetcher.submit(
			{
				intent: 'delete-tracking-object',
				videoId,
				trackingObjectId: id,
			},
			{ method: 'POST' },
		)
		setDeleteObjectId(null)
		// Clear active tracking object if it was deleted
		if (activeTrackingObjectId === id) {
			updateActiveTrackingObjectId(null)
		}
	}

	const handleClearAllPoints = () => {
		void clearPointsFetcher.submit(
			{
				intent: 'clear-all-points',
				videoId,
			},
			{ method: 'POST' },
		)
		setShowClearPointsDialog(false)
		// Clear active tracking object since all points are deleted
		updateActiveTrackingObjectId(null)
	}

	return {
		optimisticTrackingObjects,
		setOptimisticTrackingObjects,
		activeTrackingObjectId,
		editingObjectId,
		setEditingObjectId,
		editName,
		editColor,
		deleteObjectId,
		showClearPointsDialog,
		showCreateObjectDialog,
		newObjectName,
		newObjectColor,
		colorInputRefs,
		trackingObjectsFetcher,
		clearPointsFetcher,
		setEditName,
		setEditColor,
		setDeleteObjectId,
		setShowClearPointsDialog,
		setShowCreateObjectDialog,
		setNewObjectName,
		setNewObjectColor,
		getTrackingObjectName,
		getTrackingObjectColor,
		updateActiveTrackingObjectId,
		handleCreateTrackingObject,
		handleCreateObjectSubmit,
		handleUpdateTrackingObject,
		startEditing,
		handleColorCircleClick,
		setColorInputRef,
		handleDeleteTrackingObject,
		handleClearAllPoints,
	}
}

// Video Layout Hook
export function useVideoLayout() {
	const layoutPreference = useLayout()
	const [isFullWidthLayout, setIsFullWidthLayout] = useState(
		layoutPreference === 'full-width',
	)
	const prevLayoutPreferenceRef = useRef(layoutPreference)
	const layoutFetcher = useFetcher()

	// Sync layout state with preference changes (only when actually changed)
	useEffect(() => {
		if (prevLayoutPreferenceRef.current !== layoutPreference) {
			const newLayoutPreference = layoutPreference === 'full-width'
			// Only update if the actual boolean value would change
			setIsFullWidthLayout((prev) => {
				if (prev !== newLayoutPreference) {
					return newLayoutPreference
				}
				return prev
			})
			prevLayoutPreferenceRef.current = layoutPreference
		}
	}, [layoutPreference])

	const handleLayoutToggle = () => {
		const newLayout = !isFullWidthLayout
		// Only submit if layout fetcher is not already busy
		if (layoutFetcher.state === 'idle') {
			setIsFullWidthLayout(newLayout)
			const formData = new FormData()
			formData.append('layout', newLayout ? 'full-width' : 'split')
			void layoutFetcher.submit(formData, {
				method: 'POST',
				action: '/resources/layout-switch',
			})
		}
	}

	return {
		isFullWidthLayout,
		setIsFullWidthLayout,
		handleLayoutToggle,
		layoutFetcher,
	}
}

// Video Tools Hook
export function useVideoTools() {
	const [activeTool, setActiveTool] = useState<
		'scale' | 'origin' | 'track' | undefined
	>(undefined)
	const [isScaleCalibrationMode, setIsScaleCalibrationMode] = useState(false)
	const [isAxisConfigurationMode, setIsAxisConfigurationMode] = useState(false)

	// Handle tool selection - supports toggling on/off
	const handleToolChange = (value: string) => {
		// If clicking the same button, value will be empty string (deselect)
		// If clicking a different button, value will be that button's value
		const tool =
			value === '' ? undefined : (value as 'scale' | 'origin' | 'track')

		setActiveTool(tool)

		// Update mode states based on selected tool
		if (tool === 'scale') {
			setIsScaleCalibrationMode(true)
			setIsAxisConfigurationMode(false)
		} else if (tool === 'origin') {
			setIsScaleCalibrationMode(false)
			setIsAxisConfigurationMode(true)
		} else {
			// tool is undefined - turn off all modes
			setIsScaleCalibrationMode(false)
			setIsAxisConfigurationMode(false)
		}
	}

	return {
		activeTool,
		isScaleCalibrationMode,
		isAxisConfigurationMode,
		setIsScaleCalibrationMode,
		setIsAxisConfigurationMode,
		handleToolChange,
	}
}
