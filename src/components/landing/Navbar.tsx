import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HeartPulse, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onSignIn: () => void;
  onGetStarted: () => void;
}

const Navbar = ({ onSignIn, onGetStarted }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B4D3E]">
            <HeartPulse className="h-6 w-6 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-slate-900">
            MedTest <span className="text-[#1B4D3E]">AI</span>
          </span>
        </div>

        <div className="hidden items-center gap-10 lg:flex">
          <a href="#features" className="text-sm font-bold text-slate-500 transition-colors hover:text-[#1B4D3E] uppercase tracking-widest">
            Imkoniyatlar
          </a>
          <a href="#how-it-works" className="text-sm font-bold text-slate-500 transition-colors hover:text-[#1B4D3E] uppercase tracking-widest">
            Qanday ishlaydi
          </a>
          <a href="#pricing" className="text-sm font-bold text-slate-500 transition-colors hover:text-[#1B4D3E] uppercase tracking-widest">
            Narxlar
          </a>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-500 font-bold hover:text-[#1B4D3E] hover:bg-slate-50"
              onClick={onSignIn}
            >
              Kirish
            </Button>
            <Button 
              size="sm" 
              className="bg-[#1B4D3E] hover:bg-[#153a2f] font-bold px-6 rounded-xl shadow-lg shadow-[#1B4D3E]/20"
              onClick={onGetStarted}
            >
              Boshlash
            </Button>
          </div>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-slate-100 bg-white overflow-hidden"
          >
            <div className="container mx-auto px-6 py-8 flex flex-col gap-6">
              <a 
                href="#features" 
                onClick={() => setIsOpen(false)}
                className="text-lg font-bold text-slate-900 hover:text-[#1B4D3E] transition-colors"
              >
                Imkoniyatlar
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setIsOpen(false)}
                className="text-lg font-bold text-slate-900 hover:text-[#1B4D3E] transition-colors"
              >
                Qanday ishlaydi
              </a>
              <a 
                href="#pricing" 
                onClick={() => setIsOpen(false)}
                className="text-lg font-bold text-slate-900 hover:text-[#1B4D3E] transition-colors"
              >
                Narxlar
              </a>
              <div className="pt-4 flex flex-col gap-4">
                <Button 
                  variant="outline" 
                  className="w-full py-6 rounded-2xl font-bold border-slate-200"
                  onClick={() => {
                    setIsOpen(false);
                    onSignIn();
                  }}
                >
                  Kirish
                </Button>
                <Button 
                  className="w-full py-6 rounded-2xl font-bold bg-[#1B4D3E] hover:bg-[#153a2f]"
                  onClick={() => {
                    setIsOpen(false);
                    onGetStarted();
                  }}
                >
                  Boshlash
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
