import { Brain } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-slate-100 py-12 bg-white">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B4D3E]">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-slate-900">
            MedTest <span className="text-[#1B4D3E]">AI</span>
          </span>
        </div>
        <p className="text-sm text-slate-400 font-medium">
          © {new Date().getFullYear()} MedTest AI. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
