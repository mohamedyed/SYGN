import type React from 'react'

/**
 * Hero Section — SYGN Landing Page
 *
 * Dark full-viewport hero with:
 * - Floating road-sign decorative elements (CSS keyframe animations)
 * - SYGN brand mark with vinyl/chrome text effect
 * - Headline: "Your Wall. Your Identity."
 * - Subheadline + dual CTA
 * - Ambient radial glow backgrounds
 */
export default function Hero() {
  return (
    <section
      id="hero"
      aria-label="SYGN Hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #1a1a1a 0%, #0a0a0a 70%)',
      }}
    >
      {/* ── Ambient gradient blobs ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        {/* Blue glow top-left */}
        <div
          className="absolute"
          style={{
            width: 600,
            height: 600,
            top: '-10%',
            left: '-8%',
            background: 'radial-gradient(circle, rgba(0,122,255,0.08) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* Lime glow top-right */}
        <div
          className="absolute"
          style={{
            width: 500,
            height: 500,
            top: '-5%',
            right: '-5%',
            background: 'radial-gradient(circle, rgba(204,255,0,0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* Center subtle */}
        <div
          className="absolute"
          style={{
            width: 900,
            height: 400,
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.025) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* ── Floating background signs ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden select-none"
      >
        {/* Sign 1 — top left */}
        <FloatingSign
          className="float-a"
          style={{ top: '12%', left: '5%', opacity: 0.18 }}
          color="yellow"
          text="STOP"
          size="lg"
        />
        {/* Sign 2 — top right */}
        <FloatingSign
          className="float-b"
          style={{ top: '8%', right: '7%', opacity: 0.14 }}
          color="green"
          text="NO LIMITS"
          size="md"
        />
        {/* Sign 3 — mid left */}
        <FloatingSign
          className="float-c"
          style={{ top: '42%', left: '-2%', opacity: 0.12 }}
          color="yellow"
          text="YIELD"
          size="sm"
        />
        {/* Sign 4 — mid right */}
        <FloatingSign
          className="float-d"
          style={{ top: '55%', right: '4%', opacity: 0.16 }}
          color="green"
          text="SYGN ST"
          size="md"
        />
        {/* Sign 5 — bottom left */}
        <FloatingSign
          className="float-e"
          style={{ bottom: '14%', left: '12%', opacity: 0.10 }}
          color="yellow"
          text="ONE WAY"
          size="sm"
        />
        {/* Sign 6 — bottom right */}
        <FloatingSign
          className="float-b"
          style={{ bottom: '10%', right: '12%', opacity: 0.12 }}
          color="green"
          text="ARTISTRY AVE"
          size="sm"
          style2={{ animationDelay: '2s' }}
        />
      </div>

      {/* ── Hero content ── */}
      <div
        className="relative z-10 section-container text-center flex flex-col items-center"
        style={{ paddingTop: 80, paddingBottom: 80 }}
      >
        {/* Brand mark chip */}
        <div className="chip chip-lime mb-6" style={{ fontSize: 10 }}>
          SYGN STUDIOS — EST. 2024
        </div>

        {/* Main headline */}
        <h1
          className="text-display text-white mb-6"
          style={{ maxWidth: 900 }}
        >
          Your Wall.{' '}
          <span className="text-vinyl">Your Identity.</span>
        </h1>

        {/* Sub-headline */}
        <p
          className="text-body mb-10"
          style={{
            maxWidth: 540,
            color: 'rgba(255,255,255,0.60)',
            fontSize: 18,
            lineHeight: 1.6,
          }}
        >
          Premium street-inspired signs designed to express who you are.
          High-fidelity craftsmanship meets raw cultural energy.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a href="#shop" id="hero-cta-shop" className="btn-primary">
            Shop Collection
          </a>
          <a href="#build" id="hero-cta-build" className="btn-ghost">
            Build Your Own Sign ↗
          </a>
        </div>

        {/* Social proof strip */}
        <div
          className="flex items-center gap-6 mt-14 pt-8 flex-wrap justify-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[
            { value: '2,400+', label: 'Signs Shipped' },
            { value: '98%', label: 'Satisfaction Rate' },
            { value: '120+', label: 'Custom Designs' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-white font-geist"
                style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}
              >
                {stat.value}
              </div>
              <div className="text-label" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #0a0a0a, transparent)' }}
      />
    </section>
  )
}

/* ── Internal: Floating Sign SVG Element ── */
type SignColor = 'yellow' | 'green'
type SignSize  = 'sm' | 'md' | 'lg'

interface FloatingSignProps {
  className?: string
  style?: React.CSSProperties
  style2?: React.CSSProperties
  color: SignColor
  text: string
  size: SignSize
}

function FloatingSign({ className, style, style2, color, text, size }: FloatingSignProps) {
  const dims: Record<SignSize, { w: number; h: number; fontSize: number }> = {
    sm: { w: 140, h: 48, fontSize: 10 },
    md: { w: 180, h: 56, fontSize: 12 },
    lg: { w: 220, h: 68, fontSize: 14 },
  }
  const d = dims[size]

  const borderColor = color === 'yellow' ? '#FFD700' : '#3d8b37'
  const bgColor     = color === 'yellow' ? 'rgba(30,25,0,0.9)' : 'rgba(0,25,5,0.9)'
  const textColor   = color === 'yellow' ? '#FFD700' : '#7FBF7B'

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        ...style,
        ...style2,
      }}
    >
      <div
        style={{
          width: d.w,
          height: d.h,
          background: bgColor,
          border: `3px solid ${borderColor}`,
          borderRadius: 6,
          boxShadow: `0 0 0 5px rgba(0,0,0,0.7), 0 0 0 8px ${borderColor}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 12px',
          position: 'relative',
        }}
      >
        {/* Inner dashed border */}
        <div
          style={{
            position: 'absolute',
            inset: 4,
            border: `1px dashed ${borderColor}44`,
            borderRadius: 3,
            pointerEvents: 'none',
          }}
        />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: d.fontSize,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: textColor,
            textTransform: 'uppercase',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  )
}
