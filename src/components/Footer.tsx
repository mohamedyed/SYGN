/* Inline brand SVGs — lucide-react v1+ removed brand icons */
const IconInstagram = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)
const IconTwitter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)
const IconYoutube = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
  </svg>
)

const NAV_GROUPS = [
  { title: 'SHOP', links: ['All Products', 'New Arrivals', 'Gamer Room', 'Car Culture', 'Custom Street', 'Gym Motivation'] },
  { title: 'COMPANY', links: ['About SYGN', 'Our Process', 'Materials', 'Gallery', 'Press'] },
  { title: 'SUPPORT', links: ['Shipping Info', 'Returns', 'FAQ', 'Contact Us', 'Track Order'] },
]

const SOCIAL = [
  { Icon: IconInstagram, href: '#', label: 'SYGN on Instagram' },
  { Icon: IconTwitter,   href: '#', label: 'SYGN on Twitter / X' },
  { Icon: IconYoutube,   href: '#', label: 'SYGN on YouTube' },
]

export default function Footer() {
  return (
    <footer id="footer" role="contentinfo"
      style={{ background: '#070707', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

      {/* Repeating sign motif banner */}
      <div aria-hidden style={{ overflow: 'hidden', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="animate-ticker flex gap-10 whitespace-nowrap w-max" style={{ animationDuration: '30s' }}>
          {Array.from({ length: 10 }).flatMap((_, i) => [
            <SignMotif key={`y${i}`} color="yellow" text="SYGN" />,
            <SignMotif key={`g${i}`} color="green" text="STUDIOS" />,
          ])}
        </div>
      </div>

      {/* Main footer grid */}
      <div className="section-container" style={{ paddingTop: 64, paddingBottom: 48 }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-geist text-white" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em' }}>SYGN</span>
              <div className="chip chip-lime" style={{ fontSize: 9 }}>STUDIOS</div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
              Premium street-inspired signs that express who you are. High-fidelity craftsmanship meets raw cultural energy.
            </p>
            <div className="flex gap-3">
              {SOCIAL.map(({ Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="flex items-center justify-center rounded-full transition-all duration-200 hover:border-white/25"
                  style={{ width: 38, height: 38, border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)' }}>
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Nav groups */}
          {NAV_GROUPS.map(group => (
            <nav key={group.title} aria-label={`${group.title} links`}>
              <div className="text-label mb-5" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{group.title}</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {group.links.map(link => (
                  <li key={link}>
                    <a href="#" className="no-underline transition-colors duration-150"
                      style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontFamily: 'var(--font-geist)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="rule my-10" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-label" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>
            © 2024 SYGN STUDIOS. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
              <a key={l} href="#" className="text-label no-underline transition-colors"
                style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

function SignMotif({ color, text }: { color: 'yellow' | 'green'; text: string }) {
  const borderColor = color === 'yellow' ? 'rgba(255,215,0,0.3)' : 'rgba(61,139,55,0.3)'
  const textColor   = color === 'yellow' ? 'rgba(255,215,0,0.5)' : 'rgba(61,139,55,0.5)'
  return (
    <div style={{
      border: `2px solid ${borderColor}`, borderRadius: 4,
      padding: '4px 14px', display: 'inline-flex', alignItems: 'center',
      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
      letterSpacing: '0.14em', color: textColor,
    }}>{text}</div>
  )
}
