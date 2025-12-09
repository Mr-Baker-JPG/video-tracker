import html2canvas from 'html2canvas-pro'

/**
 * Export a graph element as PNG image
 * @param elementId - The ID of the element to export (should be a container with the graph)
 * @param filename - The filename for the downloaded image (without extension)
 * @param graphTitle - Optional title to add to the exported image
 */
export async function exportGraphAsPNG(
	elementId: string,
	filename: string,
	graphTitle?: string,
): Promise<void> {
	const element = document.getElementById(elementId)
	if (!element) {
		throw new Error(`Element with id "${elementId}" not found`)
	}

	try {
		// Get original element dimensions
		const rect = element.getBoundingClientRect()
		const originalWidth = rect.width
		const originalHeight = rect.height

		// Ensure we have valid dimensions
		if (originalWidth === 0 || originalHeight === 0) {
			throw new Error(
				'Failed to capture graph: element has no dimensions. ' +
					'Please ensure the graph is visible before exporting.',
			)
		}

		// Use html2canvas-pro to capture the element (supports oklch colors natively)
		const canvas = await html2canvas(element, {
			backgroundColor: '#ffffff',
			scale: 2, // Higher scale for better quality
			logging: false,
			useCORS: true,
			allowTaint: true,
			foreignObjectRendering: false,
			width: originalWidth,
			height: originalHeight,
		})

		// Verify canvas has valid dimensions
		if (canvas.width === 0 || canvas.height === 0) {
			throw new Error(
				'Failed to capture graph: element has no dimensions. ' +
					'Please ensure the graph is visible before exporting.',
			)
		}

		// If a title is provided, add it to the canvas
		let finalCanvas = canvas
		if (graphTitle) {
			finalCanvas = await addTitleToCanvas(canvas, graphTitle)
		}

		// Convert canvas to blob and download
		finalCanvas.toBlob((blob) => {
			if (!blob) {
				throw new Error('Failed to create image blob')
			}

			const url = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `${filename}.png`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			URL.revokeObjectURL(url)
		}, 'image/png')
	} catch (error) {
		console.error('Error exporting graph:', error)

		throw error
	}
}

/**
 * Add a title to the top of a canvas
 */
async function addTitleToCanvas(
	canvas: HTMLCanvasElement,
	title: string,
): Promise<HTMLCanvasElement> {
	const titleHeight = 40
	const padding = 20

	// Create a new canvas with space for the title
	const newCanvas = document.createElement('canvas')
	newCanvas.width = canvas.width
	newCanvas.height = canvas.height + titleHeight + padding * 2
	const ctx = newCanvas.getContext('2d')

	if (!ctx) {
		return canvas // Return original if context creation fails
	}

	// Fill background
	ctx.fillStyle = '#ffffff'
	ctx.fillRect(0, 0, newCanvas.width, newCanvas.height)

	// Draw title
	ctx.fillStyle = '#000000'
	ctx.font = 'bold 18px Arial'
	ctx.textAlign = 'center'
	ctx.textBaseline = 'top'
	ctx.fillText(title, newCanvas.width / 2, padding)

	// Draw original canvas below title
	ctx.drawImage(canvas, 0, titleHeight + padding)

	return newCanvas
}
