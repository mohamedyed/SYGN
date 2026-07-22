/** SpottedInTheWild — Testimonials section */

interface Testimonial {
  id: string
  handle: string
  location: string
  quote: string
  product: string
  rating: number
  accent: string
  initials: string
}

const TESTIMONIALS: Testimonial[] = [
  { id: 't1', handle: '@tyler.w', location: 'Los Angeles, CA', quote: 'The Blonde Nostalgia sign completely transformed my studio. The vinyl quality is insane — looks exactly like the real thing.', product: 'Blonde Nostalgia', rating: 5, accent: '#CCFF00', initials: 'TW' },
  { id: 't2', handle: '@jaxn.builds', location: 'New York, NY', quote: 'Ordered a custom street sign for my car garage and it arrived in 6 days. The reflective finish is absolutely perfect — gets everyone talking.', product: 'Custom Street Sign', rating: 5, accent: '#007AFF', initials: 'JB' },
  { id: 't3', handle: '@barbershop.kai', location: 'Chicago, IL', quote: 'Put the SYGN Core Logo piece above my barber chair. The chrome finish catches the light exactly right. My clients always ask about it.', product: 'SYGN Core Logo', rating: 5, accent: '#D4AF37', initials: 'BK' },
  { id: 't4', handle: '@setupgoals', location: 'Austin, TX', quote: "The Gamer Room series is 🔥. Got three pieces and my setup went from ordinary to editorial. Every streamer needs these.", product: 'Gamer Room Series', rating: 5, accent: '#AF52DE', initials: 'SG' },
  { id: 't5', handle: '@cmiyglvibes', location: 'Atlanta, GA', quote: 'CMIYGL Blue is a museum piece. The color accuracy is stunning and the matte finish makes it look painterly. Totally worth it.', product: 'CMIYGL Blue', rating: 5, accent: '#007AFF', initials: 'CV' },
  { id: 't6', handle: '@rosaline.art', location: 'Miami, FL', quote: 'Ordered a personalized sign with my café name and it exceeded every expectation. SYGN actually cares about the craft.', product: 'Personalized', rating: 5, accent: '#FF6B35', initials: 'RA' },
]

export default function SpottedInTheWild() {
  return (
    <section id="gallery" aria-labelledby="testimonials-heading"
      style={{ paddingTop: 120, paddingBottom: 120, background: '#0a0a0a' }}>
      <div className="section-container">
        <div className="text-center mb-14">
          <div className="chip mb-4 mx-auto" style={{ display: 'inline-flex' }}>SPOTTED IN THE WILD</div>
          <h2 id="testimonials-heading" className="text-headline text-white">What the Culture Says</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, marginTop: 12 }}>
            Real orders. Real spaces. Real culture.
          </p>
        </div>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map(t => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <p className="text-caption mb-5" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
            TAG US @SYGNSTUDIOS TO BE FEATURED
          </p>
          <a href="#build" className="btn-chrome" style={{ display: 'inline-flex' }}>
            Get Your Own Sign →
          </a>
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({ testimonial: t }: { testimonial: Testimonial }) {
  return (
    <article id={`testimonial-${t.id}`} className="testimonial-card" aria-label={`Review by ${t.handle}`}>
      {/* Stars */}
      <div className="flex gap-1 mb-4" aria-label={`${t.rating} out of 5 stars`}>
        {Array.from({ length: t.rating }).map((_, i) => (
          <span key={i} aria-hidden style={{ color: t.accent, fontSize: 12 }}>★</span>
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-white font-geist mb-5"
        style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.80)', fontStyle: 'normal' }}>
        "{t.quote}"
      </blockquote>

      {/* Product chip */}
      <div className="chip mb-5" style={{ borderColor: t.accent + '50', color: t.accent, background: t.accent + '0d', fontSize: 9 }}>
        {t.product}
      </div>

      {/* Author */}
      <div className="flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `linear-gradient(135deg, ${t.accent}44, ${t.accent}22)`,
          border: `1px solid ${t.accent}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: t.accent,
          flexShrink: 0,
        }}>
          {t.initials}
        </div>
        <div>
          <div className="font-geist" style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{t.handle}</div>
          <div className="text-caption" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{t.location}</div>
        </div>
      </div>
    </article>
  )
}
