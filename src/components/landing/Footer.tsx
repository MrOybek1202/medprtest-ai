import { HeartPulse, Instagram, Send, Youtube } from 'lucide-react'

const cols = [
	{
		title: 'Mahsulot',
		links: ['Imkoniyatlar', 'Jarayon', 'Narxlar', 'Yangiliklar'],
	},
	{
		title: 'Kompaniya',
		links: ['Biz haqimizda', 'Karyera', 'Hamkorlar', 'Aloqa'],
	},
	{ title: 'Resurslar', links: ["Qo'llanma", 'Blog', 'Yordam', 'Maxfiylik'] },
]

export default function Footer() {
	return (
		<footer id='haqida' className='relative overflow-hidden bg-ink text-paper'>
			<div className='container py-20'>
				<div className='grid gap-16 md:grid-cols-12'>
					<div className='md:col-span-5'>
						<div className='flex items-center gap-3'>
							<div className='flex size-11 items-center justify-center rounded-full bg-paper text-ink'>
								<HeartPulse className='size-5' />
							</div>
							<span className='font-display text-2xl tracking-tight'>
								MedTest AI
							</span>
						</div>
						<p className='mt-8 max-w-md font-display text-3xl font-light leading-tight md:text-4xl'>
							Tibbiy ta'limni{' '}
							<em className='italic text-accent'>qayta o'ylash.</em>
						</p>
						<div className='mt-8 flex gap-3'>
							{[Instagram, Send, Youtube].map((Icon, i) => (
								<a
									key={i}
									href='#'
									className='flex size-11 items-center justify-center rounded-full border border-paper/20 transition-colors hover:border-accent hover:text-accent'
								>
									<Icon className='size-4' />
								</a>
							))}
						</div>
					</div>

					{cols.map(col => (
						<div key={col.title} className='md:col-span-2'>
							<p className='font-mono-c text-xs uppercase tracking-widest text-paper/40'>
								{col.title}
							</p>
							<ul className='mt-5 space-y-3'>
								{col.links.map(l => (
									<li key={l}>
										<a
											href='#'
											className='text-sm text-paper/80 transition-colors hover:text-accent'
										>
											{l}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</div>

			{/* Big serif brand */}
			<div className='overflow-hidden'>
				<p className='-mb-8 select-none whitespace-nowrap text-center font-display text-[22vw] font-light italic leading-none text-paper/8 md:-mb-16'>
					MedTest<span className='text-accent/30'>.</span>
				</p>
			</div>

			<div className='border-t border-paper/10'>
				<div className='container flex flex-col items-start justify-between gap-3 py-6 md:flex-row md:items-center'>
					<p className='font-mono-c text-xs uppercase tracking-widest text-paper/50'>
						© {new Date().getFullYear()} MedTest AI · Barcha huquqlar
						himoyalangan
					</p>
					<p className='font-mono-c text-xs uppercase tracking-widest text-paper/50'>
						Tashkent · Uzbekistan
					</p>
				</div>
			</div>
		</footer>
	)
}
