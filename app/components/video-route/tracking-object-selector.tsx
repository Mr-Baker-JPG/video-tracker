import { Button } from '#app/components/ui/button.tsx'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Input } from '#app/components/ui/input.tsx'
import type { TrackingObject } from '#app/routes/videos/$videoId.types.ts'

type TrackingObjectSelectorProps = {
	activeTrackingObjectId: string | null
	trackingObjects: TrackingObject[]
	getTrackingObjectName: (id: string) => string
	getTrackingObjectColor: (id: string) => string
	onActiveTrackingObjectChange: (id: string | null) => void
	editingObjectId: string | null
	editName: string
	editColor: string
	onEditNameChange: (name: string) => void
	onEditColorChange: (color: string) => void
	onStartEditing: (obj: TrackingObject) => void
	onUpdateTrackingObject: (id: string) => void
	onDeleteTrackingObject: (id: string) => void
	onCreateTrackingObject: () => void
	onCancelEditing: () => void
	colorInputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>
	onColorCircleClick: (e: React.MouseEvent, obj: TrackingObject) => void
	setColorInputRef: (id: string, el: HTMLInputElement | null) => void
	videoId: string
	trackingObjectsFetcher: ReturnType<typeof import('react-router').useFetcher>
	setOptimisticTrackingObjects: React.Dispatch<
		React.SetStateAction<TrackingObject[]>
	>
}

export function TrackingObjectSelector({
	activeTrackingObjectId,
	trackingObjects,
	getTrackingObjectName,
	getTrackingObjectColor,
	onActiveTrackingObjectChange,
	editingObjectId,
	editName,
	editColor,
	onEditNameChange,
	onEditColorChange,
	onStartEditing,
	onUpdateTrackingObject,
	onDeleteTrackingObject,
	onCreateTrackingObject,
	onCancelEditing,
	colorInputRefs,
	onColorCircleClick,
	setColorInputRef,
	videoId,
	trackingObjectsFetcher,
	setOptimisticTrackingObjects,
}: TrackingObjectSelectorProps) {
	return (
		<div className="flex items-center gap-2">
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="default" className="gap-2">
						{activeTrackingObjectId ? (
							<>
								<div
									className="h-2 w-2 rounded-full"
									style={{
										backgroundColor: getTrackingObjectColor(
											activeTrackingObjectId,
										),
									}}
								/>
								<span className="text-xs">
									{getTrackingObjectName(activeTrackingObjectId)}
								</span>
							</>
						) : (
							<>
								<Icon name="crosshair-2" className="h-3 w-3" />
								<span className="text-xs">Select Object</span>
							</>
						)}
						<Icon name="chevron-down" className="h-3 w-3" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="w-64"
					sideOffset={4}
					alignOffset={0}
				>
					<DropdownMenuLabel>Tracking Objects</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{trackingObjects.length === 0 ? (
						<DropdownMenuItem disabled>
							<span className="text-xs text-slate-500">No objects yet</span>
						</DropdownMenuItem>
					) : (
						trackingObjects.map((obj) => (
							<DropdownMenuItem
								key={obj.id}
								onClick={(e) => {
									// Don't close dropdown or change active object when editing
									if (editingObjectId === obj.id) {
										e.preventDefault()
										return
									}
									onActiveTrackingObjectChange(obj.id)
								}}
								className="flex items-center gap-2"
								onSelect={(e) => {
									// Prevent dropdown from closing when editing
									if (editingObjectId === obj.id) {
										e.preventDefault()
									}
								}}
							>
								<div
									className="h-2 w-2 cursor-pointer rounded-full transition-all hover:ring-2 hover:ring-slate-300"
									style={{
										backgroundColor: getTrackingObjectColor(obj.id),
									}}
									onClick={(e) => onColorCircleClick(e, obj)}
									title="Click to change color"
								/>
								{editingObjectId === obj.id ? (
									<Input
										type="text"
										value={editName}
										onChange={(e) => onEditNameChange(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault()
												e.stopPropagation()
												onUpdateTrackingObject(obj.id)
											}
											if (e.key === 'Escape') {
												e.preventDefault()
												e.stopPropagation()
												onCancelEditing()
											}
										}}
										onFocus={(e) => e.stopPropagation()}
										onMouseDown={(e) => e.stopPropagation()}
										onClick={(e) => e.stopPropagation()}
										autoFocus
										placeholder="Name"
										className="h-6 flex-1 text-xs"
									/>
								) : (
									<span
										className="flex-1 cursor-pointer"
										onClick={(e) => {
											e.stopPropagation()
											onActiveTrackingObjectChange(obj.id)
										}}
										title="Click to select object"
									>
										{getTrackingObjectName(obj.id)}
									</span>
								)}
								{editingObjectId === obj.id ? (
									<div className="flex items-center gap-1">
										<label
											className="relative cursor-pointer"
											onClick={(e) => e.stopPropagation()}
											onMouseDown={(e) => e.stopPropagation()}
										>
											<Input
												ref={(el) => setColorInputRef(obj.id, el)}
												type="color"
												value={editColor || getTrackingObjectColor(obj.id)}
												onChange={(e) => {
													e.stopPropagation()
													const newColor = e.target.value
													onEditColorChange(newColor)
													// Update optimistic state immediately
													setOptimisticTrackingObjects((prev) =>
														prev.map((o) =>
															o.id === obj.id ? { ...o, color: newColor } : o,
														),
													)
													// Save to server
													const formData: Record<string, string> = {
														intent: 'update-tracking-object',
														videoId,
														trackingObjectId: obj.id,
														name: editName.trim(),
														color: newColor,
													}
													void trackingObjectsFetcher.submit(formData, {
														method: 'POST',
													})
												}}
												className="sr-only"
												onClick={(e) => e.stopPropagation()}
												onFocus={(e) => e.stopPropagation()}
											/>
											<div
												className="h-6 w-6 cursor-pointer rounded border border-slate-300"
												style={{
													backgroundColor:
														editColor || getTrackingObjectColor(obj.id),
												}}
												onClick={(e) => {
													e.stopPropagation()
													const colorInput = colorInputRefs.current.get(obj.id)
													colorInput?.click()
												}}
												title="Click to change color"
											/>
										</label>
										<Button
											size="sm"
											variant="ghost"
											onClick={(e) => {
												e.stopPropagation()
												onUpdateTrackingObject(obj.id)
											}}
										>
											<Icon name="check" className="h-3 w-3" />
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={(e) => {
												e.stopPropagation()
												onCancelEditing()
											}}
										>
											<Icon name="cross-1" className="h-3 w-3" />
										</Button>
									</div>
								) : (
									<div className="flex items-center gap-1">
										<Button
											size="sm"
											variant="ghost"
											onClick={(e) => {
												e.stopPropagation()
												onStartEditing(obj)
											}}
										>
											<Icon name="pencil-1" className="h-3 w-3" />
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={(e) => {
												e.stopPropagation()
												onDeleteTrackingObject(obj.id)
											}}
											className="text-red-600 hover:bg-red-50 hover:text-red-700"
										>
											<Icon name="trash" className="h-3 w-3" />
										</Button>
									</div>
								)}
							</DropdownMenuItem>
						))
					)}
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={onCreateTrackingObject}>
						<Icon name="plus" className="mr-2 h-4 w-4" />
						Create New Object
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
