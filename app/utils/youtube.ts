/**
 * YouTube URL validation and video ID extraction utilities
 * Shared utility (can be used on both client and server)
 */

/**
 * Valid YouTube URL patterns:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/watch?feature=xyz&v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtu.be/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID&list=...
 */
const YOUTUBE_URL_PATTERNS = [
	// Standard watch URLs: youtube.com/watch?v=VIDEO_ID
	/^https?:\/\/(www\.)?(m\.)?youtube\.com\/watch\?(.*&)?v=([a-zA-Z0-9_-]{11})(&.*)?$/,
	// Short URLs: youtu.be/VIDEO_ID
	/^https?:\/\/(www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(\?.*)?$/,
]

/**
 * Validates if a string is a valid YouTube URL
 * @param url - The URL string to validate
 * @returns true if the URL is a valid YouTube URL, false otherwise
 */
export function isValidYouTubeUrl(url: string): boolean {
	if (!url || typeof url !== 'string') {
		return false
	}

	// Trim whitespace
	const trimmedUrl = url.trim()
	if (!trimmedUrl) {
		return false
	}

	// Check against known YouTube URL patterns
	return YOUTUBE_URL_PATTERNS.some((pattern) => pattern.test(trimmedUrl))
}

/**
 * Extracts the video ID from a YouTube URL
 * @param url - The YouTube URL
 * @returns The video ID if found, null otherwise
 */
export function extractYouTubeVideoId(url: string): string | null {
	if (!url || typeof url !== 'string') {
		return null
	}

	// Trim whitespace
	const trimmedUrl = url.trim()
	if (!trimmedUrl) {
		return null
	}

	// Try standard watch URLs first: youtube.com/watch?v=VIDEO_ID
	const watchMatch = trimmedUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})(?:&|$|#)/)
	if (watchMatch && watchMatch[1]) {
		return watchMatch[1]
	}

	// Try short URLs: youtu.be/VIDEO_ID
	const shortMatch = trimmedUrl.match(
		/(?:youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
	)
	if (shortMatch && shortMatch[1]) {
		return shortMatch[1]
	}

	return null
}
