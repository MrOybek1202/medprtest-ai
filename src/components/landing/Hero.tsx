import { motion } from "motion/react";
import { ArrowRight, Sparkles, Brain, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onGetStarted: () => void;
  onInstall: () => void;
}

const Hero = ({ onGetStarted, onInstall }: HeroProps) => {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#1B4D3E]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1B4D3E]/20 bg-[#1B4D3E]/5 px-4 py-1.5 text-sm font-medium text-[#1B4D3E]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI asosidagi tibbiy ta'lim
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 font-display text-5xl font-bold leading-tight tracking-tight text-slate-900 md:text-7xl"
          >
            Yodlash emas,{" "}
            <span className="bg-gradient-to-r from-[#1B4D3E] to-blue-600 bg-clip-text text-transparent">
              tushunish
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-slate-600 md:text-xl"
          >
            MedTest AI — bu shunchaki testlar emas, balki shifokorcha fikrlashni shakllantiruvchi tizimdir. 
            Moslashuvchan qiyinchilik darajasi, AI tushuntirishlari va klinik tahlillar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button 
              size="lg" 
              onClick={onGetStarted} 
              className="bg-[#1B4D3E] hover:bg-[#153a2f] gap-3 px-10 py-7 text-lg font-bold shadow-xl shadow-[#1B4D3E]/20 rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              O'qishni bepul boshlang
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={onInstall} 
              className="px-10 py-7 text-lg font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl transition-all hover:scale-105 active:scale-95 gap-3"
            >
              <Download className="h-5 w-5" />
              Ilovani yuklab olish
            </Button>
          </motion.div>
        </div>

        {/* Hero mockup - Two Mobile Screens */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto mt-16 max-w-5xl flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12"
        >
          {/* Left Phone: Clinical Question */}
          <div className="relative w-[280px] sm:w-[320px] aspect-[9/19] bg-white rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 pt-10 flex-1 flex flex-col gap-6">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold">19:41</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-slate-100" />
                  <div className="w-3 h-3 rounded-full bg-slate-100" />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Klinik savol</p>
                <h4 className="text-lg font-bold text-slate-900 leading-tight">
                  Bemorda o'ng qovurg'a ostida og'riq va sarg'ayish kuzatildi...
                </h4>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Ushbu klinik holatda eng ehtimoliy tashxisni aniqlang va keyingi tekshiruv bosqichini belgilang.
              </p>

              <div className="space-y-3">
                {[
                  { text: 'O\'tkir xolesistit', selected: true },
                  { text: 'Virusli gepatit' },
                  { text: 'O\'tkir pankreatit' },
                  { text: 'Duodenal yara' }
                ].map((opt, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-50 bg-slate-50/30">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${opt.selected ? 'border-[#1B4D3E]' : 'border-slate-200'}`}>
                      {opt.selected && <div className="w-2 h-2 rounded-full bg-[#1B4D3E]" />}
                    </div>
                    <span className="text-[11px] font-medium text-slate-600">{opt.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto space-y-3 pb-4">
                <button className="w-full py-3.5 bg-[#1B4D3E] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#1B4D3E]/20">
                  Javobni yuborish
                </button>
              </div>
            </div>
          </div>

          {/* Right Phone: AI Explanation */}
          <div className="relative w-[280px] sm:w-[320px] aspect-[9/19] bg-[#0A0F1C] rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 pt-10 flex-1 flex flex-col gap-6">
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-xs font-bold">19:41</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-slate-800" />
                  <div className="w-3 h-3 rounded-full bg-slate-800" />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sun'iy intellekt tahlili</p>
                <h4 className="text-lg font-bold text-white leading-tight">
                  AI Tushuntirishi
                </h4>
              </div>

              <div className="relative aspect-square bg-slate-900/50 rounded-3xl border border-slate-800/50 flex items-center justify-center overflow-hidden">
                <img 
                  src="https://picsum.photos/seed/skeleton/600/600" 
                  alt="Anatomy Visualization" 
                  className="absolute inset-0 w-full h-full object-contain opacity-80"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800/50 space-y-2">
                <p className="text-[10px] font-bold text-white">Nima uchun bu javob to'g'ri?</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  O'ng qovurg'a ostidagi og'riq va sarg'ayish (Murphy simptomi) ko'pincha o't pufagi yallig'lanishidan dalolat beradi. AI sizga patofiziologik jarayonni tushuntirib beradi.
                </p>
              </div>

              <div className="mt-auto pb-4">
                <button className="w-full py-3.5 bg-[#1B4D3E] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#1B4D3E]/20">
                  Keyingi savol
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
