import { motion } from "motion/react";

const steps = [
  {
    number: "01",
    title: "Bilim darajasini aniqlash",
    description: "10–15 savoldan iborat qisqa test sizning kuchli va zaif tomonlaringizni aniqlab beradi.",
  },
  {
    number: "02",
    title: "Moslashuvchan testlar",
    description: "Savollar sizning darajangizga moslashadi. Juda osonmi? Qiyinchilik ortadi. Qiyinmi? Tizim sizga yordam beradi.",
  },
  {
    number: "03",
    title: "Tezkor AI tahlili",
    description: "Har bir javobdan so'ng batafsil tushuntirish: nima uchun to'g'ri, keng tarqalgan xatolar va vizual sxemalar.",
  },
  {
    number: "04",
    title: "Kuzatish va rivojlanish",
    description: "Mavzular bo'yicha tahlillar keyingi safar aynan qaysi mavzuga e'tibor qaratish kerakligini ko'rsatadi.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="border-t border-slate-100 bg-slate-50/50 py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="mb-4 font-display text-3xl font-bold text-slate-900 md:text-4xl">
            Savoldan tushunishgacha bir necha soniya
          </h2>
          <p className="text-lg text-slate-600">
            Tibbiy bilimlarni mustahkamlash uchun maxsus ishlab chiqilgan o'quv jarayoni.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-2">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex gap-6"
            >
              <span className="font-display text-5xl font-bold text-[#1B4D3E]/10">
                {step.number}
              </span>
              <div>
                <h3 className="mb-2 font-display text-xl font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
