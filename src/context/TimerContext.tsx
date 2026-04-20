import {
	createContext,
	PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { supabase } from '@/src/lib/supabase'
import { timerService } from '@/src/services/timer'

type TimerMode = 'countdown' | 'elapsed'

interface TimerState {
	mode: TimerMode
	startTime: number | null
	duration: number
	isRunning: boolean
	elapsedMs: number
	updatedAt: number
}

interface TimerContextValue {
	timer: TimerState
	displayMs: number
	start: () => void
	pause: () => void
	reset: () => void
	setMode: (mode: TimerMode) => void
	setDurationMinutes: (minutes: number) => void
}

const STORAGE_KEY = 'medtest_focus_timer'

const defaultTimer: TimerState = {
	mode: 'countdown',
	startTime: null,
	duration: 30 * 60,
	isRunning: false,
	elapsedMs: 0,
	updatedAt: 0,
}

const TimerContext = createContext<TimerContextValue | null>(null)

const parseStoredTimer = (): TimerState => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return defaultTimer

		const parsed = JSON.parse(raw) as Partial<TimerState>
		return {
			mode: parsed.mode === 'elapsed' ? 'elapsed' : 'countdown',
			startTime:
				typeof parsed.startTime === 'number' ? parsed.startTime : null,
			duration:
				typeof parsed.duration === 'number' && parsed.duration > 0
					? parsed.duration
					: defaultTimer.duration,
			isRunning: Boolean(parsed.isRunning),
			elapsedMs:
				typeof parsed.elapsedMs === 'number' && parsed.elapsedMs >= 0
					? parsed.elapsedMs
					: 0,
			updatedAt:
				typeof parsed.updatedAt === 'number' && parsed.updatedAt > 0
					? parsed.updatedAt
					: 0,
		}
	} catch {
		return defaultTimer
	}
}

const getDisplayMs = (timer: TimerState, now: number) => {
	const liveElapsed =
		timer.isRunning && timer.startTime ? now - timer.startTime : 0
	const totalElapsed = timer.elapsedMs + Math.max(0, liveElapsed)

	if (timer.mode === 'elapsed') {
		return totalElapsed
	}

	return Math.max(0, timer.duration * 1000 - totalElapsed)
}

const notifySoftBeep = () => {
	try {
		const AudioContextClass = window.AudioContext
		if (!AudioContextClass) return

		const audioCtx = new AudioContextClass()
		const oscillator = audioCtx.createOscillator()
		const gain = audioCtx.createGain()

		oscillator.type = 'sine'
		oscillator.frequency.value = 880
		gain.gain.value = 0.05

		oscillator.connect(gain)
		gain.connect(audioCtx.destination)
		oscillator.start()
		oscillator.stop(audioCtx.currentTime + 0.16)
	} catch {
		// Browser blocked autoplay or audio context.
	}
}

export function TimerProvider({ children }: PropsWithChildren) {
	const [timer, setTimer] = useState<TimerState>(defaultTimer)
	const [displayMs, setDisplayMs] = useState(0)
	const [isHydrated, setIsHydrated] = useState(false)
	const [authUserId, setAuthUserId] = useState<string | null>(null)
	const [hasLoadedRemote, setHasLoadedRemote] = useState(false)
	const syncTimeoutRef = useRef<number | null>(null)

	useEffect(() => {
		setTimer(parseStoredTimer())
		setIsHydrated(true)
	}, [])

	useEffect(() => {
		const loadAuthUser = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser()
			setAuthUserId(user?.id ?? null)
		}

		void loadAuthUser()
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setAuthUserId(session?.user?.id ?? null)
		})

		return () => {
			subscription.unsubscribe()
		}
	}, [])

	useEffect(() => {
		setHasLoadedRemote(false)
	}, [authUserId])

	useEffect(() => {
		if (!isHydrated) return
		localStorage.setItem(STORAGE_KEY, JSON.stringify(timer))
	}, [timer, isHydrated])

	useEffect(() => {
		if (!isHydrated || !authUserId) return

		const loadRemote = async () => {
			try {
				const remote = await timerService.getFocusTimer(authUserId)
				if (!remote) return
				setTimer(prev =>
					remote.updatedAt > prev.updatedAt
						? {
								...remote.state,
								updatedAt: remote.updatedAt,
							}
						: prev,
				)
			} catch (error) {
				console.error('Failed to load focus timer sync:', error)
			} finally {
				setHasLoadedRemote(true)
			}
		}

		void loadRemote()
	}, [authUserId, isHydrated])

	useEffect(() => {
		if (!isHydrated || !authUserId || !hasLoadedRemote) return

		if (syncTimeoutRef.current) {
			window.clearTimeout(syncTimeoutRef.current)
		}

		syncTimeoutRef.current = window.setTimeout(() => {
			void timerService
				.upsertFocusTimer(authUserId, {
					mode: timer.mode,
					startTime: timer.startTime,
					duration: timer.duration,
					isRunning: timer.isRunning,
					elapsedMs: timer.elapsedMs,
				})
				.catch(error => {
					console.error('Failed to sync focus timer:', error)
				})
		}, 1000)

		return () => {
			if (syncTimeoutRef.current) {
				window.clearTimeout(syncTimeoutRef.current)
			}
		}
	}, [timer, authUserId, isHydrated, hasLoadedRemote])

	useEffect(() => {
		if (!isHydrated) return

		const refresh = () => {
			const now = Date.now()
			const ms = getDisplayMs(timer, now)
			setDisplayMs(ms)

			if (timer.mode === 'countdown' && timer.isRunning && ms <= 0) {
				setTimer(prev => ({
					...prev,
					isRunning: false,
					startTime: null,
					updatedAt: Date.now(),
				}))
				notifySoftBeep()
			}
		}

		refresh()

		if (!timer.isRunning) return
		const interval = window.setInterval(refresh, 1000)
		return () => window.clearInterval(interval)
	}, [timer, isHydrated])

	const value = useMemo<TimerContextValue>(
		() => ({
			timer,
			displayMs,
			start: () => {
				setTimer(prev => {
					if (prev.isRunning) return prev
					return {
						...prev,
						isRunning: true,
						startTime: Date.now(),
						updatedAt: Date.now(),
					}
				})
			},
			pause: () => {
				setTimer(prev => {
					if (!prev.isRunning || !prev.startTime) return prev
					const delta = Date.now() - prev.startTime
					return {
						...prev,
						isRunning: false,
						startTime: null,
						elapsedMs: prev.elapsedMs + Math.max(0, delta),
						updatedAt: Date.now(),
					}
				})
			},
			reset: () => {
				setTimer(prev => ({
					...prev,
					isRunning: false,
					startTime: null,
					elapsedMs: 0,
					updatedAt: Date.now(),
				}))
			},
			setMode: mode => {
				setTimer(prev => ({
					...prev,
					mode,
					isRunning: false,
					startTime: null,
					elapsedMs: 0,
					updatedAt: Date.now(),
				}))
			},
			setDurationMinutes: minutes => {
				setTimer(prev => ({
					...prev,
					duration: Math.max(1, Math.floor(minutes)) * 60,
					isRunning: false,
					startTime: null,
					elapsedMs: 0,
					updatedAt: Date.now(),
				}))
			},
		}),
		[timer, displayMs],
	)

	return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export const useTimer = () => {
	const ctx = useContext(TimerContext)
	if (!ctx) {
		throw new Error('useTimer must be used within TimerProvider')
	}
	return ctx
}
