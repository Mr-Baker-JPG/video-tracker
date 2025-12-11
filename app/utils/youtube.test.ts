import { describe, expect, test } from 'vitest'
import { isValidYouTubeUrl, extractYouTubeVideoId } from './youtube.ts'

describe('isValidYouTubeUrl', () => {
	test('accepts valid standard YouTube URLs', () => {
		expect(
			isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
		).toBe(true)
		expect(isValidYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
			true,
		)
		expect(
			isValidYouTubeUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ'),
		).toBe(true)
	})

	test('accepts valid YouTube URLs with additional parameters', () => {
		expect(
			isValidYouTubeUrl(
				'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxyz&index=1',
			),
		).toBe(true)
		expect(
			isValidYouTubeUrl(
				'https://www.youtube.com/watch?feature=xyz&v=dQw4w9WgXcQ',
			),
		).toBe(true)
	})

	test('accepts valid YouTube short URLs', () => {
		expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
		expect(isValidYouTubeUrl('https://www.youtu.be/dQw4w9WgXcQ')).toBe(true)
		expect(isValidYouTubeUrl('http://youtu.be/dQw4w9WgXcQ')).toBe(true)
	})

	test('accepts valid mobile YouTube URLs', () => {
		expect(isValidYouTubeUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
			true,
		)
	})

	test('rejects invalid URLs', () => {
		expect(isValidYouTubeUrl('not a url')).toBe(false)
		expect(isValidYouTubeUrl('https://example.com')).toBe(false)
		expect(isValidYouTubeUrl('https://vimeo.com/123456789')).toBe(false)
		expect(isValidYouTubeUrl('')).toBe(false)
		expect(isValidYouTubeUrl('   ')).toBe(false)
	})

	test('rejects YouTube URLs with invalid video ID length', () => {
		expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=short')).toBe(
			false,
		)
		expect(
			isValidYouTubeUrl(
				'https://www.youtube.com/watch?v=thisiswaytoolongtobeavideoid',
			),
		).toBe(false)
	})

	test('handles null and undefined', () => {
		expect(isValidYouTubeUrl(null as any)).toBe(false)
		expect(isValidYouTubeUrl(undefined as any)).toBe(false)
	})

	test('trims whitespace', () => {
		expect(
			isValidYouTubeUrl('  https://www.youtube.com/watch?v=dQw4w9WgXcQ  '),
		).toBe(true)
	})
})

describe('extractYouTubeVideoId', () => {
	test('extracts video ID from standard watch URLs', () => {
		expect(
			extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
		).toBe('dQw4w9WgXcQ')
		expect(
			extractYouTubeVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ'),
		).toBe('dQw4w9WgXcQ')
		expect(
			extractYouTubeVideoId('http://www.youtube.com/watch?v=dQw4w9WgXcQ'),
		).toBe('dQw4w9WgXcQ')
	})

	test('extracts video ID from URLs with additional parameters', () => {
		expect(
			extractYouTubeVideoId(
				'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxyz',
			),
		).toBe('dQw4w9WgXcQ')
		expect(
			extractYouTubeVideoId(
				'https://www.youtube.com/watch?feature=xyz&v=dQw4w9WgXcQ',
			),
		).toBe('dQw4w9WgXcQ')
		expect(
			extractYouTubeVideoId(
				'https://www.youtube.com/watch?v=dQw4w9WgXcQ&index=1&list=PLxyz',
			),
		).toBe('dQw4w9WgXcQ')
	})

	test('extracts video ID from short URLs', () => {
		expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe(
			'dQw4w9WgXcQ',
		)
		expect(extractYouTubeVideoId('https://www.youtu.be/dQw4w9WgXcQ')).toBe(
			'dQw4w9WgXcQ',
		)
		expect(extractYouTubeVideoId('http://youtu.be/dQw4w9WgXcQ')).toBe(
			'dQw4w9WgXcQ',
		)
		expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=42')).toBe(
			'dQw4w9WgXcQ',
		)
	})

	test('extracts video ID from embed URLs', () => {
		expect(
			extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'),
		).toBe('dQw4w9WgXcQ')
	})

	test('returns null for invalid URLs', () => {
		expect(extractYouTubeVideoId('not a url')).toBe(null)
		expect(extractYouTubeVideoId('https://example.com')).toBe(null)
		expect(extractYouTubeVideoId('')).toBe(null)
		expect(extractYouTubeVideoId('   ')).toBe(null)
	})

	test('returns null for URLs without valid video ID', () => {
		expect(
			extractYouTubeVideoId('https://www.youtube.com/watch?v=invalid'),
		).toBe(null)
		expect(
			extractYouTubeVideoId('https://www.youtube.com/watch?v=thisiswaytoolong'),
		).toBe(null)
	})

	test('handles null and undefined', () => {
		expect(extractYouTubeVideoId(null as any)).toBe(null)
		expect(extractYouTubeVideoId(undefined as any)).toBe(null)
	})

	test('trims whitespace', () => {
		expect(
			extractYouTubeVideoId('  https://www.youtube.com/watch?v=dQw4w9WgXcQ  '),
		).toBe('dQw4w9WgXcQ')
	})
})





