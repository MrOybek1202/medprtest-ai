import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '../ui/accardion'

const faqs = [
	{
		q: 'MedTest AI bepulmi?',
		a: 'Asosiy imkoniyatlar bepul. Premium AI chat va kengaytirilgan analitika obuna asosida ishlaydi.',
	},
	{
		q: 'AI sharh qanchalik aniq?',
		a: "AI klinik manbalarga asoslangan va 99.8% aniqlik ko'rsatkichiga ega. Har bir javob tibbiy mantiqqa muvofiq tekshiriladi.",
	},
	{
		q: "Qaysi yo'nalishlar mavjud?",
		a: "Terapiya, pediatriya, nevrologiya, jarrohlik va boshqa 12 dan ortiq yo'nalish bo'yicha minglab savollar mavjud.",
	},
	{
		q: 'Mobil ilova bormi?',
		a: "Ha, iOS va Android uchun ilova mavjud. Veb versiya esa har qanday qurilmada to'liq ishlaydi.",
	},
	{
		q: "Ma'lumotlarim xavfsizmi?",
		a: "Barcha shaxsiy ma'lumotlar shifrlangan holda saqlanadi. Biz GDPR va tibbiy ma'lumot xavfsizligi standartlariga rioya qilamiz.",
	},
]

export default function FAQ() {
	return (
		<section className='bg-paper py-24 md:py-36'>
			<div className='container'>
				<div className='grid gap-16 lg:grid-cols-12'>
					<div className='lg:col-span-4'>
						<p className='font-mono-c text-xs uppercase tracking-[0.3em] text-primary'>
							— Savol javob
						</p>
						<h2 className='mt-6 font-display text-5xl font-light leading-[0.95] tracking-tight text-ink md:text-6xl'>
							Tez-tez beriladigan <em className='italic'>savollar.</em>
						</h2>
						<p className='mt-8 text-lg leading-relaxed text-muted-foreground'>
							Yana savollaringiz bormi? AI chat orqali to'g'ridan-to'g'ri javob
							oling.
						</p>
					</div>

					<div className='lg:col-span-7 lg:col-start-6'>
						<Accordion type='single' collapsible className='w-full'>
							{faqs.map((faq, i) => (
								<AccordionItem
									key={faq.q}
									value={`item-${i}`}
									className='border-b border-ink/15 py-2'
								>
									<AccordionTrigger className='group items-baseline gap-6 py-6 text-left hover:no-underline'>
										<span className='flex items-baseline gap-6'>
											<span className='font-mono-c text-sm text-muted-foreground'>
												{String(i + 1).padStart(2, '0')}
											</span>
											<span className='font-display text-2xl font-light leading-snug text-ink transition-colors group-hover:text-primary md:text-3xl'>
												{faq.q}
											</span>
										</span>
									</AccordionTrigger>
									<AccordionContent className='pb-6 pl-12 text-base leading-relaxed text-muted-foreground md:text-lg'>
										{faq.a}
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</div>
				</div>
			</div>
		</section>
	)
}
