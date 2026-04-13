import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CTAProps {
  onGetStarted: () => void;
}

const CTA = ({ onGetStarted }: CTAProps) => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-[40px] bg-[#1B4D3E] p-12 text-center md:p-16 shadow-2xl shadow-[#1B4D3E]/20"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.15),transparent_60%)]" />
          <h2 className="relative mb-6 font-display text-3xl font-bold text-white md:text-5xl">
            Shifokordek fikrlashga tayyormisiz?
          </h2>
          <p className="relative mx-auto mb-10 max-w-xl text-lg text-slate-200">
            Shunchaki yodlashni to'xtating va minglab talabalar kabi klinik fikrlashni shakllantiring.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={onGetStarted}
            className="relative gap-2 px-10 py-7 text-lg font-bold bg-white text-[#1B4D3E] hover:bg-slate-100 rounded-2xl"
          >
            Bepul boshlash
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
