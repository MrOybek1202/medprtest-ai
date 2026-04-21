import { supabase } from '@/src/lib/supabase'
import {
	Bell,
	Camera,
	ChevronRight,
	Download,
	Eye,
	EyeOff,
	Globe,
	Lock,
	LogOut,
	Moon,
	RefreshCcw,
	Save,
	Shield,
	Sun,
	User,
} from 'lucide-react'
import { motion } from 'motion/react'
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface ProfileSettingsProps {
	userId: string
	authUserId: string
	userEmail: string
	authProvider?: string
	onSignOut: () => void
	onInstall?: () => void
	mode: 'profile' | 'settings'
}

// ─── Activity Heatmap ────────────────────────────────────────────────────────

interface HeatPoint {
	key: string
	count: number
	date: Date
}

const buildLocalDateKey = (date: Date) =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
		2,
		'0',
	)}-${String(date.getDate()).padStart(2, '0')}`

const buildLocalDateFromKey = (key: string) => {
	const [year, month, day] = key.split('-').map(Number)
	return new Date(year, month - 1, day, 12, 0, 0, 0)
}

const getMondayBasedDayIndex = (date: Date) => {
	const day = date.getDay()
	return day === 0 ? 6 : day - 1
}

function ActivityHeatmap({ data }: { data: HeatPoint[] }) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [tooltip, setTooltip] = useState<{
		text: string
		x: number
		y: number
		visible: boolean
	}>({ text: '', x: 0, y: 0, visible: false })

	if (!data.length) {
		return (
			<div className='h-32 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm'>
				Faollik ma&apos;lumotlari yuklanmoqda...
			</div>
		)
	}

	const isDark =
		typeof window !== 'undefined' &&
		document.documentElement.classList.contains('dark')

	const colors = isDark
		? ['#1e293b', '#1a3270', '#1f4bbf', '#2c5ff2', '#4f7ef7']
		: ['#f0f4ff', '#c7d7fd', '#93b4fb', '#4f7ef7', '#2c5ff2']

	const getLevel = (count: number) => {
		if (count === 0) return 0
		if (count <= 1) return 1
		if (count <= 4) return 2
		if (count <= 9) return 3
		return 4
	}

	const total = data.reduce((s, d) => s + d.count, 0)
	const best = data.length ? Math.max(...data.map(d => d.count)) : 0
	let streak = 0,
		cur = 0
	for (let i = data.length - 1; i >= 0; i--) {
		if (data[i].count > 0) cur++
		else {
			if (cur > streak) streak = cur
			cur = 0
		}
	}
	if (cur > streak) streak = cur

	// Build weeks grid
	const firstDay = data[0] ? getMondayBasedDayIndex(data[0].date) : 0
	const paddedDays: (HeatPoint | null)[] = [...Array(firstDay).fill(null), ...data]
	const weeks: (HeatPoint | null)[][] = []
	for (let i = 0; i < paddedDays.length; i += 7) {
		weeks.push(paddedDays.slice(i, i + 7))
	}

	const months = [
		'Yan',
		'Fev',
		'Mar',
		'Apr',
		'May',
		'Iyn',
		'Iyl',
		'Avg',
		'Sen',
		'Okt',
		'Noy',
		'Dek',
	]
	const dayLabels = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

	// Month label positions
	const monthLabels: { label: string; col: number }[] = []
	let lastMonth = -1
	weeks.forEach((week, wi) => {
		const first = week.find(d => d !== null)
		if (first && first.date.getMonth() !== lastMonth) {
			lastMonth = first.date.getMonth()
			monthLabels.push({ label: months[lastMonth], col: wi })
		}
	})

	const handleMouseMove = (e: React.MouseEvent, point: HeatPoint) => {
		const rect = containerRef.current?.getBoundingClientRect()
		if (!rect) return
		const ds = point.date.toLocaleDateString('uz-UZ', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
		})
		const tooltipText =
			point.count === 0
				? `Faollik yo'q - ${ds}`
				: `${point.count} test - ${ds}`
		setTooltip({
			text: tooltipText,
			x: e.clientX - rect.left + 14,
			y: e.clientY - rect.top - 42,
			visible: true,
		})
	}

	return (
		<div className='space-y-4'>
			{/* Stats row */}
			<div className='grid grid-cols-3 gap-3'>
				<div className='bg-gradient-to-br from-[#2c5ff2] to-[#4f7ef7] rounded-2xl p-4 text-white'>
					<p className='text-2xl font-bold leading-none'>{total}</p>
					<p className='text-[11px] uppercase tracking-widest opacity-75 mt-1 font-medium'>
						Yillik testlar
					</p>
				</div>
				<div className='bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4'>
					<p className='text-2xl font-bold leading-none text-slate-900 dark:text-white'>
						{streak}
					</p>
					<p className='text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1 font-medium'>
						Ketma-ket kun
					</p>
				</div>
				<div className='bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4'>
					<p className='text-2xl font-bold leading-none text-slate-900 dark:text-white'>
						{best}
					</p>
					<p className='text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1 font-medium'>
						Eng yaxshi kun
					</p>
				</div>
			</div>

			{/* Grid card */}
			<div
				ref={containerRef}
				className='relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] p-5'
			>
				{/* Tooltip */}
				{tooltip.visible && (
					<div
						className='absolute z-20 bg-slate-800 text-slate-100 text-xs rounded-lg px-3 py-1.5 pointer-events-none whitespace-nowrap'
						style={{ left: tooltip.x, top: tooltip.y }}
					>
						{tooltip.text}
					</div>
				)}

				<div className='flex gap-3 overflow-x-auto pb-1'>
					{/* Day labels */}
					<div className='flex flex-col gap-[3px] pt-[22px] flex-shrink-0 text-[11px] text-slate-400 dark:text-slate-600'>
						{dayLabels.map((label, i) => (
							<span
								key={i}
								className='h-[14px] leading-[14px]'
								style={{ visibility: label ? 'visible' : 'hidden' }}
							>
								{label || 'x'}
							</span>
						))}
					</div>

					{/* Month labels + grid */}
					<div className='flex-shrink-0'>
						{/* Month labels */}
						<div className='relative h-[18px] mb-1'>
							{monthLabels.map(({ label, col }) => (
								<span
									key={label + col}
									className='absolute text-[11px] text-slate-400 dark:text-slate-600'
									style={{ left: col * 17 }}
								>
									{label}
								</span>
							))}
						</div>

						{/* Cells */}
						<div className='flex gap-[3px]'>
							{weeks.map((week, wi) => (
								<div key={wi} className='flex flex-col gap-[3px]'>
									{week.map((point, di) => (
										<div
											key={di}
											className='w-[14px] h-[14px] rounded-[4px] transition-transform duration-100 hover:scale-[1.35] hover:z-10 relative cursor-default'
											style={{
												background: point
													? colors[getLevel(point.count)]
													: 'transparent',
												opacity: point === null ? 0 : 1,
											}}
											onMouseMove={e => point && handleMouseMove(e, point)}
											onMouseLeave={() =>
												setTooltip(t => ({ ...t, visible: false }))
											}
										/>
									))}
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Legend */}
				<div className='flex items-center gap-[6px] mt-3 justify-end'>
					<span className='text-[11px] text-slate-400 dark:text-slate-600'>
						Kam
					</span>
					{colors.map((c, i) => (
						<div
							key={i}
							className='w-[14px] h-[14px] rounded-[3px]'
							style={{ background: c }}
						/>
					))}
					<span className='text-[11px] text-slate-400 dark:text-slate-600'>
						Ko'p
					</span>
				</div>
			</div>
		</div>
	)
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProfileSettings({
	userId,
	authUserId,
	userEmail,
	authProvider = 'email',
	onSignOut,
	onInstall,
	mode,
}: ProfileSettingsProps) {
	const [fullName, setFullName] = useState('')
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [isChangingPassword, setIsChangingPassword] = useState(false)
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [passwordResetCode, setPasswordResetCode] = useState('')
	const [passwordResetStep, setPasswordResetStep] = useState<'idle' | 'verify'>(
		'idle',
	)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [isPWA, setIsPWA] = useState(false)
	const [stats, setStats] = useState({ solved: 0, accuracy: 0, streak: 0 })
	const [activity, setActivity] = useState<HeatPoint[]>([])
	const [isDarkMode, setIsDarkMode] = useState(() => {
		if (typeof window !== 'undefined') {
			return (
				document.documentElement.classList.contains('dark') ||
				localStorage.getItem('theme') === 'dark'
			)
		}
		return false
	})
	const fileInputRef = useRef<HTMLInputElement>(null)
	const isGoogleAccount = authProvider.toLowerCase() === 'google'
	const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

	const upsertProfile = async (payload: {
		full_name?: string | null
		avatar_url?: string | null
	}) => {
		const normalizedName =
			payload.full_name === undefined ? undefined : payload.full_name?.trim() || null

		const { data: updatedRows, error: updateError } = await supabase
			.from('users')
			.update({
				...(normalizedName !== undefined ? { full_name: normalizedName } : {}),
				...(payload.avatar_url !== undefined
					? { avatar_url: payload.avatar_url }
					: {}),
			})
			.eq('auth_user_id', authUserId)
			.select('id, full_name, avatar_url')

		if (updateError) throw updateError

		if (updatedRows && updatedRows.length > 0) {
			const updated = updatedRows[0]
			setFullName(updated.full_name || '')
			setAvatarUrl(updated.avatar_url || null)
			return
		}

		const { data: inserted, error: insertError } = await supabase
			.from('users')
			.insert({
				auth_user_id: authUserId,
				email: userEmail,
				full_name: normalizedName || userEmail.split('@')[0],
				avatar_url: payload.avatar_url ?? null,
				role: 'user',
			})
			.select('id, full_name, avatar_url')
			.single()

		if (insertError) throw insertError
		setFullName(inserted.full_name || '')
		setAvatarUrl(inserted.avatar_url || null)
	}

	useEffect(() => {
		const fetchProfile = async () => {
			// 1. Users — ism va avatar
			const { data: profile } = await supabase
				.from('users')
				.select('full_name, avatar_url')
				.eq('auth_user_id', authUserId)
				.single()

			if (profile) {
				setFullName(profile.full_name || '')
				setAvatarUrl(profile.avatar_url || null)
			}

			// 2. Stats — overall_accuracy va study_streak
			// 3. question_attempts — yechilgan savollar soni
			const { count: solvedCount } = await supabase
				.from('question_attempts')
				.select('id', { count: 'exact', head: true })
				.eq('user_id', userId)

			const { count: correctCount } = await supabase
				.from('question_attempts')
				.select('id', { count: 'exact', head: true })
				.eq('user_id', userId)
				.eq('is_correct', true)


			// 4. Sessions — heatmap uchun (faqat completed, oxirgi 365 kun)
			const yearAgo = new Date()
			yearAgo.setDate(yearAgo.getDate() - 365)

			const { data: attempts } = await supabase
				.from('question_attempts')
				.select('created_at')
				.eq('user_id', userId)
				.gte('created_at', yearAgo.toISOString())

			const countsByDay: Record<string, number> = {}
			for (const attempt of attempts || []) {
				const key = buildLocalDateKey(new Date(attempt.created_at))
				countsByDay[key] = (countsByDay[key] || 0) + 1
			}

			const today = new Date()
			const series: HeatPoint[] = []
			for (let i = 364; i >= 0; i--) {
				const d = new Date(today)
				d.setDate(today.getDate() - i)
				const key = buildLocalDateKey(d)
				series.push({
					key,
					count: countsByDay[key] || 0,
					date: buildLocalDateFromKey(key),
				})
			}

			let streak = 0
			for (let i = series.length - 1; i >= 0; i--) {
				if (series[i].count > 0) {
					streak++
					continue
				}
				if (i === series.length - 1) {
					continue
				}
				break
			}

			const accuracy =
				solvedCount && solvedCount > 0
					? Math.round(((correctCount || 0) / solvedCount) * 100)
					: 0

			setStats({
				solved: solvedCount || 0,
				accuracy,
				streak,
			})
			setActivity(series)
		}

		fetchProfile()

		if (isDarkMode) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}

		if (
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as any).standalone
		) {
			setIsPWA(true)
		}
	}, [authUserId, isDarkMode, userId])

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await upsertProfile({ full_name: fullName, avatar_url: avatarUrl })
			toast.success("Ma'lumotlar muvaffaqiyatli saqlandi")
		} catch (error: any) {
			toast.error('Xatolik yuz berdi: ' + error.message)
		} finally {
			setIsSaving(false)
		}
	}

	const handlePasswordChange = async (e: React.FormEvent) => {
		e.preventDefault()
		if (newPassword.length < 6) {
			toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
			return
		}
		if (newPassword !== confirmPassword) {
			toast.error('Parollar mos kelmadi')
			return
		}
		setIsChangingPassword(true)
		try {
			if (passwordResetStep === 'idle') {
				const response = await fetch(`${apiBase}/api/auth/password-reset/send`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: userEmail }),
				})
				const result = await response.json()
				if (!response.ok) throw new Error(result.error || 'Kod yuborilmadi')
				setPasswordResetStep('verify')
				toast.success('Tasdiqlash kodi emailingizga yuborildi')
				return
			}

			if (!passwordResetCode.trim()) {
				throw new Error('Emailga yuborilgan 6 xonali kodni kiriting')
			}

			const verifyResponse = await fetch(
				`${apiBase}/api/auth/password-reset/verify`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: userEmail,
						code: passwordResetCode,
					}),
				},
			)
			const verifyResult = await verifyResponse.json()
			if (!verifyResponse.ok) {
				throw new Error(verifyResult.error || 'Kod noto‘g‘ri yoki eskirgan')
			}

			const completeResponse = await fetch(
				`${apiBase}/api/auth/password-reset/complete`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: userEmail,
						resetToken: verifyResult.resetToken,
						newPassword,
					}),
				},
			)
			const completeResult = await completeResponse.json()
			if (!completeResponse.ok) {
				throw new Error(
					completeResult.error || 'Parolni yangilashda xatolik yuz berdi',
				)
			}

			toast.success('Parol muvaffaqiyatli yangilandi')
			setNewPassword('')
			setConfirmPassword('')
			setPasswordResetCode('')
			setPasswordResetStep('idle')
		} catch (error: any) {
			toast.error('Xatolik yuz berdi: ' + error.message)
		} finally {
			setIsChangingPassword(false)
		}
	}

	const toggleDarkMode = () => {
		const newMode = !isDarkMode
		setIsDarkMode(newMode)
		if (newMode) {
			document.documentElement.classList.add('dark')
			localStorage.setItem('theme', 'dark')
		} else {
			document.documentElement.classList.remove('dark')
			localStorage.setItem('theme', 'light')
		}
	}

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		if (file.size > 2 * 1024 * 1024) {
			toast.error('Rasm hajmi 2MB dan oshmasligi kerak')
			return
		}
		const reader = new FileReader()
		reader.onloadend = async () => {
			const nextAvatarUrl = reader.result as string
			setAvatarUrl(nextAvatarUrl)
			setIsSaving(true)
			try {
				await upsertProfile({ full_name: fullName, avatar_url: nextAvatarUrl })
				toast.success('Avatar muvaffaqiyatli saqlandi')
			} catch (error: any) {
				toast.error('Avatarni saqlashda xatolik: ' + error.message)
			} finally {
				setIsSaving(false)
			}
		}
		reader.readAsDataURL(file)
	}

	const handleClearCache = async () => {
		try {
			if ('serviceWorker' in navigator) {
				const registrations = await navigator.serviceWorker.getRegistrations()
				for (const r of registrations) await r.unregister()
			}
			const cacheNames = await caches.keys()
			for (const name of cacheNames) await caches.delete(name)
			localStorage.removeItem('medtest_ai_cache')
			toast.success('Kesh tozalandi. Ilova qayta yuklanmoqda...')
			setTimeout(() => window.location.reload(), 1500)
		} catch {
			toast.error('Keshni tozalashda xatolik yuz berdi')
		}
	}

	if (mode === 'profile') {
		return (
			<div className='p-4 md:p-6 max-w-5xl mx-auto space-y-8 pb-32 lg:pb-8 dark:bg-[#0F172A]'>
				<header>
					<h1 className='text-2xl md:text-3xl font-bold text-slate-900 dark:text-white'>
						Profil
					</h1>
					<p className='text-slate-500 dark:text-slate-400 mt-1 text-sm'>
						Shaxsiy ma&apos;lumotlar va o&apos;qish faolligingiz.
					</p>
				</header>

				<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
					{/* Left column */}
					<div className='md:col-span-1 space-y-6'>
						<div className='bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm text-center'>
							<div className='relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-6'>
								<div className='w-full h-full rounded-[32px] md:rounded-[48px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 overflow-hidden'>
									{avatarUrl ? (
										<img
											src={avatarUrl}
											alt='Avatar'
											className='w-full h-full object-cover'
											referrerPolicy='no-referrer'
										/>
									) : (
										<User size={48} />
									)}
								</div>
								<input
									type='file'
									ref={fileInputRef}
									onChange={handleFileChange}
									accept='image/*'
									className='hidden'
								/>
								<button
									onClick={() => fileInputRef.current?.click()}
									className='absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-8 h-8 md:w-10 md:h-10 bg-[#2c5ff2] text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900 hover:scale-110 transition-transform'
								>
									<Camera size={16} />
								</button>
							</div>
							<h3 className='text-lg md:text-xl font-bold text-slate-900 dark:text-white'>
								{fullName || 'Foydalanuvchi'}
							</h3>
							<p className='text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1'>
								{userEmail}
							</p>
							<div className='mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-center gap-3'>
								<div className='text-center'>
									<p className='text-base md:text-lg font-bold text-slate-900 dark:text-white'>
										{stats.solved}
									</p>
									<p className='text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest'>
										Yechilgan
									</p>
								</div>
								<div className='w-px h-8 bg-slate-100 dark:bg-slate-800' />
								<div className='text-center'>
									<p className='text-base md:text-lg font-bold text-slate-900 dark:text-white'>
										{stats.accuracy}%
									</p>
									<p className='text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest'>
										Aniqlik
									</p>
								</div>
								<div className='w-px h-8 bg-slate-100 dark:bg-slate-800' />
								<div className='text-center'>
									<p className='text-base md:text-lg font-bold text-slate-900 dark:text-white'>
										{stats.streak}
									</p>
									<p className='text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest'>
										Streak
									</p>
								</div>
							</div>
						</div>

						<button
							onClick={handleSave}
							disabled={isSaving}
							className='w-full bg-[#2c5ff2] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#1f4dd1] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#2c5ff2]/20 disabled:opacity-50'
						>
							{isSaving ? (
								<div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
							) : (
								<Save size={18} />
							)}
							Saqlash
						</button>
					</div>

					{/* Right column */}
					<div className='md:col-span-2 space-y-6'>
						{/* Personal info */}
						<section className='bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6'>
							<div className='flex items-center gap-3 mb-2'>
								<div className='w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[#2c5ff2]'>
									<User size={20} />
								</div>
								<h3 className='font-bold text-slate-900 dark:text-white'>
									Shaxsiy ma&apos;lumotlar
								</h3>
							</div>
							<div className='grid grid-cols-1 gap-4'>
								<div className='space-y-2'>
									<label className='text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1'>
										To&apos;liq ism
									</label>
									<input
										type='text'
										value={fullName}
										onChange={e => setFullName(e.target.value)}
										className='w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#2c5ff2]/20 focus:border-[#2c5ff2] transition-all'
									/>
								</div>
								<div className='space-y-2'>
									<label className='text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1'>
										Email manzili
									</label>
									<input
										type='email'
										value={userEmail}
										disabled
										className='w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-slate-400 dark:text-slate-500 font-medium cursor-not-allowed'
									/>
								</div>
							</div>
						</section>

						{/* Activity heatmap */}
						<section className='bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4'>
							<div className='flex items-center justify-between'>
								<div>
									<h3 className='font-bold text-slate-900 dark:text-white'>
										Faollik
									</h3>
									<p className='text-xs text-slate-400 dark:text-slate-500 mt-0.5'>
										So&apos;nggi 365 kun
									</p>
								</div>
							</div>
							<ActivityHeatmap data={activity} />
						</section>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='p-4 md:p-6 max-w-4xl mx-auto space-y-8 pb-32 lg:pb-8 dark:bg-[#0F172A]'>
			<header>
				<h1 className='text-2xl md:text-3xl font-bold text-slate-900 dark:text-white'>
					Sozlamalar
				</h1>
				<p className='text-slate-500 dark:text-slate-400 mt-1 text-sm'>
					Ilova, xavfsizlik va interfeys sozlamalarini boshqaring.
				</p>
			</header>

			<div className='space-y-6'>
				{/* Security */}
				<section className='bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6'>
					<div className='flex items-center gap-3 mb-2'>
						<div className='w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500'>
							<Lock size={20} />
						</div>
						<h3 className='font-bold text-slate-900 dark:text-white'>
							Xavfsizlik
						</h3>
					</div>
					<form onSubmit={handlePasswordChange} className='space-y-4'>
						<p className='rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-slate-300'>
							{isGoogleAccount
								? "Siz hozir Google orqali kirgansiz. Xohlasangiz, bu yerda alohida parol o'rnatib, keyin email + parol bilan ham kira olasiz."
								: "Bu parol email orqali kirish uchun ishlatiladi. Agar parolni esdan chiqarsangiz, login oynasidagi 'Parolni unutdingizmi?' tugmasidan foydalaning."}
						</p>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<label className='text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1'>
									Yangi parol
								</label>
								<div className='relative'>
									<input
										type={showPassword ? 'text' : 'password'}
										value={newPassword}
										onChange={e => setNewPassword(e.target.value)}
										placeholder='••••••••'
										className='w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#2c5ff2]/20 focus:border-[#2c5ff2] transition-all pr-12'
									/>
									<button
										type='button'
										onClick={() => setShowPassword(!showPassword)}
										className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
									>
										{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
									</button>
								</div>
							</div>
							<div className='space-y-2'>
								<label className='text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1'>
									Parolni tasdiqlang
								</label>
								<div className='relative'>
									<input
										type={showConfirmPassword ? 'text' : 'password'}
										value={confirmPassword}
										onChange={e => setConfirmPassword(e.target.value)}
										placeholder='••••••••'
										className='w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#2c5ff2]/20 focus:border-[#2c5ff2] transition-all pr-12'
									/>
									<button
										type='button'
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
									>
										{showConfirmPassword ? (
											<EyeOff size={18} />
										) : (
											<Eye size={18} />
										)}
									</button>
								</div>
							</div>
						</div>
						{passwordResetStep === 'verify' && (
							<div className='space-y-2'>
								<label className='text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1'>
									Tasdiqlash kodi
								</label>
								<input
									type='text'
									inputMode='numeric'
									maxLength={6}
									value={passwordResetCode}
									onChange={e =>
										setPasswordResetCode(
											e.target.value.replace(/\D/g, '').slice(0, 6),
										)
									}
									placeholder='123456'
									className='w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-center tracking-[0.35em] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#2c5ff2]/20 focus:border-[#2c5ff2] transition-all'
								/>
								<p className='text-xs text-slate-500 dark:text-slate-400'>
									Emailingizga yuborilgan 6 xonali kodni kiriting.
								</p>
							</div>
						)}
						<button
							type='submit'
							disabled={isChangingPassword || !newPassword}
							className='bg-[#2c5ff2] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#1f4dd1] transition-all flex items-center gap-2 shadow-lg disabled:opacity-50'
						>
							{isChangingPassword ? (
								<div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
							) : (
								<Shield size={18} />
							)}
							{passwordResetStep === 'idle'
								? isGoogleAccount
									? "Parol o'rnatish uchun kod olish"
									: 'Parolni yangilash uchun kod olish'
								: 'Kodni tasdiqlab parolni yangilash'}
						</button>
					</form>
				</section>

				{/* App settings */}
				<section className='bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6'>
					<div className='flex items-center gap-3 mb-2'>
						<div className='w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500'>
							<Shield size={20} />
						</div>
						<h3 className='font-bold text-slate-900 dark:text-white'>
							Ilova sozlamalari
						</h3>
					</div>

					<div className='space-y-4'>
						<div className='flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl'>
							<div className='flex items-center gap-3'>
								<div className='w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center'>
									<Bell size={16} />
								</div>
								<div>
									<p className='font-bold text-slate-900 dark:text-white text-sm'>
										Bildirishnomalar
									</p>
									<p className='text-xs text-slate-500 dark:text-slate-400'>
										Yangi testlar va natijalar haqida xabar berish
									</p>
								</div>
							</div>
							<div className='w-12 h-6 bg-[#2c5ff2] rounded-full relative cursor-pointer'>
								<div className='absolute right-1 top-1 w-4 h-4 bg-white rounded-full' />
							</div>
						</div>

						<div className='flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl'>
							<div className='flex items-center gap-3'>
								<div className='w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400'>
									{isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
								</div>
								<div>
									<p className='font-bold text-slate-900 dark:text-white text-sm'>
										Tungi rejim
									</p>
									<p className='text-xs text-slate-500 dark:text-slate-400'>
										Interfeysni qorong&apos;u rangga o&apos;tkazish
									</p>
								</div>
							</div>
							<div
								onClick={toggleDarkMode}
								className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${isDarkMode ? 'bg-[#2c5ff2]' : 'bg-slate-200 dark:bg-slate-700'}`}
							>
								<motion.div
									animate={{ x: isDarkMode ? 24 : 4 }}
									className='absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm'
								/>
							</div>
						</div>

						<div className='flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl'>
							<div className='flex items-center gap-3'>
								<div className='w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400'>
									<RefreshCcw size={16} />
								</div>
								<div>
									<p className='font-bold text-slate-900 dark:text-white text-sm'>
										Keshni tozalash
									</p>
									<p className='text-xs text-slate-500 dark:text-slate-400'>
										Muammolar bo&apos;lsa ilovani yangilash
									</p>
								</div>
							</div>
							<button
								onClick={handleClearCache}
								className='px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-all'
							>
								Tozalash
							</button>
						</div>

						<div className='flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl'>
							<div className='flex items-center gap-3'>
								<div className='w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400'>
									<Globe size={16} />
								</div>
								<div>
									<p className='font-bold text-slate-900 dark:text-white text-sm'>
										Til
									</p>
									<p className='text-xs text-slate-500 dark:text-slate-400'>
										Ilova tilini tanlash
									</p>
								</div>
							</div>
							<div className='flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm'>
								O&apos;zbekcha
								<ChevronRight size={16} className='text-slate-400' />
							</div>
						</div>

						{isPWA ? (
							<div className='bg-[#2c5ff2] p-6 rounded-[32px] text-white space-y-4 shadow-lg shadow-[#2c5ff2]/20'>
								<div className='flex items-center gap-3'>
									<div className='w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center'>
										<Shield size={20} />
									</div>
									<h4 className='font-bold text-sm'>Ilova o&apos;rnatilgan</h4>
								</div>
								<p className='text-xs text-slate-100 leading-relaxed'>
									Siz MedTest AI dan to&apos;liq PWA ilovasi sifatida
									foydalanmoqdasiz.
								</p>
							</div>
						) : (
							<button
								onClick={onInstall}
								className='w-full bg-[#2c5ff2] text-white font-bold py-4 rounded-2xl hover:bg-[#1f4dd1] transition-all flex items-center justify-center gap-3 shadow-lg mt-2'
							>
								<Download size={20} />
								Ilovani o&apos;rnatish
							</button>
						)}
					</div>
				</section>

				<button
					onClick={onSignOut}
					className='w-full flex items-center justify-between p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all font-bold text-sm'
				>
					<div className='flex items-center gap-3'>
						<LogOut size={18} />
						Chiqish
					</div>
					<ChevronRight size={16} />
				</button>
			</div>
		</div>
	)
}


