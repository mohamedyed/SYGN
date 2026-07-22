import { useState, useEffect } from 'react'
import { Menu, X, ShoppingBag } from 'lucide-react'

const navLinks = ['Shop', 'Collections', 'Gallery', 'Custom']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        id="navbar"
        role="banner"
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(10,10,10,0.85)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
      >
        <div className="section-container">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <a href="/" aria-label="SYGN Home" className="flex items-center gap-2 no-underline">
              <div className="flex items-center gap-2">
                {/* SYGN wordmark */}
                <span
                  className="text-white font-geist"
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                  }}
                >
                  SYGN
                </span>
                <div
                  className="chip chip-lime hidden sm:inline-flex"
                  style={{ fontSize: 9 }}
                >
                  STUDIOS
                </div>
              </div>
            </a>

            {/* Desktop nav */}
            <nav
              aria-label="Primary navigation"
              className="hidden md:flex items-center gap-1"
            >
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-label text-white/60 hover:text-white px-4 py-2 rounded-full transition-colors duration-200 no-underline"
                  style={{ fontSize: 11, letterSpacing: '0.08em' }}
                >
                  {link}
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <a href="#build" className="btn-ghost" style={{ padding: '10px 20px', fontSize: 13 }}>
                Build Your Own
              </a>
              <button
                aria-label="Shopping bag"
                className="relative p-2.5 rounded-full border border-white/10 hover:border-white/25 transition-colors"
              >
                <ShoppingBag size={18} className="text-white/80" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#CCFF00] text-[#0a0a0a] text-[9px] font-bold rounded-full flex items-center justify-center font-mono">
                  0
                </span>
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              id="mobile-menu-toggle"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
              className="md:hidden p-2 text-white/80 hover:text-white"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-label="Mobile navigation"
          className="fixed inset-0 z-40 glass flex flex-col pt-24 px-6 pb-8"
          style={{ background: 'rgba(10,10,10,0.96)' }}
        >
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-white text-2xl font-bold py-3 border-b border-white/06 no-underline hover:text-[#CCFF00] transition-colors"
                style={{ letterSpacing: '-0.02em' }}
                onClick={() => setMobileOpen(false)}
              >
                {link}
              </a>
            ))}
          </nav>
          <div className="mt-8 flex flex-col gap-3">
            <a href="#build" className="btn-primary text-center" onClick={() => setMobileOpen(false)}>
              Build Your Own Sign
            </a>
          </div>
        </div>
      )}
    </>
  )
}
