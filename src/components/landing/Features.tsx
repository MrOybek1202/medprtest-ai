import {
	BarChart3,
	Brain,
	Layers3,
	MessageSquareText,
	ShieldCheck,
	Stethoscope,
} from 'lucide-react'
import { motion } from 'motion/react'
import Marquee from './Marquee'

const features = [
	{
		icon: Brain,
		title: 'AI sharh',
		description:
			'Har bir javob uchun tushunarli, tuzilmali va o‘qishga yengil izoh.',
		tag: '01 — Cognitive',
	},
	{
		icon: Stethoscope,
		title: 'Klinik fokus',
		description: 'Savollar real tibbiy fikrlashga yaqin holatda qurilgan.',
		tag: '02 — Clinical',
	},
	{
		icon: BarChart3,
		title: 'Aniq progress',
		description:
			'O‘sish, xatolar va zaif mavzular keraksiz shovqinsiz ko‘rinadi.',
		tag: '03 — Insight',
	},
	{
		icon: Layers3,
		title: 'Tartibli UI',
		description:
			'Har bir ekran sokin, premium va tez tushuniladigan kompozitsiyada.',
		tag: '04 — Design',
	},
	{
		icon: MessageSquareText,
		title: 'AI chat',
		description:
			'Savoldan keyin qo‘shimcha izoh va aniqlashtirishni darhol oling.',
		tag: '05 — Dialog',
	},
	{
		icon: ShieldCheck,
		title: 'Ishonchli tajriba',
		description: 'Tezkor javob, toza tipografiya va aniq vizual iyerarxiya.',
		tag: '06 — Trust',
	},
]

export default function Features() {
	return (
		<section
			id='imkoniyatlar'
			className='relative overflow-hidden bg-paper py-24 md:py-36 grain'
		>
			<div className='border-y border-ink/10 bg-ink py-4 text-paper'>
				<Marquee>
					{[
						'Klinik aniqlik',
						'AI izoh',
						"Tartibli o'qish",
						'Real natija',
						'Premium tajriba',
						'Tezkor javob',
					].map(t => (
						<span key={t} className='font-display text-3xl italic md:text-5xl'>
							{t} <span className='mx-6 text-accent'>✦</span>
						</span>
					))}
				</Marquee>
			</div>

			<div className='container mt-24'>
				<div className='grid items-end gap-10 md:grid-cols-12 md:gap-16'>
					<div className='md:col-span-5'>
						<p className='font-mono-c text-xs uppercase tracking-[0.3em] text-primary'>
							— Imkoniyatlar / 06
						</p>
						<h2 className='mt-6 font-display text-5xl font-light leading-[0.95] tracking-tight text-ink md:text-7xl'>
							O‘qishni <em className='italic text-primary'>tezlashtiradigan</em>{' '}
							sokin muhit.
						</h2>
					</div>
					<div className='md:col-span-6 md:col-start-7'>
						<p className='text-lg leading-relaxed text-muted-foreground md:text-xl'>
							Har bir komponent — savol, AI sharh, progress va chat — bitta
							editorial oqimga bog'langan. Hech narsa shovqin qilmaydi, lekin
							barchasi ish qiladi.
						</p>
					</div>
				</div>

				<div className='mt-20 grid gap-px overflow-hidden rounded-[32px] border border-ink/10 bg-ink/10 md:grid-cols-2 lg:grid-cols-3'>
					{features.map((feature, index) => (
						<motion.div
							key={feature.title}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, amount: 0.2 }}
							transition={{ duration: 0.5, delay: index * 0.05 }}
							className='group relative bg-paper p-10 transition-colors duration-500 hover:bg-cream'
						>
							<div className='flex items-start justify-between'>
								<span className='font-mono-c text-[11px] uppercase tracking-widest text-muted-foreground'>
									{feature.tag}
								</span>
								<div className='flex size-12 items-center justify-center rounded-full border border-ink/15 text-ink transition-transform duration-500 group-hover:rotate-45 group-hover:border-primary group-hover:text-primary'>
									<feature.icon className='size-5' />
								</div>
							</div>
							<h3 className='mt-12 font-display text-3xl font-light leading-tight tracking-tight text-ink md:text-4xl'>
								{feature.title}
							</h3>
							<p className='mt-5 max-w-sm text-base leading-relaxed text-muted-foreground'>
								{feature.description}
							</p>
							<div className='mt-10 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-700 group-hover:scale-x-100' />
						</motion.div>
					))}
				</div>
			</div>
		</section>
	)
}
