import CTA from './CTA'
import FAQ from './FAQ'
import Features from './Features'
import Footer from './Footer'
import Hero from './Hero'
import HowItWorks from './HowItWorks'
import Navbar from './Navbar'
import ScrollProgress from './ScrollProgress'
import Testimonials from './Testimonials'

interface LandingPageProps {
	onGetStarted: () => void
	onInstall: () => void
}

export default function LandingPage({
	onGetStarted,
	onInstall,
}: LandingPageProps) {
	return (
		<div className='min-h-screen bg-paper text-ink selection:bg-ink selection:text-paper'>
			<ScrollProgress />
			<Navbar onSignIn={onGetStarted} onGetStarted={onGetStarted} />
			<main>
				<Hero onGetStarted={onGetStarted} onInstall={onInstall} />
				<Features />
				<HowItWorks />
				<Testimonials />
				<FAQ />
				<CTA onGetStarted={onGetStarted} />
			</main>
			<Footer />
		</div>
	)
}
