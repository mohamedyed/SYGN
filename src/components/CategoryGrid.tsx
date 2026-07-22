/**
 * CategoryGrid — 6-cell bento grid of sign categories
 * Categories from Stitch design:
 *   Gamer Room | Car Culture | Custom Street Names
 *   Gym Motivation | Café/Barbershop | Personalized
 */

interface Category {
  id: string
  title: string
  subtitle: string
  tag: string
  accent: string
  bgGradient: string
  icon: string
  size: 'wide' | 'tall' | 'normal'
}

const CATEGORIES: Category[] = [
  {
    id: 'gamer-room',
    title: 'Gamer Room',
    subtitle: 'Level up your setup',
    tag: 'TRENDING',
    accent: '#007AFF',
    bgGradient: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 100%)',
    icon: '🕹',
    size: 'wide',
  },
  {
    id: 'car-culture',
    title: 'Car Culture',
    subtitle: 'For the gearheads',
    tag: 'HOT',
    accent: '#FF6B35',
    bgGradient: 'linear-gradient(135deg, #1a0a00 0%, #2d1000 100%)',
    icon: '🏎',
    size: 'tall',
  },
  {
    id: 'custom-street',
    title: 'Custom Street Names',
    subtitle: 'Your block, your name',
    tag: 'BESTSELLER',
    accent: '#CCFF00',
    bgGradient: 'linear-gradient(135deg, #0a1200 0%, #111e00 100%)',
    icon: '🛣',
    size: 'normal',
  },
  {
    id: 'gym-motivation',
    title: 'Gym Motivation',
    subtitle: 'Grind harder every day',
    tag: 'NEW',
    accent: '#FF3B30',
    bgGradient: 'linear-gradient(135deg, #1a0000 0%, #2d0000 100%)',
    icon: '🏋',
    size: 'normal',
  },
  {
    id: 'cafe-barbershop',
    title: 'Café & Barbershop',
    subtitle: 'Elevate your space',
    tag: 'POPULAR',
    accent: '#D4AF37',
    bgGradient: 'linear-gradient(135deg, #1a1200 0%, #2d2000 100%)',
    icon: '✂️',
    size: 'wide',
  },
  {
    id: 'personalized',
    title: 'Personalized',
    subtitle: 'Fully yours, fully custom',
    tag: 'LIMITED',
    accent: '#AF52DE',
    bgGradient: 'linear-gradient(135deg, #100a1a 0%, #1e0d30 100%)',
    icon: '✦',
    size: 'normal',
  },
]

export default function CategoryGrid() {
  return (
    <section
      id="collections"
      aria-labelledby="categories-heading"
      style={{ paddingTop: 100, paddingBottom: 100 }}
    >
      <div className="section-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="chip mb-4">COLLECTIONS</div>
            <h2
              id="categories-heading"
              className="text-headline text-white"
            >
              Find Your Aesthetic
            </h2>
          </div>
          <a
            href="#shop"
            className="btn-ghost self-start sm:self-auto"
            style={{ padding: '10px 20px', fontSize: 13 }}
          >
            View All →
          </a>
        </div>

        {/* Bento Grid */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridTemplateRows: 'auto',
          }}
        >
          {CATEGORIES.map((cat, i) => (
            <CategoryCard key={cat.id} category={cat} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoryCard({ category: cat, index: i }: { category: Category; index: number }) {
  // Grid placement: wide = 7 cols, tall = 5 cols (2 rows), normal = 5 cols
  const gridStyle = getGridStyle(i)

  return (
    <article
      id={`category-${cat.id}`}
      aria-label={cat.title}
      className="product-card group cursor-pointer"
      style={{
        ...gridStyle,
        background: cat.bgGradient,
        minHeight: cat.size === 'tall' ? 420 : 220,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle noise / grain overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
          pointerEvents: 'none',
          opacity: 0.6,
        }}
      />

      {/* Accent glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: -40,
          right: -40,
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${cat.accent}22 0%, transparent 70%)`,
          transition: 'opacity 0.3s ease',
        }}
        className="group-hover:opacity-150"
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col h-full"
        style={{ padding: 28, minHeight: 'inherit' }}
      >
        {/* Tag */}
        <div
          className="chip self-start mb-auto"
          style={{
            borderColor: cat.accent + '70',
            color: cat.accent,
            background: cat.accent + '10',
            fontSize: 9,
            marginBottom: 16,
          }}
        >
          {cat.tag}
        </div>

        {/* Icon */}
        <div style={{ fontSize: cat.size === 'tall' ? 56 : 40, lineHeight: 1, marginBottom: 12 }}>
          {cat.icon}
        </div>

        {/* Title */}
        <h3
          className="text-white font-geist"
          style={{
            fontSize: cat.size === 'wide' ? 22 : 18,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            marginBottom: 4,
          }}
        >
          {cat.title}
        </h3>

        {/* Subtitle */}
        <p
          className="text-caption"
          style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}
        >
          {cat.subtitle}
        </p>

        {/* Arrow on hover */}
        <div
          className="mt-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ color: cat.accent, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}
        >
          EXPLORE →
        </div>
      </div>
    </article>
  )
}

function getGridStyle(index: number): React.CSSProperties {
  /**
   * Layout on 12-col grid:
   * Row 1: [Gamer Room 7col] [Car Culture 5col/2rows]
   * Row 2: [Custom Street 4col] [Gym Motivation 3col] + Car Culture continues
   * Row 3: [Café/Barbershop 7col] [Personalized 5col]
   */
  const layouts: React.CSSProperties[] = [
    { gridColumn: 'span 7' },          // 0 Gamer Room wide
    { gridColumn: 'span 5', gridRow: 'span 2' }, // 1 Car Culture tall
    { gridColumn: 'span 4' },          // 2 Custom Street
    { gridColumn: 'span 3' },          // 3 Gym Motivation (fills the 3 remaining from row 2)
    { gridColumn: 'span 7' },          // 4 Café/Barbershop wide
    { gridColumn: 'span 5' },          // 5 Personalized
  ]
  return layouts[index] ?? {}
}
