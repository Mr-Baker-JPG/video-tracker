import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import {
	ToggleGroup,
	ToggleGroupItem,
} from '#app/components/ui/toggle-group.tsx'
import { TrackingObjectSelector } from './tracking-object-selector.tsx'
import type { TrackingObject } from '#app/routes/videos/$videoId.types.ts'

type VideoToolsBarProps = {
	activeTool: 'scale' | 'origin' | 'track' | undefined
	onToolChange: (value: string) => void
	isFullWidthLayout: boolean
	onLayoutToggle: () => void
	layoutFetcher: ReturnType<typeof import('react-router').useFetcher>
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

export function VideoToolsBar({
	activeTool,
	onToolChange,
	isFullWidthLayout,
	onLayoutToggle,
	layoutFetcher,
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
}: VideoToolsBarProps) {
	return (
		<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
						Tools
					</span>
					<div className="h-6 w-px bg-slate-200" />
					<ToggleGroup
						type="single"
						value={activeTool || ''}
						onValueChange={onToolChange}
						className="gap-2"
					>
						<ToggleGroupItem
							value="scale"
							aria-label="Set Scale"
							title="Set Scale"
							className={isFullWidthLayout ? 'gap-2' : ''}
						>
							<Icon name="ruler-dimension-line" className="h-4 w-4" />
							<span className={isFullWidthLayout ? '' : 'sr-only'}>
								Set Scale
							</span>
						</ToggleGroupItem>
						<ToggleGroupItem
							value="origin"
							aria-label="Set Origin"
							title="Set Origin"
							className={isFullWidthLayout ? 'gap-2' : ''}
						>
							<Icon name="move-3d" className="h-4 w-4" />
							<span className={isFullWidthLayout ? '' : 'sr-only'}>
								Set Origin
							</span>
						</ToggleGroupItem>
						<ToggleGroupItem
							value="track"
							aria-label="Track Object"
							title="Track Object"
							className={isFullWidthLayout ? 'gap-2' : ''}
						>
							<Icon name="crosshair-2" className="h-4 w-4" />
							<span className={isFullWidthLayout ? '' : 'sr-only'}>
								Track Object
							</span>
						</ToggleGroupItem>
					</ToggleGroup>
					<div className="h-6 w-px bg-slate-200" />
					<Button
						type="button"
						variant="outline"
						size="default"
						className="gap-2"
						title={isFullWidthLayout ? 'Show Sidebar' : 'Full Width'}
						onClick={onLayoutToggle}
					>
						<Icon
							name={isFullWidthLayout ? 'panel-right' : 'panel-right-minimized'}
							className="h-4 w-4"
						/>
						{isFullWidthLayout ? 'Show Sidebar' : 'Full Width'}
					</Button>
				</div>

				<TrackingObjectSelector
					activeTrackingObjectId={activeTrackingObjectId}
					trackingObjects={trackingObjects}
					getTrackingObjectName={getTrackingObjectName}
					getTrackingObjectColor={getTrackingObjectColor}
					onActiveTrackingObjectChange={onActiveTrackingObjectChange}
					editingObjectId={editingObjectId}
					editName={editName}
					editColor={editColor}
					onEditNameChange={onEditNameChange}
					onEditColorChange={onEditColorChange}
					onStartEditing={onStartEditing}
					onUpdateTrackingObject={onUpdateTrackingObject}
					onDeleteTrackingObject={onDeleteTrackingObject}
					onCreateTrackingObject={onCreateTrackingObject}
					onCancelEditing={onCancelEditing}
					colorInputRefs={colorInputRefs}
					onColorCircleClick={onColorCircleClick}
					setColorInputRef={setColorInputRef}
					videoId={videoId}
					trackingObjectsFetcher={trackingObjectsFetcher}
					setOptimisticTrackingObjects={setOptimisticTrackingObjects}
				/>
			</div>
		</div>
	)
}




