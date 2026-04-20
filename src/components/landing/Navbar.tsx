import { Button } from '@/components/ui/button'
import { HeartPulse, Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

interface NavbarProps {
  onSignIn: () => void
  onGetStarted: () => void
}

const links = [
  { href: '#imkoniyatlar', label: 'Imkoniyatlar' },
  { href: '#jarayon', label: 'Jarayon' },
  { href: '#boshlash', label: 'Boshlash' },
  { href: '#haqida', label: 'Haqida' },
]

export default function Navbar({ onSignIn }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex justify-center transition-all duration-500 ${
        scrolled ? 'pt-4' : 'pt-0'
      }`}
    >
      <div
        className={`w-full transition-all duration-500 ${
          scrolled
            ? 'max-w-[85%] px-4 rounded-[25px] bg-paper/60 backdrop-blur-xl border border-ink/10 '
            : 'max-w-[1280px] bg-transparent'
        }`}
      >
        <nav className='flex items-center justify-between px-4 py-3 md:px-6 md:py-3'>
          <a href='#' className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-full bg-gradient-editorial text-paper shadow-soft'>
              <HeartPulse className='size-5' />
            </div>
            <span
              className={`font-display text-xl font-bold tracking-tight text-ink transition-all duration-300 ${
                scrolled ? 'hidden sm:inline' : ''
              }`}
            >
              MedTestAI
            </span>
          </a>

          <div className='hidden items-center gap-8 lg:flex'>
            {links.map(link => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-bold ${scrolled ? 'text-ink' : 'text-muted-foreground'} transition-colors hover:text-ink`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className='hidden lg:block'>
            <Button
              onClick={onSignIn}
              className='rounded-full bg-ink p-5 text-paper hover:bg-ink/90'
            >
              Kirish
            </Button>
          </div>

          <button
            onClick={() => setIsOpen(v => !v)}
            className='flex size-11 items-center justify-center rounded-full border border-ink/10 bg-paper/90 text-ink backdrop-blur-xl transition-colors hover:bg-paper lg:hidden'
            aria-label='Menu'
          >
            {isOpen ? <X className='size-5' /> : <Menu className='size-5' />}
          </button>
        </nav>

        {/* Mobile menu — only shown when NOT scrolled pill mode, or override as needed */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`lg:hidden border-t border-ink/10 bg-paper ${
                scrolled ? 'rounded-b-3xl' : ''
              }`}
            >
              <div className='mx-4 flex flex-col gap-2 pb-6 pt-4'>
                {links.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className='rounded-2xl px-4 py-3 text-base text-muted-foreground transition-colors hover:bg-ink/5 hover:text-ink'
                  >
                    {link.label}
                  </a>
                ))}
                <Button
                  onClick={() => {
                    setIsOpen(false)
                    onSignIn()
                  }}
                  className='mt-2 rounded-2xl bg-ink py-6 text-paper hover:bg-ink/90'
                >
                  Kirish
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}