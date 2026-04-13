import { motion } from "motion/react";
import { Brain, BookOpen, TrendingUp, MessageSquare, Layers, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Tushuntirishlari",
    description:
      "Har bir javob nima uchun to'g'ri yoki noto'g'riligini savolga bog'langan holda AI yordamida batafsil tushunib oling.",
  },
  {
    icon: TrendingUp,
    title: "Moslashuvchan Qiyinchilik",
    description:
      "Tizim sizning aniqligingiz, tezligingiz va zaif mavzularingizga qarab real vaqtda qiyinchilikni moslashtiradi.",
  },
  {
    icon: BookOpen,
    title: "Ichki Lug'at",
    description:
      "Test paytida istalgan terminni belgilang va uning ta'rifini, eslab qolish usullarini testdan chiqmasdan bilib oling.",
  },
  {
    icon: Layers,
    title: "Vizual Diagrammalar",
    description:
      "Murakkab mavzularni oson tushunish uchun AI tomonidan yaratilgan anatomiya diagrammalari va sxemalar.",
  },
  {
    icon: MessageSquare,
    title: "AI Chat bilan Savol-Javob",
    description:
      "Klinik holat yuzasidan qo'shimcha savollar bering. AI sizning o'quv sessiyangizga mos holda javob beradi.",
  },
  {
    icon: BarChart3,
    title: "Rivojlanish Tahlili",
    description:
      "Mavzular bo'yicha 'issiqlik xaritalari', aniqlik tendensiyalari va AI tavsiyalari sizning keyingi qadamingizni belgilaydi.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="mb-4 font-display text-3xl font-bold text-slate-900 md:text-4xl">
            Klinik fikrlash uchun kerakli barcha vositalar
          </h2>
          <p className="text-lg text-slate-600">
            Chuqur tushunishni shakllantirish uchun mo'ljallangan oltita integratsiyalashgan vosita.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-8 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B4D3E]/10 text-[#1B4D3E] transition-colors group-hover:bg-[#1B4D3E] group-hover:text-white">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold text-slate-900">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
