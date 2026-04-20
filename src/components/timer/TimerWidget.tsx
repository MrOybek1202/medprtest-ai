import { useTimer } from '@/src/context/TimerContext'
import { Pause, Play, RotateCcw, Timer as TimerIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const toClock = (milliseconds: number) => {
	const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60

	if (hours > 0) {
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
	}
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function TimerWidget() {
	const { timer, displayMs, start, pause, reset, setMode, setDurationMinutes } =
		useTimer()
	const [isExpanded, setIsExpanded] = useState(false)
	const [justCompleted, setJustCompleted] = useState(false)

	const statusColor = useMemo(() => {
		if (timer.mode === 'elapsed') return 'text-[#2c5ff2]'
		const total = timer.duration * 1000
		const ratio = total > 0 ? displayMs / total : 0
		if (ratio <= 0.2) return 'text-red-500'
		if (ratio <= 0.5) return 'text-amber-500'
		return 'text-[#2c5ff2]'
	}, [displayMs, timer.duration, timer.mode])

	useEffect(() => {
		if (timer.mode === 'countdown' && displayMs === 0) {
			setJustCompleted(true)
			return
		}
		setJustCompleted(false)
	}, [timer.mode, displayMs])

	return (
		<div className='fixed bottom-44 right-4 md:bottom-40 md:right-8 lg:bottom-28 lg:right-8 z-[90] select-none'>
			{!isExpanded ? (
				<button
					onClick={() => setIsExpanded(true)}
					className='flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-lg shadow-slate-200/60 transition hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30'
				>
					<TimerIcon size={16} className='text-slate-500' />
					<span className={`font-mono text-sm font-bold ${statusColor}`}>
						{toClock(displayMs)}
					</span>
				</button>
			) : (
				<div className='w-[300px] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/40 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40'>
					<div className='mb-3 flex items-center justify-between'>
						<p className='text-xs font-semibold uppercase tracking-widest text-slate-500'>
							Focus timer
						</p>
						<button
							onClick={() => setIsExpanded(false)}
							className='rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
						>
							Close
						</button>
					</div>

					<div
						className={`mb-4 text-center font-mono text-4xl font-bold tracking-tight ${statusColor}`}
					>
						{toClock(displayMs)}
					</div>

					<div className='mb-3 grid grid-cols-2 gap-2'>
						<button
							onClick={() => setMode('countdown')}
							className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
								timer.mode === 'countdown'
									? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
									: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
							}`}
						>
							Countdown
						</button>
						<button
							onClick={() => setMode('elapsed')}
							className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
								timer.mode === 'elapsed'
									? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
									: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
							}`}
						>
							Elapsed
						</button>
					</div>

					{timer.mode === 'countdown' && (
						<div className='mb-4 flex gap-2'>
							{[15, 30, 45, 60].map(min => (
								<button
									key={min}
									onClick={() => setDurationMinutes(min)}
									className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${
										timer.duration / 60 === min
											? 'bg-[#2c5ff2] text-white'
											: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
									}`}
								>
									{min}m
								</button>
							))}
						</div>
					)}

					<div className='grid grid-cols-3 gap-2'>
						<button
							onClick={timer.isRunning ? pause : start}
							className='flex items-center justify-center gap-1 rounded-xl bg-[#2c5ff2] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1f4dd1]'
						>
							{timer.isRunning ? <Pause size={15} /> : <Play size={15} />}
							{timer.isRunning ? 'Pause' : 'Start'}
						</button>
						<button
							onClick={reset}
							className='col-span-2 flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
						>
							<RotateCcw size={15} />
							Reset
						</button>
					</div>

					{justCompleted && (
						<p className='mt-3 rounded-lg bg-amber-100 px-3 py-2 text-center text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'>
							Break time
						</p>
					)}
				</div>
			)}
		</div>
	)
}
