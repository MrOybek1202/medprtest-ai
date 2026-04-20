import { statsService } from '@/src/services/api'
import { UserStats } from '@/src/types'
import {
	AlertCircle,
	ArrowRight,
	BookOpen,
	GraduationCap,
	Target,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface WeakPracticeProps {
	userId: string
	onStartPractice: (topic: string) => void
}

export default function WeakPractice({
	userId,
	onStartPractice,
}: WeakPracticeProps) {
	const [stats, setStats] = useState<UserStats | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const data = await statsService.getUserStats(userId)
				setStats(data)
			} catch (error: any) {
				console.error('Failed to fetch stats:', error)
				toast.error(
					'Statistikani yuklashda xatolik yuz berdi: ' + (error.message || ''),
				)
			} finally {
				setLoading(false)
			}
		}
		fetchStats()
	}, [userId])

	if (loading)
		return (
			<div className='p-8 space-y-8 animate-pulse dark:bg-[#0F172A]'>
				<div className='h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4' />
				<div className='h-64 bg-slate-200 dark:bg-slate-800 rounded-[40px]' />
			</div>
		)

	return (
		<div className='p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8 dark:bg-[#0F172A]'>
			<header>
				<h1 className='text-2xl md:text-3xl font-bold text-slate-900 dark:text-white'>
					Zaif mavzular ustida ishlash
				</h1>
				<p className='text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base'>
					AI tahlili asosida siz qiynalayotgan mavzularni aniqlaymiz va
					mustahkamlaymiz.
				</p>
			</header>

			{stats?.weak_topic ? (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					className='flex flex-col items-center gap-8 rounded-[32px] border border-[#dbe4f2] bg-white/92 p-6 shadow-xl shadow-[#102347]/6 md:flex-row md:gap-12 md:rounded-[48px] md:p-12 dark:border-slate-800 dark:bg-slate-900'
				>
					<div className='w-32 h-32 md:w-48 md:h-48 bg-amber-50 dark:bg-amber-500/10 rounded-[32px] md:rounded-[48px] flex items-center justify-center text-amber-500 shrink-0'>
						<Target size={60} className='md:w-20 md:h-20' />
					</div>

					<div className='flex-1 space-y-4 md:space-y-6 text-center md:text-left'>
						<div className='inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest'>
							<AlertCircle size={14} />
							Tavsiya etiladi
						</div>

						<div className='space-y-2'>
							<h2 className='text-2xl md:text-4xl font-bold text-slate-900 dark:text-white'>
								{stats.weak_topic}
							</h2>
							<p className='text-slate-500 dark:text-slate-400 text-sm md:text-lg max-w-2xl'>
								Ushbu mavzudagi testlarda sizning aniqlik ko'rsatkichingiz
								boshqa mavzularga qaraganda pastroq. Hozir mashq qilish orqali
								ushbu bo'shliqni to'ldirishingiz mumkin.
							</p>
						</div>

						<div className='flex flex-wrap gap-4 md:gap-6 justify-center md:justify-start'>
							<div className='flex items-center gap-2 md:gap-3 text-slate-600 dark:text-slate-400'>
								<div className='w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center'>
									<BookOpen size={18} />
								</div>
								<span className='font-bold text-sm md:text-base'>
									15 ta savol
								</span>
							</div>
							<div className='flex items-center gap-2 md:gap-3 text-slate-600 dark:text-slate-400'>
								<div className='w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center'>
									<GraduationCap size={18} />
								</div>
								<span className='font-bold text-sm md:text-base'>
									O'rtacha qiyinchilik
								</span>
							</div>
						</div>

						<button
							onClick={() => onStartPractice(stats.weak_topic!)}
							className='group flex w-full items-center justify-center gap-3 rounded-[20px] bg-[#2c5ff2] px-8 py-4 text-base font-bold text-white shadow-xl shadow-[#2c5ff2]/20 transition-all hover:bg-[#214fd7] md:w-auto md:rounded-[24px] md:px-10 md:py-5 md:text-lg'
						>
							Mashg'ulotni boshlash
							<ArrowRight
								size={20}
								className='md:w-6 md:h-6 transition-transform group-hover:translate-x-2'
							/>
						</button>
					</div>
				</motion.div>
			) : (
				<div className='bg-white dark:bg-slate-900 p-20 rounded-[48px] border border-slate-100 dark:border-slate-800 text-center space-y-6'>
					<div className='w-24 h-24 bg-[#e6f0ff] dark:bg-[#2c5ff2]/10 rounded-[32px] flex items-center justify-center mx-auto text-[#2c5ff2]'>
						<Target size={48} />
					</div>
					<div className='max-w-md mx-auto space-y-2'>
						<h3 className='text-2xl font-bold text-slate-900 dark:text-white'>
							Hozircha zaif mavzular yo'q
						</h3>
						<p className='text-slate-500 dark:text-slate-400'>
							Sizning natijalaringiz a'lo darajada! AI tahlili uchun ko'proq
							test yechishda davom eting.
						</p>
					</div>
					<button
						onClick={() => onStartPractice('')}
						className='bg-slate-900 dark:bg-slate-800 text-white font-bold px-8 py-4 rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-all'
					>
						Umumiy testni boshlash
					</button>
				</div>
			)}
		</div>
	)
}
