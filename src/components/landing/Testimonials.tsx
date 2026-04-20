import { Quote } from 'lucide-react'
import Marquee from './Marquee'

const quotes = [
	{
		name: 'Dilnoza R.',
		role: 'TATU 5-kurs',
		text: "AI sharh xatolarimni real tushuntiradi. Bu boshqa platformalarda yo'q edi.",
	},
	{
		name: 'Jasur M.',
		role: 'Rezident, Terapiya',
		text: "Interfeys juda sokin. Soatlab ishlasam ham ko'zim charchamaydi.",
	},
	{
		name: 'Madina A.',
		role: 'Pediatr',
		text: "Zaif mavzular bo'limi mening rejamni butunlay o'zgartirdi.",
	},
	{
		name: 'Sardor X.',
		role: 'Internatura',
		text: 'Birinchi marta test yechish lazzatli tuyuldi. Premium hissi bor.',
	},
	{
		name: 'Nigora T.',
		role: 'Nevrolog',
		text: 'AI chat — bu live tutor. Savolga savol bilan javob berish mumkin.',
	},
	{
		name: 'Bekzod K.',
		role: 'TTA 6-kurs',
		text: 'Progress vizualizatsiyasi shunchaki chiroyli emas, foydali ham.',
	},
]

function Card({ q }: { q: (typeof quotes)[number] }) {
	return (
		<div className='flex w-[360px] shrink-0 flex-col justify-between rounded-[24px] border border-ink/10 bg-paper p-7 md:w-[420px]'>
			<div>
				<Quote className='size-6 text-primary' />
				<p className='mt-5 font-display text-xl font-light leading-snug text-ink md:text-2xl'>
					"{q.text}"
				</p>
			</div>
			<div className='mt-8 flex items-center gap-3 border-t border-ink/10 pt-5'>
				<div className='flex size-10 items-center justify-center rounded-full bg-gradient-editorial font-display text-paper'>
					{q.name[0]}
				</div>
				<div>
					<p className='text-sm font-semibold text-ink'>{q.name}</p>
					<p className='font-mono-c text-[11px] uppercase tracking-widest text-muted-foreground'>
						{q.role}
					</p>
				</div>
			</div>
		</div>
	)
}

export default function Testimonials() {
	return (
		<section className='overflow-hidden bg-cream py-24 md:py-32 grain'>
			<div className='container mb-16'>
				<div className='grid items-end gap-8 md:grid-cols-12'>
					<div className='md:col-span-7'>
						<p className='font-mono-c text-xs uppercase tracking-[0.3em] text-primary'>
							— Foydalanuvchilar
						</p>
						<h2 className='mt-6 font-display text-5xl font-light leading-[0.95] tracking-tight text-ink md:text-7xl'>
							Talabalar va shifokorlar{' '}
							<em className='italic text-primary'>aytishmoqda.</em>
						</h2>
					</div>
					<div className='md:col-span-4 md:col-start-9'>
						<div className='flex items-baseline gap-4'>
							<span className='font-display text-7xl font-light text-ink'>
								4.9
							</span>
							<div className='flex flex-col'>
								<span className='font-mono-c text-xs uppercase tracking-widest text-muted-foreground'>
									o'rtacha baho
								</span>
								<span className='text-sm text-ink'>
									18,000+ faol foydalanuvchi
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='space-y-6'>
				<Marquee>
					{quotes.map(q => (
						<Card key={q.name} q={q} />
					))}
				</Marquee>
				<Marquee reverse slow>
					{[...quotes].reverse().map(q => (
						<Card key={q.name + '-r'} q={q} />
					))}
				</Marquee>
			</div>
		</section>
	)
}
