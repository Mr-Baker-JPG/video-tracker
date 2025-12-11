import { reactRouter } from '@react-router/dev/vite'
import {
	type SentryReactRouterBuildOptions,
	sentryReactRouter,
} from '@sentry/react-router'
import tailwindcss from '@tailwindcss/vite'
import { reactRouterDevTools } from 'react-router-devtools'
import { defineConfig } from 'vite'
import { envOnlyMacros } from 'vite-env-only'
import { iconsSpritesheet } from 'vite-plugin-icons-spritesheet'
import path from 'node:path'

const MODE = process.env.NODE_ENV

export default defineConfig((config) => ({
	resolve: {
		alias: {
			'@prisma/client/runtime/library': '@prisma/client/runtime/client',
			'.prisma/client/index-browser': path.resolve(
				process.cwd(),
				'node_modules/.prisma/client/browser',
			),
			'.prisma/client/default': path.resolve(
				process.cwd(),
				'node_modules/.prisma/client/client',
			),
		},
	},
	optimizeDeps: {
		exclude: ['@prisma/client', '@prisma/client/sql'],
	},
	build: {
		target: 'es2022',
		cssMinify: MODE === 'production',

		rollupOptions: {
			external: [
				/node:.*/,
				'fsevents',
				/@prisma\/client/,
				/@prisma\/client\/.*/,
				/\.prisma\/client/,
				/@prisma\/client\/runtime\/.*/,
			],
		},

		assetsInlineLimit: (source: string) => {
			if (
				source.endsWith('favicon.svg') ||
				source.endsWith('apple-touch-icon.png')
			) {
				return false
			}
		},

		sourcemap: true,
	},
	server: {
		watch: {
			ignored: ['**/playwright-report/**'],
		},
	},
	sentryConfig,
	plugins: [
		envOnlyMacros(),
		tailwindcss(),
		reactRouterDevTools(),

		iconsSpritesheet({
			inputDir: './other/svg-icons',
			outputDir: './app/components/ui/icons',
			fileName: 'sprite.svg',
			withTypes: true,
			iconNameTransformer: (name) => name,
		}),
		// it would be really nice to have this enabled in tests, but we'll have to
		// wait until https://github.com/remix-run/remix/issues/9871 is fixed
		MODE === 'test' ? null : reactRouter(),
		MODE === 'production' && process.env.SENTRY_AUTH_TOKEN
			? sentryReactRouter(sentryConfig, config)
			: null,
		{
			name: 'prisma-client-alias',
			resolveId(id) {
				if (id === '.prisma/client/index-browser') {
					return path.resolve(
						process.cwd(),
						'node_modules/.prisma/client/browser.ts',
					)
				}
				if (id === '.prisma/client/default') {
					return path.resolve(
						process.cwd(),
						'node_modules/.prisma/client/client.ts',
					)
				}
				// Handle @prisma/client/runtime/library import
				if (id === '@prisma/client/runtime/library') {
					return path.resolve(
						process.cwd(),
						'node_modules/@prisma/client/runtime/library.mjs',
					)
				}
				return null
			},
		},
	],
	test: {
		include: ['./app/**/*.test.{ts,tsx}'],
		setupFiles: ['./tests/setup/setup-test-env.ts'],
		globalSetup: ['./tests/setup/global-setup.ts'],
		restoreMocks: true,
		coverage: {
			include: ['app/**/*.{ts,tsx}'],
			all: true,
		},
	},
}))

const sentryConfig: SentryReactRouterBuildOptions = {
	authToken: process.env.SENTRY_AUTH_TOKEN,
	org: process.env.SENTRY_ORG,
	project: process.env.SENTRY_PROJECT,

	unstable_sentryVitePluginOptions: {
		release: {
			name: process.env.COMMIT_SHA,
			setCommits: {
				auto: true,
			},
		},
		sourcemaps: {
			filesToDeleteAfterUpload: ['./build/**/*.map', '.server-build/**/*.map'],
		},
	},
}
