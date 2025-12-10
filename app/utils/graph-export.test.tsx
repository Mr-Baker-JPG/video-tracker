/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportGraphAsPNG } from './graph-export.tsx'
import html2canvas from 'html2canvas-pro'

// Mock html2canvas-pro
vi.mock('html2canvas-pro', () => ({
	default: vi.fn(),
}))

describe('exportGraphAsPNG', () => {
	let mockCreateElement: ReturnType<typeof vi.fn>
	let mockAppendChild: ReturnType<typeof vi.fn>
	let mockRemoveChild: ReturnType<typeof vi.fn>
	let mockClick: ReturnType<typeof vi.fn>
	let mockCreateObjectURL: ReturnType<typeof vi.fn>
	let mockRevokeObjectURL: ReturnType<typeof vi.fn>

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks()

		// Create mock functions
		mockClick = vi.fn()
		mockAppendChild = vi.fn()
		mockRemoveChild = vi.fn()
		mockCreateObjectURL = vi.fn(() => 'blob:test-url')
		mockRevokeObjectURL = vi.fn()

		// Mock document.createElement
		const originalCreateElement = document.createElement.bind(document)
		mockCreateElement = vi.fn((tagName: string) => {
			if (tagName === 'a') {
				return {
					href: '',
					download: '',
					click: mockClick,
				} as unknown as HTMLAnchorElement
			}
			if (tagName === 'canvas') {
				return {
					width: 0,
					height: 0,
					toBlob: vi.fn((callback: (blob: Blob | null) => void) => {
						const blob = new Blob(['test'], { type: 'image/png' })
						callback(blob)
					}),
					getContext: vi.fn(() => ({
						fillStyle: '',
						fillRect: vi.fn(),
						drawImage: vi.fn(),
						font: '',
						textAlign: '',
						textBaseline: '',
						fillText: vi.fn(),
					})),
				} as unknown as HTMLCanvasElement
			}
			// Fallback to actual createElement for other tags
			return originalCreateElement(tagName)
		})

		// Mock document methods
		vi.spyOn(document, 'createElement').mockImplementation(
			mockCreateElement as any,
		)
		vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild)
		vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild)

		// Mock URL methods (polyfill if they don't exist in jsdom)
		if (!URL.createObjectURL) {
			;(URL as any).createObjectURL = mockCreateObjectURL
		} else {
			vi.spyOn(URL, 'createObjectURL').mockImplementation(mockCreateObjectURL)
		}

		if (!URL.revokeObjectURL) {
			;(URL as any).revokeObjectURL = mockRevokeObjectURL
		} else {
			vi.spyOn(URL, 'revokeObjectURL').mockImplementation(mockRevokeObjectURL)
		}
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('should throw error if element is not found', async () => {
		// Mock getElementById to return null
		global.document.getElementById = vi.fn(() => null)

		await expect(
			exportGraphAsPNG('non-existent-id', 'test-file'),
		).rejects.toThrow('Element with id "non-existent-id" not found')
	})

	it('should export graph as PNG when element exists', async () => {
		// Create a mock element
		const mockElement = document.createElement('div')
		mockElement.id = 'test-graph'

		// Mock getBoundingClientRect to return valid dimensions
		mockElement.getBoundingClientRect = vi.fn(() => ({
			width: 800,
			height: 600,
			top: 0,
			left: 0,
			right: 800,
			bottom: 600,
			x: 0,
			y: 0,
			toJSON: vi.fn(),
		}))

		// Mock getElementById to return the element
		global.document.getElementById = vi.fn(() => mockElement)

		// Mock html2canvas to return a canvas
		const mockCanvas = document.createElement('canvas')
		mockCanvas.width = 800
		mockCanvas.height = 600
		mockCanvas.toBlob = vi.fn((callback: (blob: Blob | null) => void) => {
			const blob = new Blob(['test'], { type: 'image/png' })
			callback(blob)
		})

		vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any)

		// Call export function
		await exportGraphAsPNG('test-graph', 'test-file')

		// Verify html2canvas-pro was called with the original element
		expect(html2canvas).toHaveBeenCalled()
		const callArgs = vi.mocked(html2canvas).mock.calls[0]
		expect(callArgs?.[0]).toBe(mockElement)
		expect(callArgs?.[1]).toMatchObject({
			backgroundColor: '#ffffff',
			scale: 2,
			logging: false,
			useCORS: true,
			allowTaint: true,
			foreignObjectRendering: false,
		})

		// Verify canvas.toBlob was called
		expect(mockCanvas.toBlob).toHaveBeenCalled()

		// Verify link was created and clicked
		expect(mockCreateElement).toHaveBeenCalledWith('a')
		expect(mockAppendChild).toHaveBeenCalled()
		expect(mockRemoveChild).toHaveBeenCalled()
		expect(mockCreateObjectURL).toHaveBeenCalled()
		expect(mockRevokeObjectURL).toHaveBeenCalled()
	})

	it('should include graph title when provided', async () => {
		// Create a mock element
		const mockElement = document.createElement('div')
		mockElement.id = 'test-graph'

		// Mock getBoundingClientRect to return valid dimensions
		mockElement.getBoundingClientRect = vi.fn(() => ({
			width: 800,
			height: 600,
			top: 0,
			left: 0,
			right: 800,
			bottom: 600,
			x: 0,
			y: 0,
			toJSON: vi.fn(),
		}))

		// Mock getElementById to return the element
		global.document.getElementById = vi.fn(() => mockElement)

		// Mock html2canvas to return a canvas
		const mockCanvas = document.createElement('canvas')
		mockCanvas.width = 800
		mockCanvas.height = 600
		const mockToBlob = vi.fn((callback: (blob: Blob | null) => void) => {
			const blob = new Blob(['test'], { type: 'image/png' })
			callback(blob)
		})
		mockCanvas.toBlob = mockToBlob

		vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any)

		// Call export function with title
		await exportGraphAsPNG('test-graph', 'test-file', 'Test Graph Title')

		// Verify html2canvas was called
		expect(html2canvas).toHaveBeenCalled()

		// Verify that a blob was created (either from original canvas or title canvas)
		// The function creates a new canvas with title, so we verify createElement was called for canvas
		expect(mockCreateElement).toHaveBeenCalledWith('canvas')
		expect(mockCreateObjectURL).toHaveBeenCalled()
	})

	it('should handle export errors gracefully', async () => {
		// Mock console.error to prevent error output in tests
		const consoleErrorSpy = vi
			.spyOn(console, 'error')
			.mockImplementation(() => {})

		// Create a mock element
		const mockElement = document.createElement('div')
		mockElement.id = 'test-graph'

		// Mock getBoundingClientRect to return valid dimensions
		mockElement.getBoundingClientRect = vi.fn(() => ({
			width: 800,
			height: 600,
			top: 0,
			left: 0,
			right: 800,
			bottom: 600,
			x: 0,
			y: 0,
			toJSON: vi.fn(),
		}))

		// Mock getElementById to return the element
		global.document.getElementById = vi.fn(() => mockElement)

		// Mock html2canvas to throw an error
		vi.mocked(html2canvas).mockRejectedValue(new Error('Canvas error'))

		// Call export function and expect it to throw
		await expect(exportGraphAsPNG('test-graph', 'test-file')).rejects.toThrow(
			'Canvas error',
		)

		// Verify console.error was called
		expect(consoleErrorSpy).toHaveBeenCalled()

		consoleErrorSpy.mockRestore()
	})
})

