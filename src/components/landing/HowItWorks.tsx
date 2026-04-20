import { motion } from "motion/react"

const steps = [
  { number: "01", title: "Savolni boshlang", description: "Mavzu tanlang yoki umumiy testni ishga tushiring. Tizim sizga mos darajadan boshlaydi.", accent: "Boshlash" },
  { number: "02", title: "Javob bering", description: "Har bir savol tartibli, fokuslangan va tez o'qiladigan ko'rinishda beriladi.", accent: "Fokus" },
  { number: "03", title: "AI izohni oling", description: "Tizim nima uchun aynan shu javob to'g'ri yoki noto'g'ri ekanini tushuntiradi.", accent: "Tushunish" },
  { number: "04", title: "Zaif mavzuni ko'ring", description: "Platforma keyingi mashq uchun qaysi bo'limga e'tibor berishni ko'rsatadi.", accent: "O'sish" },
];

export default function HowItWorks() {
  return (
    <section id="jarayon" className="relative bg-ink text-paper">
      <div className="container py-24 md:py-36">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-12">
          {/* Sticky left */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p className="font-mono-c text-xs uppercase tracking-[0.3em] text-accent">— Jarayon</p>
              <h2 className="mt-6 font-display text-5xl font-light leading-[0.95] tracking-tight md:text-7xl">
                To'rt qadam.
                <br />
                <em className="italic text-accent">Bitta oqim.</em>
              </h2>
              <p className="mt-8 max-w-md text-lg leading-relaxed text-paper/70">
                Savol, javob, AI sharh va progress bitta uzluksiz tajribada birlashadi. Hech qanday qo'shimcha qadam yo'q.
              </p>
              <div className="mt-10 flex items-center gap-4">
                <div className="h-px flex-1 bg-paper/20" />
                <span className="font-mono-c text-xs uppercase tracking-widest text-paper/40">Scroll</span>
                <div className="h-px w-12 bg-accent" />
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-6 lg:col-span-7">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className="group relative overflow-hidden rounded-[28px] border border-paper/10 bg-paper/[0.04] p-8 backdrop-blur-sm transition-colors duration-500 hover:bg-paper/[0.08] md:p-10"
              >
                <div className="flex items-baseline justify-between gap-6">
                  <span className="font-display text-7xl font-light italic text-paper/15 md:text-8xl">
                    {step.number}
                  </span>
                  <span className="font-mono-c text-xs uppercase tracking-widest text-accent">
                    {step.accent}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-3xl font-light tracking-tight md:text-4xl">
                  {step.title}
                </h3>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-paper/70 md:text-lg">
                  {step.description}
                </p>
                <div className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-accent transition-transform duration-700 group-hover:scale-x-100" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}  