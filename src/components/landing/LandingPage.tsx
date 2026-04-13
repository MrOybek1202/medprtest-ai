import Navbar from './Navbar';
import Hero from './Hero';
import Features from './Features';
import HowItWorks from './HowItWorks';
import CTA from './CTA';
import Footer from './Footer';

interface LandingPageProps {
  onGetStarted: () => void;
  onInstall: () => void;
}

export default function LandingPage({ onGetStarted, onInstall }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-[#1B4D3E]/10 selection:text-[#1B4D3E]">
      <Navbar onSignIn={onGetStarted} onGetStarted={onGetStarted} />
      <main>
        <Hero onGetStarted={onGetStarted} onInstall={onInstall} />
        <Features />
        <HowItWorks />
        <CTA onGetStarted={onGetStarted} />
      </main>
      <Footer />
    </div>
  );
}
