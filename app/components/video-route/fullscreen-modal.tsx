import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Icon } from '#app/components/ui/icon.tsx'

type FullscreenModalProps = {
	open: boolean
	onClose: () => void
	children: React.ReactNode
	title?: string
}

export function FullscreenModal({
	open,
	onClose,
	children,
	title,
}: FullscreenModalProps) {
	// Handle ESC key press
	useEffect(() => {
		if (!open) return

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		document.addEventListener('keydown', handleEscape)
		return () => {
			document.removeEventListener('keydown', handleEscape)
		}
	}, [open, onClose])

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}
		return () => {
			document.body.style.overflow = ''
		}
	}, [open])

	return (
		<AnimatePresence>
			{open && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-50 bg-black/50"
						onClick={onClose}
					/>
					{/* Modal Container */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{
							duration: 0.3,
							ease: [0.4, 0, 0.2, 1],
						}}
						className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white"
						onClick={(e) => {
							// Prevent closing when clicking inside modal content
							e.stopPropagation()
						}}
					>
					{/* Header */}
					{title && (
						<div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
							<h2 className="text-lg font-semibold text-slate-800">{title}</h2>
							<button
								type="button"
								onClick={onClose}
								className="ml-auto rounded-lg p-2 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
								aria-label="Close modal"
							>
								<Icon name="cross-1" className="h-5 w-5 text-slate-600" />
							</button>
						</div>
					)}
					{!title && (
						<div className="absolute right-4 top-4 z-10">
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg p-2 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
								aria-label="Close modal"
							>
								<Icon name="cross-1" className="h-5 w-5 text-slate-600" />
							</button>
						</div>
					)}
						{/* Content */}
						<div className="flex-1 overflow-auto">{children}</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}
