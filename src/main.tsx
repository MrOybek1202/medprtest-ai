import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { TimerProvider } from './context/TimerContext.tsx'
import './index.css'

// Suppress Vite WebSocket connection errors in the console
if (typeof window !== 'undefined') {
	const originalError = console.error
	console.error = (...args) => {
		const msg = args[0] && typeof args[0] === 'string' ? args[0] : ''
		if (
			msg.includes('[vite] failed to connect to websocket') ||
			msg.includes('WebSocket closed without opened') ||
			msg.includes('WebSocket connection to') ||
			msg.includes('HMR')
		) {
			return
		}
		originalError.apply(console, args)
	}

	const originalWarn = console.warn
	console.warn = (...args) => {
		const msg = args[0] && typeof args[0] === 'string' ? args[0] : ''
		if (
			msg.includes('[vite]') ||
			msg.includes('WebSocket') ||
			msg.includes('HMR')
		) {
			return
		}
		originalWarn.apply(console, args)
	}

	window.addEventListener(
		'unhandledrejection',
		event => {
			const msg = event.reason?.message || ''
			const stack = event.reason?.stack || ''
			if (
				msg.includes('WebSocket') ||
				msg.includes('vite') ||
				msg.includes('HMR') ||
				stack.includes('WebSocket') ||
				stack.includes('vite')
			) {
				event.preventDefault()
				event.stopPropagation()
			}
		},
		true,
	)

	window.addEventListener(
		'error',
		event => {
			const msg = event.message || ''
			if (
				msg.includes('WebSocket') ||
				msg.includes('vite') ||
				msg.includes('HMR')
			) {
				event.preventDefault()
				event.stopPropagation()
			}
		},
		true,
	)
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<TimerProvider>
			<App />
		</TimerProvider>
	</StrictMode>,
)
