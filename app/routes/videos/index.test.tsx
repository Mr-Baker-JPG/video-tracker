/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { Outlet, createRoutesStub } from 'react-router'
import setCookieParser from 'set-cookie-parser'
import { test, expect, vi } from 'vitest'
import { loader as rootLoader } from '#app/root.tsx'
import { getSessionExpirationDate, sessionKey } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { authSessionStorage } from '#app/utils/session.server.ts'
import { createUser } from '#tests/db-utils.ts'
import { consoleWarn } from '#tests/setup/setup-test-env.ts'
import { default as VideosRoute, loader, action } from './index.tsx'

test('Video list component fetches and displays user videos', async () => {
	// Suppress expected React Router warning about route configuration
	consoleWarn.mockImplementation(() => {})

	const user = await prisma.user.create({
		select: { id: true, username: true },
		data: createUser(),
	})

	// Create test videos
	const video1 = await prisma.video.create({
		data: {
			filename: 'test-video-1.mp4',
			url: 'users/test/videos/video1.mp4',
			userId: user.id,
		},
	})

	const video2 = await prisma.video.create({
		data: {
			filename: 'test-video-2.mp4',
			url: 'users/test/videos/video2.mp4',
			userId: user.id,
		},
	})

	const session = await prisma.session.create({
		select: { id: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			userId: user.id,
		},
	})

	const authSession = await authSessionStorage.getSession()
	authSession.set(sessionKey, session.id)
	const setCookieHeader = await authSessionStorage.commitSession(authSession)
	const parsedCookie = setCookieParser.parseString(setCookieHeader)
	const cookieHeader = new URLSearchParams({
		[parsedCookie.name]: parsedCookie.value,
	}).toString()

	const App = createRoutesStub([
		{
			id: 'root',
			path: '/',
			Component: () => <Outlet />,
			loader: async (args) => {
				args.request.headers.set('cookie', cookieHeader)
				return rootLoader({ ...args, context: args.context })
			},
			HydrateFallback: () => <div>Loading...</div>,
			children: [
				{
					path: 'videos',
					// @ts-ignore - createRoutesStub type mismatch with Route.ComponentProps
					Component: VideosRoute,
					loader: async (args) => {
						args.request.headers.set('cookie', cookieHeader)
						return loader(args)
					},
				},
			],
		},
	])

	render(<App initialEntries={['/videos']} />)

	// Wait for loader to complete and component to render
	await screen.findByRole('heading', { level: 1, name: /my experiments/i })

	// Check that videos are displayed
	await waitFor(() => {
		expect(screen.getByText('test-video-1.mp4')).toBeInTheDocument()
		expect(screen.getByText('test-video-2.mp4')).toBeInTheDocument()
	})

	// Check that upload button is present
	expect(
		screen.getByRole('link', { name: /new analysis/i }),
	).toBeInTheDocument()
})

test('Video list shows empty state when no videos', async () => {
	// Suppress expected React Router warning about route configuration
	consoleWarn.mockImplementation(() => {})

	const user = await prisma.user.create({
		select: { id: true, username: true },
		data: createUser(),
	})

	const session = await prisma.session.create({
		select: { id: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			userId: user.id,
		},
	})

	const authSession = await authSessionStorage.getSession()
	authSession.set(sessionKey, session.id)
	const setCookieHeader = await authSessionStorage.commitSession(authSession)
	const parsedCookie = setCookieParser.parseString(setCookieHeader)
	const cookieHeader = new URLSearchParams({
		[parsedCookie.name]: parsedCookie.value,
	}).toString()

	const App = createRoutesStub([
		{
			id: 'root',
			path: '/',
			Component: () => <Outlet />,
			loader: async (args) => {
				args.request.headers.set('cookie', cookieHeader)
				return rootLoader({ ...args, context: args.context })
			},
			HydrateFallback: () => <div>Loading...</div>,
			children: [
				{
					path: 'videos',
					// @ts-ignore - createRoutesStub type mismatch with Route.ComponentProps
					Component: VideosRoute,
					loader: async (args) => {
						args.request.headers.set('cookie', cookieHeader)
						return loader(args)
					},
				},
			],
		},
	])

	render(<App initialEntries={['/videos']} />)

	// Wait for loader to complete and component to render
	await screen.findByRole('heading', { level: 1, name: /my experiments/i })

	// Check empty state - should show upload card
	await waitFor(() => {
		expect(
			screen.getByRole('heading', { name: /upload your experiment video/i }),
		).toBeInTheDocument()
		expect(
			screen.getByText(/drag video here or click to choose file/i),
		).toBeInTheDocument()
	})
})

test(
	'Delete button triggers delete action',
	async () => {
		// Suppress expected React Router warning about route configuration
		consoleWarn.mockImplementation(() => {})

		const user = await prisma.user.create({
			select: { id: true, username: true },
			data: createUser(),
		})

		const video = await prisma.video.create({
			data: {
				filename: 'test-video-to-delete.mp4',
				url: 'users/test/videos/delete-me.mp4',
				userId: user.id,
			},
		})

		const session = await prisma.session.create({
			select: { id: true },
			data: {
				expirationDate: getSessionExpirationDate(),
				userId: user.id,
			},
		})

		const authSession = await authSessionStorage.getSession()
		authSession.set(sessionKey, session.id)
		const setCookieHeader = await authSessionStorage.commitSession(authSession)
		const parsedCookie = setCookieParser.parseString(setCookieHeader)
		const cookieHeader = new URLSearchParams({
			[parsedCookie.name]: parsedCookie.value,
		}).toString()

		const App = createRoutesStub([
			{
				id: 'root',
				path: '/',
				Component: () => <Outlet />,
				loader: async (args) => {
					args.request.headers.set('cookie', cookieHeader)
					return rootLoader({ ...args, context: args.context })
				},
				HydrateFallback: () => <div>Loading...</div>,
				children: [
					{
						path: 'videos',
						// @ts-ignore - createRoutesStub type mismatch with Route.ComponentProps
						Component: VideosRoute,
						loader: async (args) => {
							args.request.headers.set('cookie', cookieHeader)
							return loader(args)
						},
						action: async (args) => {
							args.request.headers.set('cookie', cookieHeader)
							return action(args)
						},
					},
				],
			},
		])

		render(<App initialEntries={['/videos']} />)

		// Wait for loader to complete and component to render
		await screen.findByRole('heading', { level: 1, name: /my experiments/i })

		// Wait for video to be displayed
		await waitFor(() => {
			expect(screen.getByText('test-video-to-delete.mp4')).toBeInTheDocument()
		})

		// Verify video exists before deletion
		const videoBefore = await prisma.video.findUnique({
			where: { id: video.id },
		})
		expect(videoBefore).toBeDefined()

		// Find the delete button (trash icon) - it's hidden until hover, so we need to query it directly
		const userEventInstance = userEvent.setup()
		const videoCard = screen
			.getByText('test-video-to-delete.mp4')
			.closest('.group')
		expect(videoCard).toBeInTheDocument()

		// Find delete button by aria-label or role
		const deleteButton = videoCard?.querySelector(
			'button[aria-label*="delete" i], button:has(svg)',
		)
		expect(deleteButton).toBeInTheDocument()

		// Click delete button to open dialog
		await userEventInstance.click(deleteButton!)

		// Wait for dialog to appear
		await waitFor(() => {
			expect(
				screen.getByText(/are you sure you want to delete/i),
			).toBeInTheDocument()
		})

		// Find and click the confirm delete button in the dialog
		const confirmDeleteButton = screen.getByRole('button', {
			name: /^delete$/i,
		})
		expect(confirmDeleteButton).toBeInTheDocument()

		await userEventInstance.click(confirmDeleteButton)

		// Wait for deletion to complete
		await waitFor(
			async () => {
				const videoAfter = await prisma.video.findUnique({
					where: { id: video.id },
				})
				expect(videoAfter).toBeNull()
			},
			{ timeout: 10000 },
		)
	},
	{ timeout: 15000 },
)
