interface Product {
  id: string; name: string; price: string; tag: string;
  tagColor: string; accentColor: string; bgColor: string;
  signText: string; signType: 'street' | 'highway' | 'custom'; new?: boolean;
}
const PRODUCTS: Product[] = [
  { id: 'blonde-nostalgia', name: 'Blonde Nostalgia', price: '$89', tag: 'LIMITED',
    tagColor: '#CCFF00', accentColor: '#CCFF00', bgColor: 'linear-gradient(145deg,#0d1209,#182208)',
    signText: 'BLONDE', signType: 'highway' },
  { id: 'sygn-core-logo', name: 'SYGN Core Logo', price: '$65', tag: 'BESTSELLER',
    tagColor: '#007AFF', accentColor: '#ffffff', bgColor: 'linear-gradient(145deg,#0a0a0a,#161616)',
    signText: 'SYGN', signType: 'custom' },
  { id: 'cmiygl-blue', name: 'CMIYGL Blue', price: '$95', tag: 'NEW DROP',
    tagColor: '#007AFF', accentColor: '#007AFF', bgColor: 'linear-gradient(145deg,#030d1f,#05173a)',
    signText: 'CMIYGL', signType: 'street', new: true },
]

export default function FeaturedProducts() {
  return (
    <section id="shop" aria-labelledby="trending-heading"
      style={{ paddingTop: 100, paddingBottom: 100, background: 'linear-gradient(180deg,#0a0a0a 0%,#0e0e0e 100%)' }}>
      <div className="section-container">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="chip mb-4">TRENDING NOW</div>
            <h2 id="trending-heading" className="text-headline text-white">Drop Picks</h2>
          </div>
          <a href="#shop" className="btn-ghost" style={{ padding: '10px 20px', fontSize: 13 }}>All Products →</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRODUCTS.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  )
}

function ProductCard({ product: p }: { product: Product }) {
  const borderColor = p.signType === 'highway' ? 'rgba(204,255,0,0.7)' : p.signType === 'street' ? 'rgba(255,255,255,0.6)' : 'rgba(200,200,200,0.5)'
  const signBg = p.signType === 'highway' ? '#1a2e00' : p.signType === 'street' ? '#001040' : '#111'
  const signColor = p.signType === 'highway' ? '#CCFF00' : p.signType === 'street' ? '#fff' : p.accentColor
  return (
    <article id={`product-${p.id}`} aria-label={p.name} className="product-card group">
      <div className="product-card-image" style={{ background: p.bgColor, aspectRatio: '1', padding: 32, position: 'relative' }}>
        {p.new && <div className="chip absolute top-4 left-4" style={{ background: p.accentColor, color: '#000', borderColor: 'transparent', fontSize: 9 }}>NEW</div>}
        <div className="sign-border" style={{ background: signBg, borderColor, width: '100%', maxWidth: 220, padding: '20px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, letterSpacing: '0.06em', color: signColor, textShadow: `0 0 16px ${signColor}60` }}>{p.signText}</div>
          {p.signType !== 'custom' && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>SYGN STUDIOS</div>}
        </div>
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 80%,${p.accentColor}15 0%,transparent 70%)`, pointerEvents: 'none' }} />
      </div>
      <div style={{ padding: '20px 24px 24px' }}>
        <div className="chip mb-3" style={{ borderColor: p.tagColor + '60', color: p.tagColor, background: p.tagColor + '10', fontSize: 9 }}>{p.tag}</div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-geist" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>{p.name}</h3>
            <p className="text-caption" style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11 }}>Premium vinyl · Weather sealed</p>
          </div>
          <div className="font-geist" style={{ fontSize: 20, fontWeight: 800, color: p.accentColor, letterSpacing: '-0.02em' }}>{p.price}</div>
        </div>
        <button id={`add-to-cart-${p.id}`} className="btn-ghost mt-4 w-full" style={{ padding: '12px 20px', fontSize: 13 }} aria-label={`Add ${p.name} to cart`}>Add to Cart</button>
      </div>
    </article>
  )
}
