import { Button } from '@/components/ui/button'
import { ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import Marquee from './Marquee'

interface CTAProps {
	onGetStarted: () => void
}

export default function CTA({ onGetStarted }: CTAProps) {
	return (
		<section id='boshlash' className='bg-paper px-4 py-16 md:px-8 md:py-24'>
			<div className='container'>
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.2 }}
					transition={{ duration: 0.7 }}
					className='relative overflow-hidden rounded-[36px] bg-gradient-editorial p-10 text-paper shadow-editorial md:p-20 grain'
				>
					{/* Decorative serif background */}
					<span
						aria-hidden
						className='pointer-events-none absolute -right-10 -top-20 select-none font-display text-[20rem] italic leading-none text-paper/5 md:text-[28rem]'
					>
						ai
					</span>

					<div className='relative grid gap-12 lg:grid-cols-12'>
						<div className='lg:col-span-8'>
							<p className='font-mono-c text-xs uppercase tracking-[0.3em] text-paper/60'>
								— Hozir boshlang
							</p>
							<h2 className='mt-6 font-display text-5xl font-light leading-[0.95] tracking-tight md:text-7xl lg:text-8xl'>
								Tibbiy testlarni
								<br />
								<em className='italic text-accent'>tartibli</em> tayyorlang.
							</h2>
							<p className='mt-8 max-w-xl text-lg leading-relaxed text-paper/80 md:text-xl'>
								MedTest AI sizga savol, AI sharh, zaif mavzu va o'sishni bitta
								zamonaviy oqimda taqdim etadi.
							</p>
						</div>

						<div className='flex flex-col justify-end gap-4 lg:col-span-4'>
							<Button
								onClick={onGetStarted}
								size='lg'
								className='group h-auto justify-between rounded-full bg-paper px-8 py-7 text-lg font-medium text-ink hover:bg-accent hover:text-accent-foreground'
							>
								Hozir boshlash
								<ArrowUpRight className='size-5 transition-transform group-hover:rotate-45' />
							</Button>
							<p className='font-mono-c text-xs uppercase tracking-widest text-paper/50'>
								Bepul · Kredit karta talab qilinmaydi
							</p>
						</div>
					</div>

					<div className='relative mt-16 border-t border-paper/15 pt-8'>
						<Marquee>
							{[
								'18K+ Foydalanuvchi',
								'99.8% AI aniqlik',
								"12s o'rtacha javob",
								"12+ yo'nalish",
								'4.9★ baho',
							].map(t => (
								<span
									key={t}
									className='font-display text-2xl italic text-paper/70 md:text-3xl'
								>
									{t} <span className='mx-6 text-accent'>●</span>
								</span>
							))}
						</Marquee>
					</div>
				</motion.div>
			</div>
		</section>
	)
}
