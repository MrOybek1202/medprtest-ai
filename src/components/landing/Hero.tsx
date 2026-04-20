import { Button } from '@/components/ui/button'
import {
	Activity,
	ArrowRight,
	Brain,
	Download,
	Heart,
	ShieldCheck,
	Sparkles,
} from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface HeroProps {
	onGetStarted: () => void
	onInstall: () => void
}

const stats = [
	{ label: 'Faol foydalanuvchi', value: '18K+' },
	{ label: 'AI sharh aniqligi', value: '99.8%' },
	{ label: "O'rtacha javob", value: '12 soniya' },
]

const progressRows = [
	{ label: 'Terapiya', value: 92 },
	{ label: 'Nevrologiya', value: 86 },
	{ label: 'Pediatriya', value: 74 },
]

function ProcessingIndicator() {
	return (
		<div className='flex items-center gap-2 rounded-full border border-[#cfe0ff] bg-white/70 px-3 py-1.5 backdrop-blur-xl'>
			<div className='flex gap-1'>
				{[0, 1, 2].map(i => (
					<motion.div
						key={i}
						animate={{ opacity: [0.35, 1, 0.35] }}
						transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
						className='h-1.5 w-1.5 rounded-full bg-[#2c5ff2]'
					/>
				))}
			</div>
			<span className='text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2c5ff2]'>
				Tahlil
			</span>
		</div>
	)
}

function FloatingCard({
	children,
	className,
	delay = 0,
}: {
	children: ReactNode
	className?: string
	delay?: number
}) {
	return (
		<motion.div
			animate={{ y: [-2, 16, -2], rotate: [-1.2, 1.2, -1.2] }}
			transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay }}
			className={className}
		>
			{children}
		</motion.div>
	)
}

export default function Hero({ onGetStarted, onInstall }: HeroProps) {
	return (
		<section
			id='top'
			className='relative overflow-hidden px-4 pb-10 pt-20 md:px-8 md:pt-20'
		>
			<video
				autoPlay
				muted
				loop
				playsInline
				className='absolute inset-0 h-full w-full object-cover opacity-90'
				src='/media/hero-medical.mp4'
			/>
			<div className='pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(244,246,251,0.74),rgba(244,246,251,0.9)),radial-gradient(circle_at_18%_72%,rgba(44,95,242,0.12),transparent_28%),radial-gradient(circle_at_82%_24%,rgba(125,211,252,0.1),transparent_24%)]' />

			<div className='relative mx-auto max-w-[1280px]'>
				<div className='pt-4 md:pt-6'>
					<div className='grid items-center gap-10 xl:grid-cols-[0.95fr_1.05fr]'>
						<div className='max-w-[640px] xl:pl-10'>
							<motion.div
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5 }}
								className='inline-flex items-center gap-2 rounded-full border border-[#d8e2f1] bg-white/70 px-4 py-2 text-sm font-semibold text-[#2c5ff2] shadow-[0_12px_32px_rgba(44,95,242,0.08)] backdrop-blur-xl'
							>
								<Sparkles className='size-4' />
								AI yordamidagi tibbiy tayyorgarlik
							</motion.div>

							<motion.h1
								initial={{ opacity: 0, y: 18 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.55, delay: 0.06 }}
								className='mt-6 text-[3rem] font-semibold leading-[0.92] tracking-[-0.04em] text-[#102347] md:text-[5.2rem]'
							>
								Tibbiy testlarni
								<span className='block text-[#2c5ff2]'>aniqroq tushuning.</span>
							</motion.h1>

							<motion.p
								initial={{ opacity: 0, y: 18 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.55, delay: 0.12 }}
								className='mt-4 max-w-[500px] text-[1rem] leading-8 text-[#5e6d88]'
							>
								MedTest AI savol, AI izoh, zaif mavzu va chatni bitta zamonaviy
								oqimga birlashtiradi. Interfeys yengil, natija esa foydali.
							</motion.p>

							<motion.div
								initial={{ opacity: 0, y: 18 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.55, delay: 0.18 }}
								className='mt-6 flex flex-col gap-4 sm:flex-row'
							>
								<Button
									size='lg'
									onClick={onGetStarted}
									className='rounded-3xl bg-[#102347] px-8 py-6 text-[1.02rem] font-semibold text-white shadow-[0_16px_40px_rgba(16,35,71,0.2)] hover:bg-[#0d1d3e]'
								>
									Boshlash
									<ArrowRight className='size-4.5' />
								</Button>
								<Button
									variant='outline'
									size='lg'
									onClick={onInstall}
									className='rounded-3xl border border-[#d8e2f1] bg-white/72 px-8 py-6 text-[1.02rem] font-semibold text-[#102347] shadow-[0_10px_24px_rgba(20,27,37,0.04)] backdrop-blur-xl hover:bg-white'
								>
									Ilovani yuklash
									<Download className='size-4.5' />
								</Button>
							</motion.div>

							<div className='mt-8 grid gap-4 sm:grid-cols-3'>
								{stats.map((item, index) => (
									<motion.div
										key={item.label}
										initial={{ opacity: 0, y: 18 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.45, delay: 0.24 + index * 0.06 }}
										className='rounded-[24px] border border-[#dbe4f2] bg-white/82 px-5 py-5 shadow-[0_16px_34px_rgba(16,35,71,0.05)] backdrop-blur-xl'
									>
										<p className='text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7a95]'>
											{item.label}
										</p>
										<p className='mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#102347]'>
											{item.value}
										</p>
									</motion.div>
								))}
							</div>
						</div>

						<motion.div
							initial={{ opacity: 0, y: 26 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.65, delay: 0.1 }}
							className='relative mx-auto w-full max-w-[560px]'
						>
							<div className='relative h-[440px] max-h-[500px] overflow-hidden md:h-[520px]'>


								<FloatingCard
									className='absolute left-4 top-5 z-20 w-[238px] md:left-6 md:w-[264px]'
									delay={0}
								>
									<div className='rounded-[28px] border border-white/50 bg-white/82 p-5 backdrop-blur-[20px]'>
										<div className='mb-4 flex items-center justify-between'>
											<div className='text-[11px] font-semibold uppercase tracking-[0.16em] text-[#667794]'>
												Tizim holati
											</div>
											<ProcessingIndicator />
										</div>
										<div className='space-y-3.5'>
											{progressRows.map(item => (
												<div key={item.label} className='space-y-2'>
													<div className='flex justify-between text-[13px] font-medium text-[#102347]'>
														<span>{item.label}</span>
														<span>{item.value}%</span>
													</div>
													<div className='h-1.5 overflow-hidden rounded-full bg-[#dbe4f2]'>
														<motion.div
															initial={{ width: 0 }}
															animate={{ width: `${item.value}%` }}
															transition={{ duration: 1.2, delay: 0.2 }}
															className='h-full rounded-full bg-[#2c5ff2]'
														/>
													</div>
												</div>
											))}
										</div>
									</div>
								</FloatingCard>

								<FloatingCard
									className='absolute right-4 top-24 z-20 w-[214px] md:right-6 md:w-[238px]'
									delay={0.8}
								>
									<div className='rounded-[28px] border border-white/20 bg-[#102347]/78 p-5 text-white  backdrop-blur-[18px]'>
										<div className='flex items-center gap-2 text-[#8eb0ff]'>
											<Brain className='size-4' />
											<span className='text-[11px] font-semibold uppercase tracking-[0.16em]'>
												AI Sharh
											</span>
										</div>
										<p className='mt-4 text-[0.95rem] leading-6 text-white/78'>
											"Bu savolda klinik mantiq terapiya yo'nalishiga yaqin. AI
											izoh foydalanuvchini keyingi qadamga olib boradi."
										</p>
									</div>
								</FloatingCard>

								<FloatingCard
									className='absolute bottom-14 left-12 z-20 w-[178px]'
									delay={1.2}
								>
									<div className='flex items-center gap-2 rounded-full border border-white/50 bg-white/82 px-4 py-3 text-sm font-semibold text-[#102347] backdrop-blur-xl'>
										<Activity className='size-4 text-[#2c5ff2]' />
										Terapiya oqimi
									</div>
								</FloatingCard>

								<FloatingCard
									className='absolute bottom-18 right-8 z-20 w-[180px]'
									delay={1.6}
								>
									<div className='flex items-center gap-2 rounded-full border border-white/40 bg-white/82 px-4 py-3 text-sm font-semibold text-[#102347] backdrop-blur-xl'>
										<Heart className='size-4 text-[#ef4444]' />
										Klinik xavfsizlik
									</div>
								</FloatingCard>

								<FloatingCard
									className='absolute left-[160px] top-[270px] z-20 w-[190px] md:left-[200px]'
									delay={2}
								>
									<div className='flex items-center gap-2 rounded-full border border-white/45 bg-white/80 px-4 py-3 text-sm font-semibold text-[#102347] backdrop-blur-xl'>
										<ShieldCheck className='size-4 text-[#2c5ff2]' />
										Ishonchli natija
									</div>
								</FloatingCard>
							</div>
						</motion.div>
					</div>
				</div>
			</div>
		</section>
	)
}
