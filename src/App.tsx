/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
	Bell,
	BookMarked,
	Database as DatabaseIcon,
	Eye,
	EyeOff,
	GraduationCap,
	HeartPulse,
	HelpCircle,
	LayoutDashboard,
	LogOut,
	Menu,
	Search,
	Settings,
	Target,
	User,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Toaster, toast } from 'sonner'
import AIChat from './components/AIChat'
import AdminPanel from './components/AdminPanel'
import Dashboard from './components/Dashboard'
import Glossary from './components/Glossary'
import ProfileSettings from './components/ProfileSettings'
import SelectionTooltip from './components/SelectionTooltip'
import TestSession from './components/TestSession'
import Topics from './components/Topics'
import WeakPractice from './components/WeakPractice'
import LandingPage from './components/landing/LandingPage'
import MobileNav from './components/mobile/MobileNav'
import TimerWidget from './components/timer/TimerWidget'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'

type Tab =
	| 'dashboard'
	| 'topics'
	| 'weak-practice'
	| 'glossary'
	| 'profile'
	| 'settings'
	| 'help'
	| 'test'
	| 'admin'
const TEST_RESUME_KEY = 'medtest_resume_test'
const TEST_TOPIC_KEY = 'medtest_test_topic'
const PENDING_FIRST_NAME_KEY = 'medtest_pending_first_name'
const PENDING_LAST_NAME_KEY = 'medtest_pending_last_name'
type PasswordResetStep = 'none' | 'request' | 'verify' | 'complete'
type SignupVerificationStep = 'none' | 'verify'

const getAuthFlowType = () => {
	const searchParams = new URLSearchParams(window.location.search)
	if (searchParams.get('type')) {
		return searchParams.get('type')
	}

	const hash = window.location.hash.startsWith('#')
		? window.location.hash.slice(1)
		: window.location.hash
	const hashParams = new URLSearchParams(hash)
	return hashParams.get('type')
}

const getAuthProviderLabel = (user: NonNullable<ReturnType<typeof useAuth>['user']>) => {
	const provider =
		user.app_metadata?.provider ||
		user.app_metadata?.providers?.[0] ||
		user.identities?.[0]?.provider

	if (!provider) return 'email'
	if (provider === 'google') return 'Google'
	return provider
}

const getInitialTab = (): Tab => {
	const savedTab = localStorage.getItem('activeTab')
	if (
		savedTab &&
		[
			'dashboard',
			'topics',
			'weak-practice',
			'glossary',
			'profile',
			'settings',
			'help',
			'test',
			'admin',
		].includes(savedTab)
	) {
		return savedTab as Tab
	}
	return 'dashboard'
}

const getInitialTopic = (): string | null => {
	return (
		localStorage.getItem('selectedTopic') ||
		localStorage.getItem(TEST_TOPIC_KEY)
	)
}

export default function App() {
	const {
		user,
		loading: authLoading,
		signIn,
		signUp,
		signInWithGoogle,
		signOut,
	} = useAuth()
	const [internalUserId, setInternalUserId] = useState<string | null>(null)
	const [userRole, setUserRole] = useState<'user' | 'admin'>('user')
	const [activeTab, setActiveTab] = useState<Tab>(getInitialTab)
	const [selectedTopic, setSelectedTopic] = useState<string | null>(
		getInitialTopic,
	)
	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLogin, setIsLogin] = useState(true)
	const [showPassword, setShowPassword] = useState(false)
	const [isRecovering, setIsRecovering] = useState(false)
	const [confirmPassword, setConfirmPassword] = useState('')
	const [resetStep, setResetStep] = useState<PasswordResetStep>('none')
	const [resetCode, setResetCode] = useState('')
	const [resetToken, setResetToken] = useState('')
	const [signupStep, setSignupStep] = useState<SignupVerificationStep>('none')
	const [signupCode, setSignupCode] = useState('')
	const [isAuthSubmitting, setIsAuthSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
		typeof window !== 'undefined'
			? window.matchMedia('(min-width: 1024px)').matches
			: false,
	)
	const [showAuth, setShowAuth] = useState(false)
	const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
	const [isPWA, setIsPWA] = useState(false)
	const [isDesktop, setIsDesktop] = useState(() =>
		typeof window !== 'undefined'
			? window.matchMedia('(min-width: 1024px)').matches
			: false,
	)
	const previousTabRef = useRef<Tab>(activeTab)
	const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
	const isPasswordResetFlow = resetStep !== 'none'
	const isSignupVerificationFlow = !isLogin && signupStep === 'verify'

	const handleTabChange = (nextTab: Tab) => {
		if (nextTab !== 'test') {
			localStorage.removeItem(TEST_RESUME_KEY)
			localStorage.removeItem(TEST_TOPIC_KEY)
			setSelectedTopic(null)
		}
		setActiveTab(nextTab)
	}

	useEffect(() => {
		if (
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as any).standalone
		) {
			setIsPWA(true)
		}

		window.addEventListener('beforeinstallprompt', e => {
			e.preventDefault()
			setDeferredPrompt(e)
		})
	}, [])

	useEffect(() => {
		if (typeof window === 'undefined') return

		const mediaQuery = window.matchMedia('(min-width: 1024px)')
		const syncDesktopState = (matches: boolean) => {
			setIsDesktop(matches)
			if (matches) {
				setIsSidebarOpen(true)
			}
		}

		syncDesktopState(mediaQuery.matches)

		const handleChange = (event: MediaQueryListEvent) => {
			syncDesktopState(event.matches)
		}

		mediaQuery.addEventListener('change', handleChange)

		return () => {
			mediaQuery.removeEventListener('change', handleChange)
		}
	}, [])

	const handleInstallApp = async () => {
		if (!deferredPrompt) {
			toast.info(
				"Ilovani o'rnatish uchun brauzer menyusidan 'Asosiy ekranga qo'shish' bandini tanlang",
			)
			return
		}
		deferredPrompt.prompt()
		const { outcome } = await deferredPrompt.userChoice
		if (outcome === 'accepted') {
			setDeferredPrompt(null)
		}
	}

	useEffect(() => {
		const authFlowType = getAuthFlowType()
		if (authFlowType === 'recovery') {
			setIsRecovering(true)
			setShowAuth(true)
			setIsLogin(false)
		}
	}, [])

	const startPasswordResetFlow = () => {
		setError(null)
		setIsRecovering(false)
		setSignupStep('none')
		setSignupCode('')
		setResetStep('request')
		setResetCode('')
		setResetToken('')
		setPassword('')
		setConfirmPassword('')
	}

	const closePasswordResetFlow = () => {
		setResetStep('none')
		setResetCode('')
		setResetToken('')
		setPassword('')
		setConfirmPassword('')
		setError(null)
	}

	const resetSignupVerificationFlow = () => {
		setSignupStep('none')
		setSignupCode('')
	}

	useEffect(() => {
		localStorage.setItem('activeTab', activeTab)
	}, [activeTab])

	useEffect(() => {
		if (previousTabRef.current === 'test' && activeTab !== 'test') {
			localStorage.removeItem(TEST_RESUME_KEY)
			localStorage.removeItem(TEST_TOPIC_KEY)
		}
		previousTabRef.current = activeTab
	}, [activeTab])

	useEffect(() => {
		if (selectedTopic !== null) {
			localStorage.setItem('selectedTopic', selectedTopic)
			localStorage.setItem(TEST_TOPIC_KEY, selectedTopic)
		} else {
			localStorage.removeItem('selectedTopic')
			localStorage.removeItem(TEST_TOPIC_KEY)
		}
	}, [selectedTopic])

	useEffect(() => {
		if (!user || !internalUserId) return

		const savedTab = localStorage.getItem('activeTab')
		const defaultTab: Tab = userRole === 'admin' ? 'admin' : 'dashboard'

		if (!savedTab) {
			setActiveTab(defaultTab)
			return
		}

		if (savedTab === 'admin' && userRole !== 'admin') {
			setActiveTab('dashboard')
		}
	}, [user, internalUserId, userRole])

	useEffect(() => {
		// Theme initialization
		const savedTheme = localStorage.getItem('theme')
		if (savedTheme === 'dark') {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}, [])

	useEffect(() => {
		if (user) {
			const checkProfile = async () => {
				try {
					const { data: profile, error: profileError } = await supabase
						.from('users')
						.select('*')
						.eq('auth_user_id', user.id)
						.single()

					if (profileError && profileError.code !== 'PGRST116') {
						throw profileError
					}

						if (profile) {
							const pendingFirstName = localStorage
								.getItem(PENDING_FIRST_NAME_KEY)
								?.trim()
							const pendingLastName = localStorage
								.getItem(PENDING_LAST_NAME_KEY)
								?.trim()
							const pendingFullName = [pendingFirstName, pendingLastName]
								.filter(Boolean)
								.join(' ')
								.trim()

							setInternalUserId(profile.id)
							const isAdminEmail =
								user.email?.toLowerCase() === 'oybek.karimjonov1202@gmail.com'

							if (pendingFullName && !profile.full_name) {
								await supabase
									.from('users')
									.update({ full_name: pendingFullName })
									.eq('id', profile.id)
								localStorage.removeItem(PENDING_FIRST_NAME_KEY)
								localStorage.removeItem(PENDING_LAST_NAME_KEY)
							}

						if (isAdminEmail && profile.role !== 'admin') {
							console.log('Forcing admin role for:', user.email)
							await supabase
								.from('users')
								.update({ role: 'admin' })
								.eq('id', profile.id)
							setUserRole('admin')
							toast.success('Admin huquqlari tasdiqlandi')
						} else {
							setUserRole(profile.role as 'user' | 'admin')
						}
					} else {
						// Check if this is the designated admin email
						const isAdminEmail =
							user.email?.toLowerCase() === 'oybek.karimjonov1202@gmail.com'
						const pendingFirstName = localStorage
							.getItem(PENDING_FIRST_NAME_KEY)
							?.trim()
						const pendingLastName = localStorage
							.getItem(PENDING_LAST_NAME_KEY)
							?.trim()
						const pendingFullName = [pendingFirstName, pendingLastName]
							.filter(Boolean)
							.join(' ')
							.trim()

						console.log('Creating new profile. Admin:', isAdminEmail)
						toast.info('Yangi profil yaratilmoqda...')
						const { data: newUser, error: insertError } = await supabase
							.from('users')
							.insert({
								auth_user_id: user.id,
								email: user.email!,
								full_name: pendingFullName || user.email?.split('@')[0],
								role: isAdminEmail ? 'admin' : 'user',
							})
							.select()
							.single()

						if (insertError) throw insertError

						if (newUser) {
							localStorage.removeItem(PENDING_FIRST_NAME_KEY)
							localStorage.removeItem(PENDING_LAST_NAME_KEY)
							setInternalUserId(newUser.id)
							setUserRole(newUser.role as 'user' | 'admin')
							toast.success('Profil muvaffaqiyatli yaratildi')
							try {
								await supabase.from('stats').insert({
									user_id: newUser.id,
									overall_accuracy: 0,
									study_streak: 0,
									average_time_seconds: 0,
								})
							} catch (err) {
								console.error('Failed to initialize stats:', err)
							}
						}
					}
				} catch (err: any) {
					console.error('Profile check error:', err)
					toast.error(
						'Profilni yuklashda xatolik yuz berdi: ' +
							(err.message || "Noma'lum xatolik"),
					)
				}
			}
			checkProfile()
		} else {
			setInternalUserId(null)
			setUserRole('user')
		}
	}, [user])

	const handleAuth = async (e: FormEvent) => {
		e.preventDefault()
		setError(null)
		console.log('Attempting auth...', { isLogin, email, isRecovering })
		try {
			setIsAuthSubmitting(true)

			if (resetStep === 'request') {
				if (!email.trim()) {
					throw new Error('Email manzilingizni kiriting')
				}

				const response = await fetch(`${apiBase}/api/auth/password-reset/send`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email }),
				})
				const result = await response.json()

				if (!response.ok) {
					throw new Error(result.error || 'Kod yuborishda xatolik yuz berdi')
				}

				setResetStep('verify')
				toast.success(result.message || '6 xonali kod emailingizga yuborildi.')
				return
			}

			if (resetStep === 'verify') {
				if (!resetCode.trim()) {
					throw new Error('6 xonali kodni kiriting')
				}

				const response = await fetch(`${apiBase}/api/auth/password-reset/verify`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, code: resetCode }),
				})
				const result = await response.json()

				if (!response.ok) {
					throw new Error(result.error || 'Kod noto‘g‘ri yoki eskirgan')
				}

				setResetToken(result.resetToken)
				setResetStep('complete')
				setResetCode('')
				setPassword('')
				setConfirmPassword('')
				toast.success('Kod tasdiqlandi. Endi yangi parol kiriting.')
				return
			}

			if (resetStep === 'complete') {
				if (password.length < 6) {
					throw new Error("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
				}
				if (password !== confirmPassword) {
					throw new Error('Parollar mos kelmadi')
				}

				const response = await fetch(
					`${apiBase}/api/auth/password-reset/complete`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							email,
							resetToken,
							newPassword: password,
						}),
					},
				)
				const result = await response.json()

				if (!response.ok) {
					throw new Error(
						result.error || 'Parolni yangilashda xatolik yuz berdi',
					)
				}

				toast.success('Parol muvaffaqiyatli yangilandi. Endi kirishingiz mumkin.')
				closePasswordResetFlow()
				setIsLogin(true)
				setPassword('')
				return
			}

			if (isRecovering) {
				if (password.length < 6) {
					throw new Error("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
				}
				const { error: updateError } = await supabase.auth.updateUser({
					password,
				})
				if (updateError) throw updateError
				toast.success('Parol muvaffaqiyatli yangilandi!')
				setIsRecovering(false)
				setIsLogin(true)
				setPassword('')
				setEmail('')
				// Clean URL
				window.history.replaceState(
					{},
					document.title,
					window.location.pathname,
				)
				return
			}

			if (!isLogin && password.length < 6) {
				throw new Error("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
			}
			if (!isLogin && !isRecovering) {
				if (!firstName.trim()) {
					throw new Error('Ismni kiriting')
				}
				if (!lastName.trim()) {
					throw new Error('Familiyani kiriting')
				}
			}

			if (!isLogin && signupStep === 'none') {
				const response = await fetch(`${apiBase}/api/auth/signup/send-code`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email }),
				})
				const result = await response.json()

				if (!response.ok) {
					throw new Error(
						result.error || "Ro'yxatdan o'tish kodini yuborishda xatolik yuz berdi",
					)
				}

				setSignupStep('verify')
				toast.success(result.message || 'Tasdiqlash kodi emailingizga yuborildi.')
				return
			}

			if (!isLogin && signupStep === 'verify') {
				if (!signupCode.trim()) {
					throw new Error('Emailga yuborilgan 6 xonali kodni kiriting')
				}

				const verifyResponse = await fetch(
					`${apiBase}/api/auth/signup/verify-code`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ email, code: signupCode }),
					},
				)
				const verifyResult = await verifyResponse.json()

				if (!verifyResponse.ok) {
					throw new Error(
						verifyResult.error || 'Kod noto‘g‘ri yoki eskirgan',
					)
				}

				localStorage.setItem(PENDING_FIRST_NAME_KEY, firstName.trim())
				localStorage.setItem(PENDING_LAST_NAME_KEY, lastName.trim())
				const { data, error: signUpError } = await signUp(email, password)
				if (signUpError) {
					console.error('Sign up error:', signUpError)
					if (signUpError.message === 'User already registered') {
						throw new Error("Ushbu email bilan allaqachon ro'yxatdan o'tilgan")
					}
					throw signUpError
				}
				console.log('Sign up success:', data)
				resetSignupVerificationFlow()
				toast.success("Ro'yxatdan o'tdingiz! Endi tizimga kirishingiz mumkin.")
				return
			}

			if (isLogin) {
				const { data, error: signInError } = await signIn(email, password)
				if (signInError) {
					console.error('Sign in error:', signInError)
					if (signInError.message === 'Invalid login credentials') {
						throw new Error(
							"Email yoki parol noto'g'ri. Agar siz avval Google orqali kirgan bo'lsangiz, qayta Google bilan kiring yoki 'Parolni unutdingizmi?' orqali 6 xonali kod oling.",
						)
					}
					throw signInError
				}
				console.log('Sign in success:', data)
				toast.success('Xush kelibsiz!')
			}
		} catch (err: any) {
			console.error('Auth handler caught error:', err)
			setError(err.message || "Noma'lum xatolik yuz berdi")
			toast.error(err.message || "Noma'lum xatolik yuz berdi")
		} finally {
			setIsAuthSubmitting(false)
		}
	}

	if (authLoading)
		return (
			<div className='min-h-screen flex flex-col items-center justify-center bg-[var(--app-bg)] gap-4'>
				<motion.div
					animate={{ scale: [1, 1.2, 1] }}
					transition={{ repeat: Infinity, duration: 2 }}
					className='flex h-16 w-16 items-center justify-center rounded-3xl bg-[#102347] text-white shadow-[0_16px_36px_rgba(16,35,71,0.18)]'
				>
					<HeartPulse size={32} />
				</motion.div>
				{!import.meta.env.VITE_SUPABASE_URL && (
					<p className='text-red-500 text-sm font-bold'>
						Supabase URL topilmadi! .env faylini tekshiring.
					</p>
				)}
			</div>
		)

	if (!user) {
		if (!showAuth) {
			return (
				<LandingPage
					onGetStarted={() => setShowAuth(true)}
					onInstall={handleInstallApp}
				/>
			)
		}

		return (
			<div className='relative min-h-screen overflow-hidden bg-[#050816] p-6'>
				<video
					autoPlay
					muted
					loop
					playsInline
					className='absolute inset-0 h-full w-full object-cover opacity-36'
					src='/media/hero-medical.mp4'
				/>
				<div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_74%,rgba(44,95,242,0.34),transparent_30%),radial-gradient(circle_at_84%_42%,rgba(255,128,90,0.18),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.56),rgba(2,6,23,0.9))]' />
				<div className='relative flex min-h-[calc(100vh-3rem)] items-center justify-center'>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className='relative w-full max-w-[390px] rounded-[32px] border  border-white/15 bg-[rgba(13,18,34,0.62)] p-6 text-white shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-[30px]'
					>
						{/* Close button */}
						<button
							onClick={() => setShowAuth(false)}
							className='absolute right-7 top-8 flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/60 transition hover:bg-white/12 hover:text-white'
						>
							✕
						</button>

						<div className='inline-flex rounded-full bg-[#292C39] p-[3px] mb-5 shadow-[0_6px_20px_rgba(0,0,0,0.25)] border-b border-r-0 border-l-0 border-t-0 border-white/20 backdrop-blur-xl gap-2'>
							{/* Sign Up */}
							<button
								type='button'
								onClick={() => {
									closePasswordResetFlow()
									resetSignupVerificationFlow()
									setIsLogin(false)
									setIsRecovering(false)
								}}
								className={`relative rounded-full px-5 py-3 text-[13px] font-medium transition-all duration-300  ${
									!isLogin && !isRecovering
										? 'text-white backdrop-blur-[30px] opacity-80'
										: 'text-white/60 hover:text-white'
								}`}
							>
								{/* Active background */}
								{!isLogin && !isRecovering && (
									<span className='absolute inset-0 rounded-full border-l border-t border-b-0 border-r-0 border-white/25 bg-[#08111f] '></span>
								)}

								<span className='relative z-10'>Ro'yxatdan o'tish</span>
							</button>

							{/* Login */}
							<button
								type='button'
								onClick={() => {
									closePasswordResetFlow()
									resetSignupVerificationFlow()
									setIsLogin(true)
									setIsRecovering(false)
								}}
								className={`relative rounded-full px-5 py-3 text-[13px] font-medium transition-all duration-300 ${
									isLogin && !isRecovering
										? 'text-white backdrop-blur-[30px] opacity-80'
										: 'text-white/60 hover:text-white'
								}`}
							>
								{/* Active background */}
								{isLogin && !isRecovering && (
									<span className='absolute inset-0 rounded-full border-r border-t border-b-0 border-l-0 border-white/25 bg-[#08111f] '></span>
								)}

								<span className='relative z-10'>Kirish</span>
							</button>
						</div>

						{/* Title */}
						<h1 className='text-[1.8rem] font-semibold tracking-[-0.04em] text-white mb-1'>
							{resetStep === 'request'
								? 'Parolni tiklash'
								: resetStep === 'verify'
									? 'Kodni kiriting'
									: resetStep === 'complete'
										? 'Yangi parol'
								: isSignupVerificationFlow
									? 'Emailni tasdiqlang'
								: isRecovering
								? 'Parolni yangilang'
								: isLogin
									? 'Hisobingizga kiring'
									: 'Hisob yarating'}
						</h1>
						<p className='text-sm text-white/45 mb-5 leading-6'>
							{resetStep === 'request'
								? 'Emailingizga 6 xonali tasdiqlash kodi yuboramiz.'
								: resetStep === 'verify'
									? 'Emailingizga yuborilgan 6 xonali kodni kiriting.'
									: resetStep === 'complete'
										? "Endi yangi parol o'rnating."
								: isSignupVerificationFlow
									? 'Ro‘yxatdan o‘tishni yakunlash uchun emaildagi 6 xonali kodni kiriting.'
								: isRecovering
								? "Emaildagi havola orqali yangi parol o'rnating."
								: 'Tibbiy testlar, AI sharh va progress bitta platformada.'}
						</p>

						<form onSubmit={handleAuth} className='space-y-3'>
							{/* First + Last name (signup only) */}
							{!isLogin &&
								!isRecovering &&
								!isPasswordResetFlow &&
								!isSignupVerificationFlow && (
								<div className='grid grid-cols-2 gap-3'>
									<input
										type='text'
										placeholder='Ism'
										value={firstName}
										onChange={e => setFirstName(e.target.value)}
										className='w-full rounded-[8px] border border-white/8 bg-white/6 px-4 py-[12px] text-[14px] text-white placeholder:text-white/25 outline-none transition-all focus:border-[#5f87ff] focus:bg-white/8 focus:ring-2 focus:ring-[#2c5ff2]/20'
										required
									/>
									<input
										type='text'
										placeholder='Familiya'
										value={lastName}
										onChange={e => setLastName(e.target.value)}
										className='w-full rounded-[8px] border border-white/8 bg-white/6 px-4 py-3 text-[14px] text-white placeholder:text-white/25 outline-none transition-all focus:border-[#5f87ff] focus:bg-white/8 focus:ring-2 focus:ring-[#2c5ff2]/20'
										required
									/>
								</div>
							)}

							{/* Email */}
							<div className='relative'>
								<span className='absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-sm'>
									✉
								</span>
								<input
									type='email'
									placeholder='email@example.com'
									value={email}
									onChange={e => setEmail(e.target.value)}
									disabled={
										resetStep === 'verify' ||
										resetStep === 'complete' ||
										isSignupVerificationFlow
									}
									className='w-full rounded-[8px] border border-white/8 bg-white/6 pl-10 pr-4 py-3 text-[14px] text-white placeholder:text-white/25 outline-none transition-all focus:border-[#5f87ff] focus:bg-white/8 focus:ring-2 focus:ring-[#2c5ff2]/20'
									required
								/>
							</div>

							{/* Password */}
							{isSignupVerificationFlow ? (
								<input
									type='text'
									inputMode='numeric'
									maxLength={5}
									placeholder='12345'
									value={signupCode}
									onChange={e =>
										setSignupCode(e.target.value.replace(/\D/g, '').slice(0, 5))
									}
									className='w-full rounded-[8px] border border-white/8 bg-white/6 px-4 py-3 text-center tracking-[0.5em] text-[18px] font-semibold text-white placeholder:text-white/25 outline-none transition-all focus:border-[#5f87ff] focus:bg-white/8 focus:ring-2 focus:ring-[#2c5ff2]/20'
									required
								/>
							) : resetStep === 'verify' ? (
								<input
									type='text'
									inputMode='numeric'
									maxLength={5}
									placeholder='12345'
									value={resetCode}
									onChange={e =>
										setResetCode(e.target.value.replace(/\D/g, '').slice(0, 5))
									}
									className='w-full rounded-[8px] border border-white/8 bg-white/6 px-4 py-3 text-center tracking-[0.5em] text-[18px] font-semibold text-white placeholder:text-white/25 outline-none transition-all focus:border-[#5f87ff] focus:bg-white/8 focus:ring-2 focus:ring-[#2c5ff2]/20'
									required
								/>
							) : resetStep === 'request' ? null : (
								<div className='space-y-3'>
									<div className='relative'>
										<input
											type={showPassword ? 'text' : 'password'}
											placeholder='••••••••••'
											value={password}
											onChange={e => setPassword(e.target.value)}
											className='w-full rounded-[8px] border border-white/8 bg-white/6 px-4 py-3 pr-12 text-[14px] text-white placeholder:text-white/25 outline-none transition-all focus:border-[#5f87ff] focus:bg-white/8 focus:ring-2 focus:ring-[#2c5ff2]/20'
											required
										/>
										<button
											type='button'
											onClick={() => setShowPassword(!showPassword)}
											className='absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white'
										>
											{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>

									{resetStep === 'complete' && (
										<input
											type={showPassword ? 'text' : 'password'}
											placeholder='Parolni tasdiqlang'
											value={confirmPassword}
											onChange={e => setConfirmPassword(e.target.value)}
											className='w-full rounded-[8px] border border-white/8 bg-white/6 px-4 py-3 text-[14px] text-white placeholder:text-white/25 outline-none transition-all focus:border-[#5f87ff] focus:bg-white/8 focus:ring-2 focus:ring-[#2c5ff2]/20'
											required
										/>
									)}
								</div>
							)}

							{/* Forgot password */}
							{isLogin && !isRecovering && !isPasswordResetFlow && (
								<div className='flex justify-end'>
									<button
										type='button'
										onClick={startPasswordResetFlow}
										className='text-[11px] font-semibold tracking-wide text-[#8eb0ff] hover:text-white transition-colors'
									>
										Parolni unutdingizmi?
									</button>
								</div>
							)}

							{isLogin && !isRecovering && !isPasswordResetFlow && (
								<p className='rounded-[8px] border border-white/10 bg-white/5 px-3 py-2 text-[11px] leading-5 text-white/60'>
									Agar akkaunt Google orqali yaratilgan bo&apos;lsa, oddiy parol ishlamasligi mumkin. Bunday holatda Google bilan kiring yoki email orqali parol o&apos;rnating.
								</p>
							)}

							{isPasswordResetFlow && (
								<p className='rounded-[8px] border border-white/10 bg-white/5 px-3 py-2 text-[11px] leading-5 text-white/60'>
									Kod 10 daqiqa amal qiladi. Agar email kelmasa, spam papkasini ham tekshiring.
								</p>
							)}

							{isSignupVerificationFlow && (
								<p className='rounded-[8px] border border-white/10 bg-white/5 px-3 py-2 text-[11px] leading-5 text-white/60'>
									Ro‘yxatdan o‘tish kodi 10 daqiqa amal qiladi. Email kelmasa, spam papkasini ham tekshiring.
								</p>
							)}

							{/* Error */}
							{error && (
								<p className='text-center text-xs font-bold text-red-400'>
									{error}
								</p>
							)}

							{/* Submit */}
							<button
								type='submit'
								disabled={isAuthSubmitting}
								className='w-full rounded-[8px] bg-white py-3 text-[14px] font-semibold text-[#08111f] transition-all shadow-[0_4px_36px_rgba(255,255,255,0.10)] hover:bg-[#eef4ff] mt-5'
							>
								{isAuthSubmitting
									? 'Yuklanmoqda...'
									: resetStep === 'request'
										? 'Kodni yuborish'
										: resetStep === 'verify'
											? 'Kodni tasdiqlash'
											: resetStep === 'complete'
												? 'Parolni saqlash'
								: isSignupVerificationFlow
									? 'Ro‘yxatdan o‘tishni tasdiqlash'
								: isRecovering
									? 'Parolni yangilash'
									: isLogin
										? 'Kirish'
										: "Ro'yxatdan o'tish"}
							</button>

							{/* Divider */}
							{!isPasswordResetFlow && !isSignupVerificationFlow && (
								<div className='relative py-2'>
								<div className='absolute inset-0 flex items-center'>
									<div className='w-full border-t border-white/10' />
								</div>
								<div className='relative flex justify-center text-[10px] uppercase tracking-[0.18em]'>
									<span className='bg-[#0d1222] px-3 font-semibold text-white/28'>
										Yoki Google bilan
									</span>
								</div>
								</div>
							)}

							{/* Google */}
							{!isPasswordResetFlow && !isSignupVerificationFlow && (
								<button
								type='button'
								onClick={() => signInWithGoogle()}
								className='flex w-full items-center justify-center gap-3 rounded-[8px] border border-white/10 bg-white/7 py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-white/10'
							>
								<svg className='w-5 h-5' viewBox='0 0 24 24'>
									<path
										fill='#EA4335'
										d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
									/>
									<path
										fill='#34A853'
										d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
									/>
									<path
										fill='#FBBC05'
										d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z'
									/>
									<path
										fill='#4285F4'
										d='M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
									/>
								</svg>
								Google orqali kirish
							</button>
							)}
						</form>

						{/* Switch login/signup */}
						<div className='mt-4 text-center'>
							{isPasswordResetFlow ? (
								<button
									onClick={closePasswordResetFlow}
									className='text-sm font-semibold text-[#8eb0ff] hover:text-white transition-colors'
								>
									Kirish sahifasiga qaytish
								</button>
							) : isSignupVerificationFlow ? (
								<button
									onClick={resetSignupVerificationFlow}
									className='text-sm font-semibold text-[#8eb0ff] hover:text-white transition-colors'
								>
									Ro‘yxatdan o‘tish formasiga qaytish
								</button>
							) : (
								<button
									onClick={() => {
										resetSignupVerificationFlow()
										setIsLogin(!isLogin)
									}}
									className='text-sm font-semibold text-[#8eb0ff] hover:text-white transition-colors'
								>
									{isLogin
										? "Hisobingiz yo'qmi? Ro'yxatdan o'ting"
										: 'Hisobingiz bormi? Kiring'}
								</button>
							)}
						</div>
					</motion.div>
				</div>
			</div>
		)
	}

	const menuItems = [
		{ id: 'dashboard', label: 'Boshqaruv', icon: LayoutDashboard },
		{ id: 'topics', label: 'Mavzular', icon: GraduationCap },
		{ id: 'weak-practice', label: 'Zaif mavzular', icon: Target },
		{ id: 'glossary', label: "Lug'at", icon: BookMarked },
		{ id: 'profile', label: 'Profil', icon: User },
	]

	const generalItems = [
		{ id: 'settings', label: 'Sozlamalar', icon: Settings },
		{ id: 'help', label: 'Yordam', icon: HelpCircle },
	]

	return (
		<div
			className={`relative flex h-screen overflow-hidden bg-[#f5f7fb] font-sans ${
				activeTab !== 'test' ? 'p-3 md:p-4' : ''
			}`}
		>
			<Toaster position='top-center' expand={false} richColors />
			{/* Sidebar Overlay for Mobile - Removed since sidebar is hidden on mobile */}

			{/* Sidebar */}
			{activeTab !== 'test' && (
				<motion.aside
					initial={false}
					animate={{
						width: isDesktop ? (isSidebarOpen ? 260 : 80) : 260,
						x: isDesktop ? 0 : isSidebarOpen ? 0 : -260,
					}}
					className={`app-panel fixed z-50 mr-2.5 hidden h-full shrink-0 flex-col rounded-[18px] transition-all duration-300 lg:relative lg:flex ${isDesktop && !isSidebarOpen ? 'lg:w-20' : ''}`}
				>
					<div className='flex shrink-0 items-center gap-3 p-5'>
						<div className='flex aspect-square w-10 shrink-0 items-center justify-center rounded-xl bg-[#102347] text-white'>
							<HeartPulse size={24} />
						</div>
						{isSidebarOpen && (
							<motion.span
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className='text-xl font-bold text-[var(--app-ink)]'
							>
								MedTest AI
							</motion.span>
						)}
					</div>

					<div className='flex h-full flex-1 flex-col px-3 py-4'>
						<div className='flex-1'>
							<div className='mb-8'>
								{isSidebarOpen && (
									<p className='ml-4 mb-2 text-[12px] font-bold uppercase tracking-widest text-[var(--app-muted)]'>
										Menu
									</p>
								)}
								{userRole === 'admin' && (
									<button
										onClick={() => handleTabChange('admin')}
										className={`w-full flex items-center gap-3 px-3.5 py-3.5 rounded-2xl transition-all group ${
											activeTab === 'admin'
												? 'bg-[#2c5ff2] text-white shadow-lg shadow-[#2c5ff2]/20'
												: 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
										}`}
									>
										<DatabaseIcon
											size={24}
											className={
												activeTab === 'admin'
													? 'text-white'
													: 'group-hover:text-[#2c5ff2]'
											}
										/>
										{isSidebarOpen && (
											<motion.span
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												className='font-semibold text-sm'
											>
												Admin Panel
											</motion.span>
										)}
									</button>
								)}
								{menuItems.map(item => (
									<button
										key={item.id}
										onClick={() => handleTabChange(item.id as Tab)}
										className={`w-full flex items-center gap-3 px-3.5 py-3.5 rounded-2xl transition-all group ${
											activeTab === item.id
												? 'bg-[#2c5ff2] text-white shadow-[#2c5ff2]/20'
												: 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
										}`}
									>
										<item.icon
											size={24}
											className={
												activeTab === item.id
													? 'text-white'
													: 'group-hover:text-[#2c5ff2]'
											}
										/>
										{isSidebarOpen && (
											<motion.span
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												className='font-semibold text-sm'
											>
												{item.label}
											</motion.span>
										)}
									</button>
								))}
							</div>

							<div className=' mb-2'>
								{isSidebarOpen && (
									<p className='ml-4  mb-2 text-[12px] font-bold uppercase tracking-widest text-[var(--app-muted)]'>
										General
									</p>
								)}
								{generalItems.map(item => (
									<button
										key={item.id}
										onClick={() => handleTabChange(item.id as Tab)}
										className={`w-full flex items-center gap-3 px-3.5  py-3.5 rounded-2xl transition-all group ${
											activeTab === item.id
												? 'bg-[#2c5ff2] text-white shadow-[#2c5ff2]/20'
												: 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
										}`}
									>
										<item.icon
											size={24}
											className={
												activeTab === item.id
													? 'text-white'
													: 'group-hover:text-[#2c5ff2]'
											}
										/>
										{isSidebarOpen && (
											<motion.span
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												className='font-semibold text-sm'
											>
												{item.label}
											</motion.span>
										)}
									</button>
								))}
							</div>
						</div>

						<div className='mb-5 space-y-3'>
							{/* {isSidebarOpen && !isPWA && (
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									className='relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#102347,#2c5ff2)] p-4 shadow-2xl'
								>
									<div className='absolute right-0 top-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-white/10 blur-2xl transition-colors' />
									<div className='relative z-10'>
										<div className='w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mb-4'>
											<HeartPulse size={20} className='text-white' />
										</div>
										<h4 className='text-white font-bold text-sm leading-tight'>
											Mobil ilovani yuklab oling
										</h4>
										<p className='mt-1.5 text-[10px] text-slate-300'>
											O'qishni yanada qulayroq qiling
										</p>
										<button
											onClick={handleInstallApp}
											className='mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-xs font-bold text-[#102347] transition-all shadow-lg'
										>
											<Download size={14} />
											Yuklab olish
										</button>
									</div>
								</motion.div>
							)} */}

							<button
								onClick={() => {
									localStorage.removeItem('activeTab')
									localStorage.removeItem('selectedTopic')
									localStorage.removeItem(TEST_RESUME_KEY)
									localStorage.removeItem(TEST_TOPIC_KEY)
									signOut()
								}}
								className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[var(--app-muted)] transition-all hover:text-red-500 ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
								title='Chiqish'
							>
								<LogOut size={24} />
								{isSidebarOpen && (
									<span className='font-bold text-sm'>Chiqish</span>
								)}
							</button>
						</div>
					</div>
				</motion.aside>
			)}

			{/* Main Content */}
			<main
				className={`relative flex h-full flex-1 flex-col overflow-hidden bg-white ${activeTab !== 'test' ? 'rounded-[18px] app-panel' : 'rounded-none'}`}
			>
				{/* Top Navbar */}
				{activeTab !== 'test' && (
					<header className='flex h-20 shrink-0 items-center justify-between rounded-t-[18px] border-b border-[#e4ebf5] bg-white px-4 safe-area-top md:px-8'>
						<div className='flex items-center gap-2 md:gap-4'>
							<button
								onClick={() => setIsSidebarOpen(!isSidebarOpen)}
								className='hidden rounded-lg p-2 text-[var(--app-muted)] transition-colors hover:bg-[#edf3ff] lg:block'
							>
								<Menu size={24} />
							</button>
							<div className='flex w-40 items-center gap-2 rounded-xl border border-[var(--app-border)] bg-white/80 px-3 py-2 md:w-96 md:gap-3 md:px-4'>
								<Search
									size={18}
									className='shrink-0 text-[var(--app-muted)]'
								/>
								<input
									type='text'
									placeholder='Qidirish...'
									className='w-full border-none bg-transparent text-sm text-[var(--app-ink)] outline-none focus:ring-0'
								/>
							</div>
						</div>
						<div className='flex items-center gap-2 md:gap-4'>
							<button className='relative hidden rounded-xl p-2 text-[var(--app-muted)] hover:bg-[#edf3ff] sm:block'>
								<Bell size={22} />
								<div className='absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900' />
							</button>
							<div
								className={`flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-white/80 p-1.5 md:gap-3 md:p-2`}
							>
								<div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] text-[#2c5ff2] md:h-8 md:w-8'>
									<User size={16} />
								</div>
								<div className='hidden sm:block min-w-0'>
									<p className='truncate text-[10px] font-bold text-[var(--app-ink)] md:text-xs'>
										{user.email?.split('@')[0]}
									</p>
								</div>
							</div>
						</div>
					</header>
				)}

				{/* Content Area */}
				<div
					className={`scrolling-touch flex-1 bg-white ${activeTab !== 'test' ? 'overflow-y-auto pb-24 lg:pb-0' : 'h-full overflow-hidden'}`}
				>
					<AnimatePresence mode='wait'>
						<motion.div
							key={activeTab}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2 }}
							className={
								activeTab === 'test' ? 'h-full flex flex-col' : 'min-h-full'
							}
						>
							{activeTab === 'dashboard' && internalUserId && (
								<Dashboard
									userId={internalUserId}
									onStartTest={() => {
										setSelectedTopic(null)
										localStorage.setItem(TEST_RESUME_KEY, '1')
										localStorage.removeItem(TEST_TOPIC_KEY)
										setActiveTab('test')
									}}
									installPrompt={deferredPrompt}
									onInstall={handleInstallApp}
								/>
							)}
							{activeTab === 'admin' && userRole === 'admin' && <AdminPanel />}
							{activeTab === 'topics' && internalUserId && (
								<Topics
									userId={internalUserId}
									onStartTopicTest={topic => {
										setSelectedTopic(topic)
										localStorage.setItem(TEST_RESUME_KEY, '1')
										localStorage.setItem(TEST_TOPIC_KEY, topic)
										setActiveTab('test')
									}}
								/>
							)}
							{activeTab === 'weak-practice' && internalUserId && (
								<WeakPractice
									userId={internalUserId}
									onStartPractice={topic => {
										setSelectedTopic(topic || null)
										localStorage.setItem(TEST_RESUME_KEY, '1')
										if (topic) {
											localStorage.setItem(TEST_TOPIC_KEY, topic)
										} else {
											localStorage.removeItem(TEST_TOPIC_KEY)
										}
										setActiveTab('test')
									}}
								/>
							)}
							{activeTab === 'test' && internalUserId && (
								<TestSession
									userId={internalUserId}
									topic={selectedTopic}
									onComplete={() => {
										if (selectedTopic) {
											setActiveTab('topics')
										} else {
											setActiveTab('dashboard')
										}
										setSelectedTopic(null)
										localStorage.removeItem(TEST_RESUME_KEY)
										localStorage.removeItem(TEST_TOPIC_KEY)
										localStorage.removeItem('selectedTopic')
									}}
								/>
							)}
							{activeTab === 'glossary' && internalUserId && (
								<Glossary userId={internalUserId} />
							)}
							{(activeTab === 'profile' || activeTab === 'settings') &&
								internalUserId && (
									<ProfileSettings
										mode={activeTab === 'profile' ? 'profile' : 'settings'}
										userId={internalUserId}
										authUserId={user.id}
										userEmail={user.email || ''}
										authProvider={getAuthProviderLabel(user)}
										onSignOut={() => {
											localStorage.removeItem('activeTab')
											localStorage.removeItem('selectedTopic')
											localStorage.removeItem(TEST_RESUME_KEY)
											localStorage.removeItem(TEST_TOPIC_KEY)
											signOut()
										}}
										onInstall={handleInstallApp}
									/>
								)}
							{['help'].includes(activeTab) && (
								<div className='p-8 flex items-center justify-center h-full'>
									<div className='text-center space-y-4'>
										<div className='w-20 h-20 bg-white rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-[#102347]'>
											{activeTab === 'topics' && <GraduationCap size={40} />}
											{activeTab === 'weak-practice' && <Target size={40} />}
											{activeTab === 'profile' && <User size={40} />}
											{activeTab === 'settings' && <Settings size={40} />}
											{activeTab === 'help' && <HelpCircle size={40} />}
										</div>
										<div>
											<h3 className='text-xl font-bold text-slate-900 capitalize'>
												{activeTab.replace('-', ' ')}
											</h3>
											<p className='text-slate-500'>
												Tez kunda ushbu sahifa tayyor bo'ladi.
											</p>
										</div>
									</div>
								</div>
							)}
						</motion.div>
					</AnimatePresence>
				</div>
			</main>
			<AIChat userId={internalUserId} />
			{internalUserId && activeTab === 'test' && (
				<SelectionTooltip
					userId={internalUserId}
					containerId='question-stem-container'
				/>
			)}
			{activeTab !== 'test' && (
				<MobileNav
					activeTab={activeTab}
					onTabChange={handleTabChange}
					userRole={userRole}
				/>
			)}
			{user && <TimerWidget />}
		</div>
	)
}
