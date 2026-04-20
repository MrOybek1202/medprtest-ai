import {
	questionService,
	sessionService,
	statsService,
} from '@/src/services/api'
import { UserStats } from '@/src/types'
import {
	AlertCircle,
	ArrowRight,
	Clock,
	Download,
	GraduationCap,
	Plus,
	Smartphone,
	Target,
	TrendingUp,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface DashboardProps {
	userId: string
	onStartTest: () => void
	installPrompt?: any
	onInstall?: () => void
}

export default function Dashboard({
	userId,
	onStartTest,
	installPrompt,
	onInstall,
}: DashboardProps) {
	const [stats, setStats] = useState<UserStats | null>(null)
	const [topics, setTopics] = useState<string[]>([])
	const [topicProgress, setTopicProgress] = useState<
		Record<string, { total: number; solved: number; percentage: number }>
	>({})
	const [totalQuestions, setTotalQuestions] = useState(0)
	const [solvedCount, setSolvedCount] = useState(0)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchData = async () => {
			setError(null)
			try {
				const [statsData, topicsData, progressData, totalCount, solved] =
					await Promise.allSettled([
						statsService.getUserStats(userId),
						questionService.getTopics(),
						questionService.getTopicProgress(userId),
						questionService.getTotalQuestionCount(),
						sessionService.getSolvedQuestionsCount(userId),
					])

				let hasError = false
				if (statsData.status === 'fulfilled') setStats(statsData.value)
				if (topicsData.status === 'fulfilled') setTopics(topicsData.value)
				else hasError = true

				if (progressData.status === 'fulfilled')
					setTopicProgress(progressData.value)
				if (totalCount.status === 'fulfilled')
					setTotalQuestions(totalCount.value)
				if (solved.status === 'fulfilled') setSolvedCount(solved.value)

				if (hasError) {
					setError(
						"Ma'lumotlar bazasiga ulanishda xatolik yuz berdi. Iltimos, jadvallar mavjudligini tekshiring.",
					)
					toast.error("Ma'lumotlar bazasiga ulanishda xatolik yuz berdi")
				}
			} catch (error: any) {
				console.error('Failed to fetch dashboard data:', error)
				setError('Kutilmagan xatolik yuz berdi.')
				toast.error('Kutilmagan xatolik yuz berdi: ' + (error.message || ''))
			} finally {
				setLoading(false)
			}
		}
		fetchData()
	}, [userId])

	if (loading)
		return (
			<div className='animate-pulse space-y-6 p-6'>
				<div className='h-10 bg-[#E5E5EA] dark:bg-[#1C1C1E] rounded-xl w-1/4 mb-6' />
				<div className='grid grid-cols-4 gap-4'>
					{[1, 2, 3, 4].map(i => (
						<div
							key={i}
							className='h-32 bg-[#E5E5EA] dark:bg-[#1C1C1E] rounded-3xl'
						/>
					))}
				</div>
				<div className='grid grid-cols-3 gap-4'>
					<div className='col-span-2 h-64 bg-[#E5E5EA] dark:bg-[#1C1C1E] rounded-3xl' />
					<div className='h-64 bg-[#E5E5EA] dark:bg-[#1C1C1E] rounded-3xl' />
				</div>
			</div>
		)

	if (error)
		return (
			<div className='p-8 flex items-center justify-center h-full'>
				<div className='bg-white dark:bg-[#1C1C1E] p-12 rounded-[44px] border border-[#E5E5EA] dark:border-[#2C2C2E] shadow-xl text-center space-y-6 max-w-md'>
					<div className='w-20 h-20 bg-[#FFE5E5] dark:bg-[#3A1212] rounded-[32px] flex items-center justify-center mx-auto text-[#FF3B30]'>
						<AlertCircle size={40} />
					</div>
					<div>
						<h3 className='text-2xl font-semibold text-[#1C1C1E] dark:text-white'>
							Ulanishda xatolik
						</h3>
						<p className='text-[#8E8E93] dark:text-[#98989E] mt-2'>{error}</p>
					</div>
					<button
						onClick={() => window.location.reload()}
						className='bg-[#007AFF] text-white font-semibold px-8 py-4 rounded-2xl hover:bg-[#005BBF] transition-all active:scale-97'
					>
						Qayta urinish
					</button>
				</div>
			</div>
		)

	return (
		<div className='p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 bg-[#F2F2F7] dark:bg-[#000000] min-h-screen'>
			{/* Header */}
			<header className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2'>
				<div>
					<h1 className='text-3xl md:text-4xl font-bold text-[#1C1C1E] dark:text-white tracking-tight'>
						Boshqaruv paneli
					</h1>
					<p className='text-[#8E8E93] dark:text-[#98989E] text-sm md:text-base mt-1 font-normal'>
						O'z bilimingizni tahlil qiling va yangi marralarni zabt eting.
					</p>
				</div>
				<div className='flex items-center gap-3 w-full md:w-auto'>
					<button
						onClick={onStartTest}
						className='flex w-full items-center justify-center gap-2 rounded-2xl bg-[#007AFF] px-6 py-3.5 font-semibold text-white shadow-lg shadow-[#007AFF]/25 transition-all hover:bg-[#005BBF] active:scale-97 md:w-auto'
					>
						<Plus size={20} strokeWidth={1.5} />
						Testni boshlash
					</button>
				</div>
			</header>

			{/* Stats Grid */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
				{installPrompt && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className='lg:col-span-4 flex flex-col items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#007AFF] to-[#5856D6] p-6 text-white shadow-xl md:flex-row'
					>
						<div className='flex items-center gap-4'>
							<div className='w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm'>
								<Smartphone size={24} strokeWidth={1.5} />
							</div>
							<div>
								<h3 className='font-semibold text-lg'>Ilovani o'rnating</h3>
								<p className='text-white/70 text-sm'>
									MedTest AI ni asosiy ekranga qo'shing va tezroq foydalaning.
								</p>
							</div>
						</div>
						<button
							onClick={onInstall}
							className='flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3.5 font-semibold text-[#007AFF] shadow-lg transition-all hover:bg-[#F2F2F7] active:scale-97 md:w-auto'
						>
							<Download size={18} strokeWidth={1.5} />
							O'rnatish
						</button>
					</motion.div>
				)}

				{/* Umumiy savollar - Apple gradient style */}
				<div className='group relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] p-7 text-white shadow-lg'>
					<div className='relative z-10'>
						<div className='flex justify-between items-start mb-4'>
							<p className='text-white/60 text-xs font-medium uppercase tracking-wide'>
								Umumiy savollar
							</p>
							<div className='w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm'>
								<TrendingUp size={16} strokeWidth={1.5} />
							</div>
						</div>
						<p className='text-5xl font-bold mb-2 tracking-tight'>
							{totalQuestions.toLocaleString()}
						</p>
						<p className='text-[11px] text-white/50 font-medium uppercase tracking-wide'>
							Bazadagi savollar soni
						</p>
					</div>
					<div className='absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-3xl' />
				</div>

				{/* Yechilganlar - Apple glass card */}
				<div className='bg-white dark:bg-[#1C1C1E] p-7 rounded-3xl shadow-md border border-[#E5E5EA] dark:border-[#2C2C2E] relative overflow-hidden group cursor-pointer'>
					<div className='relative z-10'>
						<div className='flex justify-between items-start mb-4'>
							<p className='text-[#8E8E93] dark:text-[#98989E] text-xs font-medium uppercase tracking-wide'>
								Yechilganlar
							</p>
							<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#007AFF] transition-colors group-hover:bg-[#E5E5EA] dark:group-hover:bg-[#3A3A3C]'>
								<Target size={16} strokeWidth={1.5} />
							</div>
						</div>
						<p className='text-5xl font-bold text-[#1C1C1E] dark:text-white mb-2 tracking-tight'>
							{solvedCount}
						</p>
						<p className='text-[11px] text-[#8E8E93] dark:text-[#98989E] font-medium uppercase tracking-wide'>
							Siz tomoningizdan
						</p>
					</div>
				</div>

				{/* Aniqlik */}
				<div className='bg-white dark:bg-[#1C1C1E] p-7 rounded-3xl shadow-md border border-[#E5E5EA] dark:border-[#2C2C2E] relative overflow-hidden group cursor-pointer'>
					<div className='relative z-10'>
						<div className='flex justify-between items-start mb-4'>
							<p className='text-[#8E8E93] dark:text-[#98989E] text-xs font-medium uppercase tracking-wide'>
								Aniqlik
							</p>
							<div className='w-9 h-9 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center group-hover:bg-[#E5E5EA] dark:group-hover:bg-[#3A3A3C] transition-colors text-[#2c5ff2]'>
								<TrendingUp size={16} strokeWidth={1.5} />
							</div>
						</div>
						<p className='text-5xl font-bold text-[#1C1C1E] dark:text-white mb-2 tracking-tight'>
							{stats?.overall_accuracy || 0}%
						</p>
						<p className='text-[11px] text-[#8E8E93] dark:text-[#98989E] font-medium uppercase tracking-wide'>
							O'rtacha ko'rsatkich
						</p>
					</div>
				</div>

				{/* Streak */}
				<div className='bg-white dark:bg-[#1C1C1E] p-7 rounded-3xl shadow-md border border-[#E5E5EA] dark:border-[#2C2C2E] relative overflow-hidden group cursor-pointer'>
					<div className='relative z-10'>
						<div className='flex justify-between items-start mb-4'>
							<p className='text-[#8E8E93] dark:text-[#98989E] text-xs font-medium uppercase tracking-wide'>
								Streak
							</p>
							<div className='w-9 h-9 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center group-hover:bg-[#E5E5EA] dark:group-hover:bg-[#3A3A3C] transition-colors text-[#FF9500]'>
								<Clock size={16} strokeWidth={1.5} />
							</div>
						</div>
						<p className='text-5xl font-bold text-[#1C1C1E] dark:text-white mb-2 tracking-tight'>
							{stats?.study_streak || 0}
						</p>
						<p className='text-[11px] text-[#8E8E93] dark:text-[#98989E] font-medium uppercase tracking-wide'>
							Kunlik davomiylik
						</p>
					</div>
				</div>
			</div>

			{/* Main Content Grid */}
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				{/* Analytics Section */}
				<div className='lg:col-span-2 space-y-6'>
					{/* O'qish tahlili - Apple style chart */}
					<div className='bg-white dark:bg-[#1C1C1E] p-7 rounded-3xl border border-[#E5E5EA] dark:border-[#2C2C2E] shadow-md'>
						<div className='flex justify-between items-center mb-6'>
							<div>
								<h3 className='text-lg font-semibold text-[#1C1C1E] dark:text-white'>
									O'qish tahlili
								</h3>
								<p className='text-[#8E8E93] text-xs mt-0.5 font-normal'>
									Oxirgi 7 kunlik faollik
								</p>
							</div>
							<div className='flex items-center gap-4 text-[11px] font-medium text-[#8E8E93]'>
								<span className='flex items-center gap-1.5'>
									<div className='w-2 h-2 rounded-full bg-[#007AFF]' />
									To'g'ri
								</span>
								<span className='flex items-center gap-1.5'>
									<div className='w-2 h-2 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] border border-[#C6C6C8] dark:border-[#3A3A3C]' />
									Noto'g'ri
								</span>
							</div>
						</div>
						<div className='flex items-stretch gap-2 h-52'>
							{[
								{ d: 'Du', c: 65 },
								{ d: 'Se', c: 82 },
								{ d: 'Ch', c: 48 },
								{ d: 'Pa', c: 92 },
								{ d: 'Ju', c: 75 },
								{ d: 'Sh', c: 58 },
								{ d: 'Ya', c: 85 },
							].map((item, i) => (
								<div
									key={i}
									className='flex-1 flex flex-col items-center gap-2.5 group cursor-pointer'
								>
									<div className='w-full flex flex-col items-center gap-1 relative h-40 justify-end'>
										<div className='absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1C1C1E] dark:bg-[#FFFFFF] text-white dark:text-[#1C1C1E] text-[10px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-md'>
											{item.c}%
										</div>
										<motion.div
											initial={{ height: 0 }}
											animate={{ height: `${item.c * 2}px` }}
											transition={{ duration: 0.5, delay: i * 0.05 }}
											className={`w-full rounded-xl transition-all group-hover:opacity-80 ${i === 6 ? 'bg-[#007AFF]' : 'bg-[#007AFF] opacity-40'}`}
										/>
										<motion.div
											initial={{ height: 0 }}
											animate={{ height: `${(100 - item.c) * 2}px` }}
											transition={{ duration: 0.5, delay: i * 0.05 }}
											className='w-full rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E]'
										/>
									</div>
									<span
										className={`text-xs font-medium ${i === 6 ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}
									>
										{item.d}
									</span>
								</div>
							))}
						</div>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						{/* Zaif mavzu - Apple style */}
						<div className='bg-white dark:bg-[#1C1C1E] p-7 rounded-3xl border border-[#E5E5EA] dark:border-[#2C2C2E] shadow-md flex flex-col'>
							<div className='flex items-center gap-3 mb-6'>
								<div className='w-11 h-11 rounded-xl bg-[#FFE5E5] dark:bg-[#3A1212] flex items-center justify-center text-[#FF3B30]'>
									<AlertCircle size={20} strokeWidth={1.5} />
								</div>
								<h3 className='font-semibold text-lg text-[#1C1C1E] dark:text-white'>
									Zaif mavzu
								</h3>
							</div>
							<div className='bg-[#FFE5E5] dark:bg-[#3A1212] border border-[#FFD1D1] dark:border-[#5A2020] p-5 rounded-2xl mb-6 flex-1'>
								<p className='text-[#FF3B30] dark:text-[#FF6B6B] font-semibold text-lg'>
									{stats?.weak_topic || "Hozircha yo'q"}
								</p>
								<p className='text-[#FF3B30]/70 dark:text-[#FF6B6B]/70 text-xs mt-2 leading-relaxed'>
									{stats?.recommendation ||
										"Ushbu mavzuda ko'proq xato kuzatilmoqda. Takrorlash tavsiya etiladi."}
								</p>
							</div>
							<button className='w-full bg-[#007AFF] text-white font-semibold py-4 rounded-2xl hover:bg-[#005BBF] transition-all flex items-center justify-center gap-2 text-sm shadow-md active:scale-97'>
								Mavzuni takrorlash
								<ArrowRight size={16} strokeWidth={1.5} />
							</button>
						</div>

						{/* O'qish jarayoni - Apple style progress ring */}
						<div className='bg-white dark:bg-[#1C1C1E] p-7 rounded-3xl border border-[#E5E5EA] dark:border-[#2C2C2E] shadow-md'>
							<h3 className='text-lg font-semibold text-[#1C1C1E] dark:text-white mb-6'>
								O'qish jarayoni
							</h3>
							<div className='flex flex-col items-center justify-center'>
								<div className='relative w-44 h-44 flex items-center justify-center'>
									<svg className='w-full h-full -rotate-90'>
										<circle
											cx='88'
											cy='88'
											r='76'
											fill='none'
											stroke='#F2F2F7'
											strokeWidth='12'
											className='dark:stroke-[#2C2C2E]'
										/>
										<circle
											cx='88'
											cy='88'
											r='76'
											fill='none'
											stroke='#007AFF'
											strokeWidth='12'
											strokeDasharray='477.5'
											strokeDashoffset={
												477.5 * (1 - solvedCount / (totalQuestions || 1))
											}
											strokeLinecap='round'
											className='transition-all duration-1000 ease-out'
										/>
									</svg>
									<div className='absolute inset-0 flex flex-col items-center justify-center'>
										<span className='text-4xl font-bold text-[#1C1C1E] dark:text-white tracking-tight'>
											{Math.round((solvedCount / (totalQuestions || 1)) * 100)}%
										</span>
										<span className='text-[10px] text-[#8E8E93] dark:text-[#98989E] font-medium uppercase tracking-wide mt-1'>
											Tugallandi
										</span>
									</div>
								</div>
								<div className='flex gap-6 mt-8'>
									<span className='flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-[#007AFF]'>
										<div className='w-2 h-2 rounded-full bg-[#007AFF]' />{' '}
										Bajarildi
									</span>
									<span className='flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-[#C6C6C8] dark:text-[#3A3A3C]'>
										<div className='w-2 h-2 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E]' />{' '}
										Qoldi
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Sidebar Section */}
				<div className='space-y-6'>
					{/* Mavzular - Apple style list */}
					<div className='bg-white dark:bg-[#1C1C1E] p-7 rounded-3xl border border-[#E5E5EA] dark:border-[#2C2C2E] shadow-md'>
						<div className='flex justify-between items-center mb-6'>
							<h3 className='text-lg font-semibold text-[#1C1C1E] dark:text-white'>
								Mavzular
							</h3>
							<span className='bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93] dark:text-[#98989E] text-[10px] font-medium px-3 py-1 rounded-full uppercase tracking-wide'>
								{topics.length} ta
							</span>
						</div>
						<div className='space-y-2'>
							{topics.length > 0 ? (
								topics.slice(0, 5).map((topic, i) => (
									<div
										key={i}
										className='flex items-center gap-4 p-3 rounded-xl hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-all cursor-pointer group'
									>
										<div
											className={`w-10 h-10 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-[#8E8E93] group-hover:bg-[#E5E5EA] dark:group-hover:bg-[#3A3A3C] transition-colors`}
										>
											<GraduationCap size={18} strokeWidth={1.5} />
										</div>
										<div className='min-w-0 flex-1'>
											<h4 className='font-medium text-[#1C1C1E] dark:text-white text-sm truncate'>
												{topic}
											</h4>
											<div className='flex items-center gap-2 mt-1.5'>
												<div className='flex-1 h-1.5 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full overflow-hidden'>
													<div
														className='h-full bg-[#007AFF] rounded-full transition-all'
														style={{
															width: `${topicProgress[topic]?.percentage || 0}%`,
														}}
													/>
												</div>
												<span className='text-[10px] font-medium text-[#8E8E93] dark:text-[#98989E]'>
													{topicProgress[topic]?.percentage || 0}%
												</span>
											</div>
										</div>
										<ArrowRight
											size={14}
											strokeWidth={1.5}
											className='text-[#C6C6C8] dark:text-[#3A3A3C] opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0'
										/>
									</div>
								))
							) : (
								<div className='text-center py-8 text-[#8E8E93] dark:text-[#98989E]'>
									<p className='text-sm font-medium'>Mavzular topilmadi</p>
								</div>
							)}
						</div>
						{topics.length > 5 && (
							<button className='w-full mt-4 text-xs font-medium text-[#007AFF] hover:underline uppercase tracking-wide'>
								Barcha mavzularni ko'rish
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
