import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(() => {
	return {
		plugins: [
			react(),
			tailwindcss(),
			VitePWA({
				registerType: 'autoUpdate',
				includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
				workbox: {
					runtimeCaching: [
						{
							urlPattern: ({ request }) => request.destination === 'document',
							handler: 'NetworkFirst',
							options: {
								cacheName: 'documents',
							},
						},
					],
				},
				manifest: {
					name: 'MedTest AI',
					short_name: 'MedTest',
					description: "Tibbiy ta'limda yangi bosqich - AI yordamida o'rganing",
					start_url: '/',
					display: 'standalone',
					background_color: '#0F172A',
					theme_color: '#102347',
					icons: [
						{
							src: 'https://picsum.photos/seed/med-app-icon/192/192',
							sizes: '192x192',
							type: 'image/png',
						},
						{
							src: 'https://picsum.photos/seed/med-app-icon/512/512',
							sizes: '512x512',
							type: 'image/png',
						},
						{
							src: 'https://picsum.photos/seed/med-app-icon/512/512',
							sizes: '512x512',
							type: 'image/png',
							purpose: 'any maskable',
						},
					],
				},
			}),
		],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, '.'),
			},
		},
		server: {
			// HMR is disabled in AI Studio via DISABLE_HMR env var.
			// Do not modifyâfile watching is disabled to prevent flickering during agent edits.
			hmr: process.env.DISABLE_HMR !== 'true',
		},
	}
})
