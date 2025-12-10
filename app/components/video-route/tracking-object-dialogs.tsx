import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '#app/components/ui/alert-dialog.tsx'
import { Input } from '#app/components/ui/input.tsx'

type DeleteTrackingObjectDialogProps = {
	deleteObjectId: string | null
	onClose: () => void
	onConfirm: (id: string) => void
	getTrackingObjectName: (id: string) => string
}

export function DeleteTrackingObjectDialog({
	deleteObjectId,
	onClose,
	onConfirm,
	getTrackingObjectName,
}: DeleteTrackingObjectDialogProps) {
	if (deleteObjectId === null) return null

	return (
		<AlertDialog open={true} onOpenChange={(open) => !open && onClose()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Tracking Object</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete "
						{getTrackingObjectName(deleteObjectId)}"? This will permanently
						delete all tracking points associated with this object and cannot be
						undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => onConfirm(deleteObjectId)}
						className="bg-red-600 hover:bg-red-700"
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

type ClearPointsDialogProps = {
	open: boolean
	onClose: () => void
	onConfirm: () => void
}

export function ClearPointsDialog({
	open,
	onClose,
	onConfirm,
}: ClearPointsDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Clear All Tracking Points</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to clear all tracking points? This will
						permanently delete all tracking points and tracking objects for this
						video and cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className="bg-red-600 hover:bg-red-700"
					>
						Clear All Points
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

type CreateTrackingObjectDialogProps = {
	open: boolean
	onClose: () => void
	onConfirm: () => void
	newObjectName: string
	newObjectColor: string
	onNameChange: (name: string) => void
	onColorChange: (color: string) => void
}

export function CreateTrackingObjectDialog({
	open,
	onClose,
	onConfirm,
	newObjectName,
	newObjectColor,
	onNameChange,
	onColorChange,
}: CreateTrackingObjectDialogProps) {
	return (
		<AlertDialog
			open={open}
			onOpenChange={(open) => {
				if (!open) {
					onClose()
				}
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Create New Tracking Object</AlertDialogTitle>
					<AlertDialogDescription>
						Set a name and color for the new tracking object.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="flex flex-col gap-4 py-4">
					<div className="flex flex-col gap-2">
						<label
							htmlFor="new-object-name"
							className="text-sm font-medium text-slate-700"
						>
							Name
						</label>
						<Input
							id="new-object-name"
							type="text"
							value={newObjectName}
							onChange={(e) => onNameChange(e.target.value)}
							placeholder="Object name (optional)"
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault()
									onConfirm()
								}
							}}
							autoFocus
						/>
					</div>
					<div className="flex flex-col gap-2">
						<label
							htmlFor="new-object-color"
							className="text-sm font-medium text-slate-700"
						>
							Color
						</label>
						<div className="flex items-center gap-3">
							<Input
								id="new-object-color"
								type="color"
								value={newObjectColor || '#3b82f6'}
								onChange={(e) => onColorChange(e.target.value)}
								className="h-10 w-20 cursor-pointer"
							/>
							<span className="text-sm text-slate-500">
								{newObjectColor || 'Default color will be generated'}
							</span>
						</div>
					</div>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>
						Create Object
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
