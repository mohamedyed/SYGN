/**
 * Ticker — Marquee scroll strip between hero and grid
 */
const ITEMS = [
  'Gamer Room', '✦', 'Car Culture', '✦', 'Custom Street Names',
  '✦', 'Gym Motivation', '✦', 'Café & Barbershop', '✦', 'Personalized',
  '✦', 'Limited Drops', '✦', 'Vinyl-Grade Print', '✦',
]

export default function Ticker() {
  const doubled = [...ITEMS, ...ITEMS]

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden py-4 border-y"
      style={{
        borderColor: 'rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <div
        className="animate-ticker flex gap-8 whitespace-nowrap w-max"
        style={{ willChange: 'transform' }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="text-label"
            style={{
              color: item === '✦' ? 'rgba(204,255,0,0.6)' : 'rgba(255,255,255,0.40)',
              fontSize: 11,
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
