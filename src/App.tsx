import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Link, Navigate } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import coverImage from './assets/cover.png'
import {
  ArrowRight,
  Lock,
  Moon,
  ShoppingBag,
  Sun,
  Truck,
  User,
  Plus,
  Minus,
  LogOut,
  Package,
  BarChart3,
  Upload,
  Trash2,
  DollarSign,
  Users,
  Eye,
  X,
  PenSquare,
  LayoutDashboard,
  Shield,
  Tags,
  ClipboardList,
  CheckCircle,
} from 'lucide-react'
import './index.css'

import { supabase } from './lib/supabase'
import { useAuth } from './lib/useAuth'
import { useCart } from './lib/useCart'
import { useProducts } from './lib/useProducts'
import { useAdmin } from './lib/useAdmin'
import { useShippingFee } from './lib/useShippingFee'
import type { Product } from './lib/useProducts'
import type { ProductForm } from './lib/useAdmin'
import { GLOW_OPTIONS, SIZE_OPTIONS } from './lib/useAdmin'

type Theme = 'dark' | 'light'

type SignSize = 'sm' | 'md' | 'lg' | 'xl'

const FLOAT_CLASSES = ['sign-float-1', 'sign-float-2', 'sign-float-3'] as const

function computeOrganicLayout(signs: Array<{ size: SignSize; image_url?: string | null }>): Array<{ left: string; top: string; rotation: string; floatClass: string }> {
  const NUM_COLS = 3
  const COL_LEFT = [1, 34, 67]
  const COL_START = [0, 10, 4]
  const colBottoms = [...COL_START]

  const getHeight = (s: { size: SignSize; image_url?: string | null }) => {
    const base: Record<string, number> = { sm: 5, md: 6, lg: 9, xl: 12 }
    return s.image_url ? base[s.size] * 1.8 : base[s.size]
  }

  const imgSigns = signs.filter(s => s.image_url).sort((a, b) => {
    const o: Record<string, number> = { xl: 0, lg: 1, md: 2, sm: 3 }
    return o[a.size] - o[b.size]
  })
  const txtSigns = signs.filter(s => !s.image_url).sort((a, b) => {
    const o: Record<string, number> = { xl: 0, lg: 1, md: 2, sm: 3 }
    return o[a.size] - o[b.size]
  })

  const ordered: Array<{ size: SignSize; image_url?: string | null }> = []
  let i = 0, j = 0
  while (i < imgSigns.length || j < txtSigns.length) {
    if (i < imgSigns.length) ordered.push(imgSigns[i++])
    if (j < txtSigns.length) ordered.push(txtSigns[j++])
  }

  const GAP = 5
  const slots: Array<{ left: string; top: string; rotation: string; floatClass: string }> = []

  for (const sign of ordered) {
    let col = 0
    for (let c = 1; c < NUM_COLS; c++) {
      if (colBottoms[c] < colBottoms[col]) col = c
    }

    const seed = slots.length * 2.1 + col * 7
    const jitterX = Math.sin(seed) * 2
    const jitterY = Math.cos(seed * 0.7) * 2
    const rot = (Math.sin(seed * 1.3) * 2.5).toFixed(1)

    slots.push({
      left: `${COL_LEFT[col] + jitterX}%`,
      top: `${colBottoms[col] + 2 + jitterY}%`,
      rotation: `${rot}deg`,
      floatClass: FLOAT_CLASSES[slots.length % 3],
    })
    colBottoms[col] += getHeight(sign) + GAP
  }

  return slots
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface TrendingSign extends Product {
  left: string
  top: string
  rotation: string
  floatClass: string
  price_display: string
}

const DISPLAY_COUNT = 8
const SHUFFLE_INTERVAL = 10000

function useTrendingSigns(products: Product[]): { signs: TrendingSign[]; isShuffling: boolean; shuffleCount: number } {
  const [signOrder, setSignOrder] = useState<string[]>(() => {
    const ids = products.map(s => s.id)
    return shuffleArray(ids).slice(0, DISPLAY_COUNT)
  })
  const [isShuffling, setIsShuffling] = useState(false)
  const [shuffleCount, setShuffleCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (products.length === 0) return
    setSignOrder(prev => {
      const allIds = products.map(s => s.id)
      if (prev.every(id => allIds.includes(id))) return prev
      return shuffleArray(allIds).slice(0, DISPLAY_COUNT)
    })
  }, [products])

  useEffect(() => {
    if (products.length === 0) return
    timerRef.current = setInterval(() => {
      setIsShuffling(true)
      setShuffleCount(c => c + 1)

      setTimeout(() => {
        setSignOrder(prev => {
          const allIds = products.map(s => s.id)
          const remaining = allIds.filter(id => !prev.includes(id))
          if (remaining.length === 0) return shuffleArray(prev)
          const toRemove = shuffleArray(prev).slice(0, Math.min(2, remaining.length))
          const toAdd = shuffleArray(remaining).slice(0, Math.min(2, remaining.length))
          const kept = prev.filter(id => !toRemove.includes(id))
          return shuffleArray([...kept, ...toAdd])
        })
        setTimeout(() => setIsShuffling(false), 600)
      }, 300)
    }, SHUFFLE_INTERVAL)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [products])

  const signs = useMemo(() => {
    const signData = signOrder.map(id => products.find(s => s.id === id)).filter(Boolean) as Product[]
    const layoutInput = signData.map(s => ({ size: s.size as SignSize, image_url: s.image_url }))
    const layout = computeOrganicLayout(layoutInput)
    return signData.map((base, i) => ({
      ...base,
      ...layout[i],
      price_display: `${base.price.toLocaleString()} DT`,
    }))
  }, [signOrder, products])

  return { signs, isShuffling, shuffleCount }
}

function useDraggable() {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const didMove = useRef(false)
  const dragData = useRef({ startX: 0, startY: 0 })

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragData.current = { startX: e.clientX, startY: e.clientY }
    didMove.current = false
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - dragData.current.startX
      const dy = e.clientY - dragData.current.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didMove.current = true
      setOffset({ x: dx, y: dy })
    }

    const onUp = () => {
      setIsDragging(false)
      setOffset({ x: 0, y: 0 })
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [isDragging])

  return { offset, isDragging, didMove, onPointerDown }
}

function App() {
  const [theme, setTheme] = useState<Theme>('dark')
  const auth = useAuth()
  const cart = useCart()
  const { products, labels, productLabels, loading, refetch, refetchLabels } = useProducts()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <BrowserRouter>
      <div className="app-shell">
        <SiteHeaderWrapper
          theme={theme}
          onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          cartCount={cart.count}
          user={auth.user}
          isAdmin={auth.isAdmin}
          onSignOut={auth.signOut}
        />

        <main>
          <Routes>
            <Route path="/" element={
              <HomeView
                products={products}
                loading={loading}
              />
            } />
            <Route path="/collection" element={
              <CollectionView
                products={products}
                labels={labels}
                productLabels={productLabels}
                loading={loading}
              />
            } />
            <Route path="/product/:id" element={
              <ProductView
                products={products}
                onAddToCart={cart.addItem}
              />
            } />
            <Route path="/checkout" element={
              <CheckoutView
                cart={cart}
                user={auth.user}
              />
            } />
            <Route path="/auth" element={
              <AuthView
                signIn={auth.signIn}
                signUp={auth.signUp}
              />
            } />
            <Route path="/admin/*" element={
              auth.loading ? (
                <div className="signs-loading" style={{ minHeight: '60vh' }}>
                  <div className="loading-spinner" />
                </div>
              ) : auth.isAdmin ? (
                <AdminView products={products} labels={labels} productLabels={productLabels} refetchProducts={refetch} refetchLabels={refetchLabels} />
              ) : (
                <Navigate to="/auth" replace />
              )
            } />
          </Routes>
        </main>

        <SiteFooter />
      </div>
      <SpeedInsights />
      <Analytics />
    </BrowserRouter>
  )
}

function SiteHeaderWrapper({
  theme, onToggleTheme, cartCount, user, isAdmin, onSignOut,
}: {
  theme: Theme
  onToggleTheme: () => void
  cartCount: number
  user: { email?: string } | null
  isAdmin: boolean
  onSignOut: () => void
}) {
  return (
    <SiteHeader
      theme={theme}
      onToggleTheme={onToggleTheme}
      cartCount={cartCount}
      user={user}
      isAdmin={isAdmin}
      onSignOut={onSignOut}
    />
  )
}

function SiteHeader({
  theme, onToggleTheme, cartCount, user, isAdmin, onSignOut,
}: {
  theme: Theme
  onToggleTheme: () => void
  cartCount: number
  user: { email?: string } | null
  isAdmin: boolean
  onSignOut: () => void
}) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => location.pathname === path ? 'is-active' : ''

  useEffect(() => {
    setShowUserMenu(false)
    setShowMobileNav(false)
  }, [location.pathname])

  useEffect(() => {
    if (!showUserMenu) return
    const handleClick = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [showUserMenu])

  return (
    <header className="site-header">
      <div className="header-left">
        <Link to="/" className="brand-mark">
          SY<span className="brand-arabic">ڨ</span>N<span className="brand-mark-accent">.</span>
        </Link>
        <nav className="primary-nav" aria-label="Primary">
          <Link to="/" className={`nav-link ${isActive('/')}`}>Shop</Link>
          <Link to="/collection" className={`nav-link ${isActive('/collection')}`}>Collections</Link>
          {isAdmin && (
            <Link to="/admin" className={`nav-link ${location.pathname.startsWith('/admin') ? 'is-active' : ''}`}>
              <Shield size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Admin
            </Link>
          )}
        </nav>
      </div>
      <div className="header-actions">
        <button
          className="mobile-nav-toggle"
          type="button"
          aria-label="Menu"
          onClick={() => setShowMobileNav(!showMobileNav)}
        >
          <div className={`hamburger ${showMobileNav ? 'is-open' : ''}`}>
            <span /><span /><span />
          </div>
        </button>
        <Link to="/checkout" className="icon-button cart-button" aria-label="Cart">
          <ShoppingBag size={18} strokeWidth={2} />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>
        <div className="user-menu-wrapper" ref={menuRef}>
          <button
            className="icon-button"
            type="button"
            aria-label="Account"
            onClick={() => user ? setShowUserMenu(!showUserMenu) : navigate('/auth')}
          >
            <User size={18} strokeWidth={2} />
          </button>
          {showUserMenu && user && (
            <div className="user-dropdown">
              <div className="user-email">{user.email}</div>
              {isAdmin && (
                <button type="button" className="user-dropdown-item" onClick={() => { navigate('/admin'); setShowUserMenu(false) }}>
                  <Shield size={14} /> Admin Dashboard
                </button>
              )}
              <button type="button" className="user-dropdown-item" onClick={() => { navigate('/checkout'); setShowUserMenu(false) }}>
                <Package size={14} /> My Orders
              </button>
              <button type="button" className="user-dropdown-item" onClick={() => { onSignOut(); setShowUserMenu(false) }}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
        <button className="theme-toggle" type="button" aria-label="Toggle theme" onClick={onToggleTheme}>
          {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
        </button>
      </div>
      <div className={`mobile-nav ${showMobileNav ? 'is-open' : ''}`}>
        <Link to="/" className={`nav-link ${isActive('/')}`}>Shop</Link>
        <Link to="/collection" className={`nav-link ${isActive('/collection')}`}>Collections</Link>
        {isAdmin && (
          <Link to="/admin" className={`nav-link ${location.pathname.startsWith('/admin') ? 'is-active' : ''}`}>
            <Shield size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Admin
          </Link>
        )}
      </div>
    </header>
  )
}

function HomeView({
  products,
  loading,
}: {
  products: Product[]
  loading: boolean
}) {
  const { signs, isShuffling } = useTrendingSigns(products)

  return (
    <section className="page-home">
      <div className="ambient-glow" style={{ width: 500, height: 500, top: '10%', left: '-5%', background: 'radial-gradient(circle, rgba(255,45,123,0.06), transparent 70%)' }} />
      <div className="ambient-glow" style={{ width: 600, height: 600, top: '30%', right: '-10%', background: 'radial-gradient(circle, rgba(59,130,246,0.05), transparent 70%)' }} />
      <div className="ambient-glow" style={{ width: 400, height: 400, bottom: '10%', left: '20%', background: 'radial-gradient(circle, rgba(168,85,247,0.04), transparent 70%)' }} />

      <img src={coverImage} alt="" className="shop-intro-cover" aria-hidden="true" />

      <div className="streetscape">
        <div className="shop-intro">
          <h1>The Digital Street</h1>
          <p>Street-grade signage for modern spaces. Walk through and find your sign.</p>
        </div>

        <div className="order-now-row">
          <Link to="/collection" className="button-primary">Order Now <ArrowRight size={16} /></Link>
        </div>

        {loading ? (
          <div className="signs-loading">
            <div className="loading-spinner" />
            <p>Loading signs...</p>
          </div>
        ) : (
          <div className={`signs-field ${isShuffling ? 'is-shuffling' : ''}`}>
            <div className="sign-blob-bottom" />
            {signs.map((sign) => (
              <DraggableSign key={sign.id} sign={sign} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function DraggableSign({ sign }: { sign: TrendingSign }) {
  const { offset, isDragging, didMove, onPointerDown } = useDraggable()
  const navigate = useNavigate()

  return (
    <div
      className={`sign-mount ${sign.floatClass} ${isDragging ? 'is-dragging' : ''}`}
      style={{
        top: sign.top,
        left: sign.left,
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${sign.rotation})`,
        zIndex: isDragging ? 50 : 1,
      }}
    >
      <div className="sign-mount-plate" />
      <div className="sign-mount-bracket" />
      <button
        type="button"
        className={`floating-sign sign-glow-${sign.glow} sign-size-${sign.size}`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none' } as React.CSSProperties}
        onPointerDown={onPointerDown}
        onClick={() => { if (!didMove.current) navigate(`/product/${sign.id}`) }}
      >
        {sign.image_url && (
          <img src={sign.image_url} alt={sign.title} className="sign-image" />
        )}
        <div className="sign-text">{sign.title}</div>
        <div className="sign-subtext">{sign.subtitle}</div>
        <div className="sign-price">
          <span>{sign.price_display}</span>
          <span className="sign-buy">View</span>
        </div>
      </button>
    </div>
  )
}

function CollectionView({
  products,
  labels,
  productLabels,
  loading,
}: {
  products: Product[]
  labels: Array<{ id: string; name: string; slug: string }>
  productLabels: Record<string, string[]>
  loading: boolean
}) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null)

  const filteredProducts = useMemo(() => {
    if (!activeLabel) return products
    return products.filter(p => productLabels[p.id]?.includes(activeLabel))
  }, [products, activeLabel, productLabels])

  return (
    <section className="page-collection">
      <div className="collection-topbar">
        <div>
          <h1>COLLECTION</h1>
          <p>Full range of premium illuminated signage. Minimalist design meets technical precision.</p>
        </div>
        <div className="collection-metrics">
          <span>FW24</span>
          <span>{products.length} ITEMS</span>
        </div>
      </div>

      <div className="collection-layout">
        <aside className="filter-panel">
          <FilterSection
            title="Label"
            items={[{ label: 'All Signs', value: null }, ...labels.map(c => ({ label: c.name, value: c.id }))]}
            active={activeLabel}
            onSelect={setActiveLabel}
          />
        </aside>

        {loading ? (
          <div className="signs-loading">
            <div className="loading-spinner" />
            <p>Loading collection...</p>
          </div>
        ) : (
          <div className="collection-grid">
            {filteredProducts.map((product, index) => (
              <CollectionCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ProductView({
  products,
  onAddToCart,
}: {
  products: Product[]
  onAddToCart: (item: { productId: string; title: string; subtitle: string; price: number; glow: string; size: string; image_url: string | null }) => void
}) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const product = products.find(p => p.id === id) ?? products[0]

  if (!product) {
    return (
      <section className="page-product">
        <div className="signs-loading"><p>Product not found.</p></div>
      </section>
    )
  }

  const isOutOfStock = product.stock <= 0

  const handleAddToCart = () => {
    if (isOutOfStock) return
    for (let i = 0; i < qty; i++) {
      onAddToCart({
        productId: product.id,
        title: product.title,
        subtitle: product.subtitle ?? '',
        price: product.price,
        glow: product.glow,
        size: product.size,
        image_url: product.image_url,
      })
    }
    navigate('/checkout')
  }

  return (
    <section className="page-product">
      <div className="product-layout">
        <div className="product-hero">
          <div className="hero-artwork" aria-hidden="true">
            {(product.images.length > 0 ? product.images : product.image_url ? [product.image_url] : []).length > 0 ? (
              <img
                src={(product.images.length > 0 ? product.images : product.image_url ? [product.image_url] : [])[activeImage]}
                alt={product.title}
                className="hero-image"
              />
            ) : (
              <div className={`hero-placeholder sign-glow-${product.glow}`}>
                <span className="sign-text">{product.title}</span>
              </div>
            )}
            <div className="art-glow" />
          </div>
          {(product.images.length > 0 || product.image_url) && (
            <div className="hero-gallery">
              {(product.images.length > 0 ? product.images : product.image_url ? [product.image_url] : []).map((url, i) => (
                <button
                  key={url}
                  type="button"
                  className={`gallery-thumb ${i === activeImage ? 'is-active' : ''}`}
                  onClick={() => setActiveImage(i)}
                >
                  <img src={url} alt="" />
                </button>
              ))}
            </div>
          )}
          <div className="hero-badges">
            <span>{product.size.toUpperCase()}</span>
            {product.stock <= 10 && <span>LIMITED</span>}
          </div>
        </div>

        <article className="product-detail">
          <div className="product-title-block">
            <h1>{product.title}</h1>
            <p>{product.subtitle}</p>
          </div>
          <div className="product-price">{product.price.toLocaleString()} DT</div>
          <p className="product-description">
            {product.description || 'Hand-crafted high-grade aluminum. Precision-engineered light distribution. 50,000 hour lifespan. A statement piece designed for modern interiors.'}
          </p>
          <div className="qty-row">
            <button type="button" className="qty-btn" disabled={isOutOfStock} onClick={() => setQty(q => Math.max(1, q - 1))}>
              <Minus size={14} />
            </button>
            <span className="qty-value">{isOutOfStock ? 0 : qty}</span>
            <button type="button" className="qty-btn" disabled={isOutOfStock || qty >= 3} onClick={() => setQty(q => q + 1)}>
              <Plus size={14} />
            </button>
            {qty >= 3 && <span className="max-qty-hint inline">Max 3 · Contactez-nous pour +</span>}
          </div>
          <div className="product-actions">
            <button className="button-primary" type="button" onClick={handleAddToCart} disabled={isOutOfStock}>
              {isOutOfStock ? 'Out of Stock' : 'Add to Bag'} {isOutOfStock ? null : <ArrowRight size={16} />}
            </button>
          </div>
          <div className="product-meta">
            <div>
              <span>Availability</span>
              <strong className={isOutOfStock ? 'stock-out' : ''}>{isOutOfStock ? 'Out of Stock' : 'In Stock'}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

function CheckoutView({
  cart,
  user,
}: {
  cart: ReturnType<typeof useCart>
  user: { id: string; email?: string } | null
}) {
  const navigate = useNavigate()
  const { fee, fetchFee } = useShippingFee()
  const [submitting, setSubmitting] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [stockError, setStockError] = useState('')
  const [shipping, setShipping] = useState({
    name: '', email: user?.email ?? '', phone: '', address: '', landmark: '', city: '', state: '', zip: '',
  })

  useEffect(() => { fetchFee() }, [fetchFee])

  const isFormValid = shipping.name.trim().length > 1
    && shipping.email.includes('@')
    && shipping.phone.trim().length >= 8
    && shipping.address.trim().length > 3
    && shipping.city.trim().length > 1
    && shipping.state.trim().length > 1
    && shipping.zip.trim().length > 2

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) return
    setSubmitting(true)
    setStockError('')

    try {
      const productIds = cart.items.map(i => i.productId)
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, title, price, stock')
        .in('id', productIds)

      if (fetchError) throw fetchError
      if (!products || products.length !== productIds.length) {
        throw new Error('Some products no longer exist')
      }

      const productMap = new Map(products.map(p => [p.id, p]))

      // Fresh stock check against current DB state
      for (const item of cart.items) {
        const product = productMap.get(item.productId)
        if (!product || product.stock < item.quantity) {
          setStockError(`Stock insuffisant : ${item.title}. Modifiez votre panier et réessayez.`)
          setSubmitting(false)
          return
        }
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id ?? null,
          total: cart.total + fee,
          shipping_fee: fee,
          shipping_name: shipping.name.trim(),
          shipping_email: shipping.email.trim(),
          shipping_phone: shipping.phone.trim(),
          shipping_address: shipping.landmark
            ? `${shipping.address.trim()} — ${shipping.landmark.trim()}`
            : shipping.address.trim(),
          shipping_city: shipping.city.trim(),
          shipping_state: shipping.state.trim(),
          shipping_zip: shipping.zip.trim(),
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Use DB prices — ignore whatever the client may have tampered with in localStorage
      const items = cart.items.map(item => {
        const product = productMap.get(item.productId)!
        return {
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: product.price,
        }
      })

      const { error: itemsError } = await supabase.from('order_items').insert(items)
      if (itemsError) {
        await supabase.from('orders').delete().eq('id', order.id)
        throw itemsError
      }

      // Re-check stock just before decrementing to catch race conditions
      const freshIds = cart.items.map(i => i.productId)
      const { data: freshProducts, error: freshError } = await supabase
        .from('products')
        .select('id, stock')
        .in('id', freshIds)

      if (freshError) throw freshError

      const freshMap = new Map((freshProducts ?? []).map(p => [p.id, p.stock]))

      for (const item of cart.items) {
        const currentStock = freshMap.get(item.productId)
        if (currentStock === undefined || currentStock < item.quantity) {
          await supabase.from('order_items').delete().eq('order_id', order.id)
          await supabase.from('orders').delete().eq('id', order.id)
          setStockError(`${item.title} n'est plus disponible en quantité suffisante. Modifiez votre panier.`)
          setSubmitting(false)
          return
        }
      }

      for (const item of cart.items) {
        const currentStock = freshMap.get(item.productId)!
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: currentStock - item.quantity })
          .eq('id', item.productId)
          .gte('stock', item.quantity)

        if (stockError) {
          await supabase.from('order_items').delete().eq('order_id', order.id)
          await supabase.from('orders').delete().eq('id', order.id)
          setStockError(`Stock insuffisant pour ${item.title}. Veuillez réessayer.`)
          return
        }
      }

      cart.clearCart()
      setOrderPlaced(true)
    } catch (err) {
      console.error('Order failed:', err)
      setStockError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (orderPlaced) {
    return (
      <section className="page-checkout">
        <div className="order-success">
          <div className="order-success-icon">
            <Package size={48} />
          </div>
          <h1>Commande confirmée</h1>
          <p>Merci pour votre achat. Vous recevrez un email de confirmation sous peu.</p>
          <button className="button-primary" type="button" onClick={() => navigate('/')}>
            Continuer mes achats <ArrowRight size={16} />
          </button>
        </div>
      </section>
    )
  }

  if (cart.items.length === 0) {
    return (
      <section className="page-checkout">
        <div className="order-success">
          <ShoppingBag size={48} strokeWidth={1.5} />
          <h1>Votre panier est vide</h1>
          <p>Parcourez notre collection et trouvez votre enseigne idéale.</p>
          <button className="button-primary" type="button" onClick={() => navigate('/')}>
            Voir la boutique <ArrowRight size={16} />
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="page-checkout">
      <div className="checkout-header">
        <div>
          <h1>Checkout</h1>
          <p>Finalisez votre commande en toute sécurité.</p>
        </div>
      </div>

      <div className="checkout-layout">
        <div className="checkout-form-grid">
          <CheckoutBlock title="Contact" step="Étape 1 / 3">
            <input
              className="field-input"
              type="tel"
              placeholder="Téléphone *"
              value={shipping.phone}
              onChange={e => setShipping(s => ({ ...s, phone: e.target.value }))}
              required
            />
            <input
              className="field-input"
              placeholder="Email"
              value={shipping.email}
              onChange={e => setShipping(s => ({ ...s, email: e.target.value }))}
            />
            {!user && (
              <p className="payment-note">Vous avez déjà un compte ? <Link to="/auth" className="text-link">Connectez-vous</Link></p>
            )}
          </CheckoutBlock>

          <CheckoutBlock title="Livraison" step="Étape 2 / 3">
            <input
              className="field-input"
              placeholder="Nom complet *"
              value={shipping.name}
              onChange={e => setShipping(s => ({ ...s, name: e.target.value }))}
            />
            <input
              className="field-input"
              placeholder="Adresse *"
              value={shipping.address}
              onChange={e => setShipping(s => ({ ...s, address: e.target.value }))}
            />
            <input
              className="field-input"
              placeholder="Point de repère (facultatif)"
              value={shipping.landmark}
              onChange={e => setShipping(s => ({ ...s, landmark: e.target.value }))}
            />
            <div className="field-row three-up">
              <input
                className="field-input"
                placeholder="Ville *"
                value={shipping.city}
                onChange={e => setShipping(s => ({ ...s, city: e.target.value }))}
              />
              <input
                className="field-input"
                placeholder="Gouvernorat *"
                value={shipping.state}
                onChange={e => setShipping(s => ({ ...s, state: e.target.value }))}
              />
              <input
                className="field-input"
                placeholder="Code postal *"
                value={shipping.zip}
                onChange={e => setShipping(s => ({ ...s, zip: e.target.value }))}
              />
            </div>
          </CheckoutBlock>

          <CheckoutBlock title="Paiement" step="Étape 3 / 3">
            <p className="payment-note">Paiement à la livraison — espèces acceptées.</p>
            <div className="payment-method">
              <label>
                <input type="radio" name="payment" defaultChecked />
                <span>Paiement à la livraison</span>
              </label>
              <Lock size={18} />
            </div>
            <p className="payment-note delivery-note">Livraison sous 2–5 jours ouvrés dans toute la Tunisie.</p>
          </CheckoutBlock>
        </div>

        <aside className="summary-panel">
          <h2>Récapitulatif</h2>
          {cart.items.map(item => (
            <div key={item.productId} className="summary-item">
              <div className="summary-thumb">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="summary-thumb-img" />
                ) : (
                  <span>{item.quantity}</span>
                )}
              </div>
              <div className="summary-copy">
                <h3>{item.title}</h3>
                <div className="summary-qty-row">
                  <button
                    type="button"
                    className="qty-btn qty-btn-xs"
                    onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)}
                  >
                    <Minus size={10} />
                  </button>
                  <span className="qty-value-sm">{item.quantity}</span>
                  <button
                    type="button"
                    className="qty-btn qty-btn-xs"
                    disabled={item.quantity >= 3}
                    onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
                    title={item.quantity >= 3 ? 'Contactez-nous pour les grandes quantités' : undefined}
                  >
                    <Plus size={10} />
                  </button>
                  {item.quantity >= 3 && <span className="max-qty-hint">Max 3</span>}
                </div>
              </div>
              <div className="summary-right">
                <strong>{(item.price * item.quantity).toLocaleString()} DT</strong>
                <button
                  type="button"
                  className="summary-remove"
                  onClick={() => cart.removeItem(item.productId)}
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          <div className="summary-lines">
            <div><span>Sous-total</span><strong>{cart.total.toLocaleString()} DT</strong></div>
            <div><span>Livraison</span><strong>{fee > 0 ? `${fee.toLocaleString()} DT` : 'Gratuite'}</strong></div>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{(cart.total + fee).toLocaleString()} DT</strong>
          </div>
          {stockError && <p className="auth-error" style={{ marginBottom: 12 }}>{stockError}</p>}
          <button
            className="button-primary wide"
            type="button"
            onClick={handlePlaceOrder}
            disabled={submitting || !isFormValid}
          >
            {submitting ? 'Commande en cours...' : 'Confirmer la commande'} <ArrowRight size={16} />
          </button>
        </aside>
      </div>
    </section>
  )
}

function AuthView({
  signIn,
  signUp,
}: {
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: { message: string } | null }>
}) {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = isSignUp
      ? await signUp(email, password, fullName)
      : await signIn(email, password)

    setLoading(false)

    if (result.error) {
      // Supabase AuthError has .message but non-enumerable props so JSON.stringify gives {}
      const msg = (result.error as unknown as { message?: string }).message
        || String(result.error)
        || 'An error occurred. Please try again.'
      setError(msg)
    } else {
      navigate('/')
    }
  }

  return (
    <section className="page-auth">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{isSignUp ? 'Create Account' : 'Sign In'}</h1>
          <p>{isSignUp ? 'Join SYڨN to track orders and more.' : 'Welcome back.'}</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <input
              className="field-input"
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          )}
          <input
            className="field-input"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="field-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="auth-error">{error}</p>}
          <button className="button-primary wide" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <p className="auth-toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="text-link" onClick={() => { setIsSignUp(!isSignUp); setError('') }}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
        <button type="button" className="text-link auth-back" onClick={() => navigate('/')}>
          <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to Shop
        </button>
      </div>
    </section>
  )
}

/* ──────────────────────────── ADMIN VIEW ──────────────────────────── */

function AdminView({
  products,
  labels,
  productLabels,
  refetchProducts,
  refetchLabels,
}: {
  products: Product[]
  labels: Array<{ id: string; name: string; slug: string }>
  productLabels: Record<string, string[]>
  refetchProducts: () => Promise<void>
  refetchLabels: () => Promise<void>
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const admin = useAdmin()
  const shippingFee = useShippingFee()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'add' | 'labels' | 'shipping' | 'orders'>('dashboard')
  const [editingProductId, setEditingProductId] = useState<string | null>(null)

  const tabFromUrl = useCallback(() => {
    if (location.pathname === '/admin/products') return 'products' as const
    if (location.pathname === '/admin/add') return 'add' as const
    if (location.pathname === '/admin/labels') return 'labels' as const
    if (location.pathname === '/admin/shipping') return 'shipping' as const
    if (location.pathname === '/admin/orders') return 'orders' as const
    return 'dashboard' as const
  }, [location.pathname])

  useEffect(() => {
    setActiveTab(tabFromUrl())
  }, [tabFromUrl])

  useEffect(() => {
    admin.fetchStats()
    shippingFee.fetchFee()
  }, [admin.fetchStats, shippingFee.fetchFee])

  const handleTabChange = (tab: 'dashboard' | 'products' | 'add' | 'labels' | 'shipping' | 'orders') => {
    setActiveTab(tab)
    if (tab === 'dashboard') navigate('/admin')
    else if (tab === 'products') navigate('/admin/products')
    else if (tab === 'labels') navigate('/admin/labels')
    else if (tab === 'shipping') navigate('/admin/shipping')
    else if (tab === 'orders') navigate('/admin/orders')
    else navigate('/admin/add')
  }

  return (
    <section className="page-admin">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage your store, products, and orders.</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${activeTab === 'dashboard' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
        >
          <LayoutDashboard size={14} /> Dashboard
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'products' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('products')}
        >
          <Package size={14} /> Products
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'add' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('add')}
        >
          <Plus size={14} /> Add Product
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'labels' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('labels')}
        >
          <Tags size={14} /> Labels
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'shipping' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('shipping')}
        >
          <Truck size={14} /> Shipping
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'orders' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('orders')}
        >
          <ClipboardList size={14} /> Orders
        </button>
      </div>

      {admin.error && <div className="admin-error">{admin.error}</div>}

      {activeTab === 'dashboard' && admin.stats && (
        <AdminDashboard stats={admin.stats} />
      )}
      {activeTab === 'dashboard' && !admin.stats && (
        <div className="signs-loading">
          <div className="loading-spinner" />
          <p>Loading dashboard...</p>
        </div>
      )}

      {activeTab === 'products' && !editingProductId && (
        <AdminProducts
          products={products}
          onDelete={admin.deleteProduct}
          onRefresh={async () => { await admin.fetchStats(); await refetchProducts() }}
          onAddStock={admin.addStock}
          onEdit={id => setEditingProductId(id)}
        />
      )}

      {activeTab === 'products' && editingProductId && (
        <AdminEditProduct
          product={products.find(p => p.id === editingProductId) ?? null}
          labels={labels}
          productLabelIds={productLabels[editingProductId] ?? []}
          onUpdate={async (form, newFiles, removeIds) => {
            const ok = await admin.updateProduct(editingProductId, form)
            if (ok && (newFiles.length > 0 || removeIds.length > 0)) {
              await admin.updateProductImages(editingProductId, newFiles, removeIds)
            }
            if (ok) { setEditingProductId(null); refetchProducts() }
            return ok
          }}
          onCancel={() => setEditingProductId(null)}
        />
      )}

      {activeTab === 'add' && (
        <AdminAddProduct
          labels={labels}
          onCreate={admin.createProduct}
          onSuccess={() => { refetchProducts(); navigate('/admin/products') }}
        />
      )}

      {activeTab === 'labels' && (
        <AdminLabels
          labels={labels}
          onCreate={admin.createLabel}
          onUpdate={admin.updateLabel}
          onDelete={admin.deleteLabel}
          onRefresh={async () => { await refetchLabels() }}
        />
      )}

      {activeTab === 'shipping' && (
        <AdminShippingFee
          fee={shippingFee.fee}
          loading={shippingFee.loading}
          onUpdate={shippingFee.updateFee}
          onRefresh={shippingFee.fetchFee}
        />
      )}

      {activeTab === 'orders' && (
        <AdminOrders
          admin={admin}
          onMarkShipped={async (id) => {
            const ok = await admin.markAsShipped(id)
            if (ok) admin.fetchStats()
            return ok
          }}
        />
      )}
    </section>
  )
}

function AdminDashboard({ stats }: { stats: import('./lib/useAdmin').AdminStats }) {
  const shippedRev = stats.totalRevenue

  return (
    <>
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><DollarSign size={20} /></div>
          <div className="stat-content">
            <span className="stat-label">Shipped Revenue</span>
            <strong className="stat-value">{shippedRev.toLocaleString()} DT</strong>
            <span className="stat-sublabel">{stats.shippedOrders} orders shipped</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><BarChart3 size={20} /></div>
          <div className="stat-content">
            <span className="stat-label">Total Orders</span>
            <strong className="stat-value">{stats.totalOrders}</strong>
            <span className="stat-sublabel">{stats.pendingOrders} pending</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-content">
            <span className="stat-label">Avg. Order Value</span>
            <strong className="stat-value">{stats.averageOrderValue.toLocaleString()} DT</strong>
            <span className="stat-sublabel">per shipped order</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-content">
            <span className="stat-label">Customers</span>
            <strong className="stat-value">{stats.totalUsers}</strong>
            <span className="stat-sublabel">registered users</span>
          </div>
        </div>
      </div>

      <div className="admin-panels" style={{ marginTop: 24 }}>
        <div className="admin-panel">
          <h3>Best Sellers</h3>
          {stats.bestSellingProducts.length === 0 && <p className="admin-empty">No sales yet.</p>}
          {stats.bestSellingProducts.map((product, i) => (
            <div key={product.id} className="admin-list-row">
              <span className="rank-badge">{i + 1}</span>
              <div className="admin-list-thumb">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} />
                ) : (
                  <div className={`admin-thumb-placeholder sign-glow-${product.glow}`}>
                    <span className="sign-text">{product.title}</span>
                  </div>
                )}
              </div>
              <div className="admin-list-main">
                <strong>{product.title}</strong>
                <span>{product.totalSold} sold · {product.revenue.toLocaleString()} DT revenue</span>
              </div>
              <div className="admin-list-meta">
                <strong>{product.stock} left</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-panel">
          <h3>Monthly Revenue <span className="panel-subtitle">(shipped, excl. shipping)</span></h3>
          {stats.monthlyRevenue.length === 0 && <p className="admin-empty">No shipped orders yet.</p>}
          <div className="monthly-revenue-chart">
            {stats.monthlyRevenue.map(({ month, revenue }) => {
              const max = Math.max(...stats.monthlyRevenue.map(m => m.revenue), 1)
              const pct = (revenue / max) * 100
              return (
                <div key={month} className="revenue-bar-group">
                  <span className="revenue-bar-label">{month.slice(5)}</span>
                  <div className="revenue-bar-track">
                    <div className="revenue-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="revenue-bar-value">{revenue.toLocaleString()} DT</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="admin-panels" style={{ marginTop: 24 }}>
        <div className="admin-panel">
          <h3>Order Status</h3>
          {Object.keys(stats.orderStatusCounts).length === 0 && <p className="admin-empty">No orders yet.</p>}
          {Object.entries(stats.orderStatusCounts).map(([status, count]) => (
            <div key={status} className="admin-list-row">
              <div className="admin-list-main">
                <span className={`order-status status-${status}`}>{status}</span>
              </div>
              <div className="admin-list-meta">
                <strong>{count}</strong>
              </div>
            </div>
          ))}
        </div>

        {stats.lowStockProducts.length > 0 && (
          <div className="admin-panel">
            <h3>Low Stock Alert</h3>
            {stats.lowStockProducts.map(product => (
              <div key={product.id} className="admin-list-row">
                <div className="admin-list-thumb">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} />
                  ) : (
                    <div className={`admin-thumb-placeholder sign-glow-${product.glow}`}>
                      <span className="sign-text">{product.title}</span>
                    </div>
                  )}
                </div>
                <div className="admin-list-main">
                  <strong>{product.title}</strong>
                  <span>{product.price.toLocaleString()} DT</span>
                </div>
                <div className="admin-list-meta">
                  <span className="low-stock-badge">{product.stock} left</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function AdminProducts({
  products,
  onDelete,
  onRefresh,
  onAddStock,
  onEdit,
}: {
  products: Product[]
  onDelete: (id: string) => Promise<boolean>
  onRefresh: () => Promise<void>
  onAddStock?: (id: string, amount: number) => Promise<boolean>
  onEdit: (id: string) => void
}) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [addingStock, setAddingStock] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    setDeleting(id)
    const ok = await onDelete(id)
    if (ok) onRefresh()
    setDeleting(null)
  }

  const handleAddStock = async (id: string) => {
    if (!onAddStock) return
    setAddingStock(id)
    const ok = await onAddStock(id, 10)
    if (ok) onRefresh()
    setAddingStock(null)
  }

  return (
    <div className="admin-products-table">
      <div className="table-header">
        <span>Product</span>
        <span>Price</span>
        <span>Stock</span>
        <span>Glow</span>
        <span>Actions</span>
      </div>
      {products.map(product => (
        <div key={product.id} className="table-row">
          <div className="table-product">
            <div className="table-thumb">
              {product.image_url ? (
                <img src={product.image_url} alt={product.title} />
              ) : (
                <span className="table-thumb-text">{product.title.slice(0, 3)}</span>
              )}
            </div>
            <div>
              <strong>{product.title}</strong>
              <span>{product.subtitle}</span>
            </div>
          </div>
          <span className="table-cell">{product.price.toLocaleString()} DT</span>
          <span className="table-cell">{product.stock}</span>
          <span className="table-cell">{product.glow}</span>
          <div className="table-actions">
            <Link to={`/product/${product.id}`} className="icon-button small" title="View">
              <Eye size={14} />
            </Link>
            <button
              type="button"
              className="icon-button small"
              title="Edit"
              onClick={() => onEdit(product.id)}
            >
              <PenSquare size={14} />
            </button>
            {onAddStock && (
              <button
                type="button"
                className="icon-button small"
                title="Add 10 Stock"
                disabled={addingStock === product.id}
                onClick={() => handleAddStock(product.id)}
              >
                <Plus size={14} />
              </button>
            )}
            <button
              type="button"
              className="icon-button small danger"
              title="Delete"
              disabled={deleting === product.id}
              onClick={() => handleDelete(product.id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function AdminOrders({
  admin,
  onMarkShipped,
}: {
  admin: ReturnType<typeof useAdmin>
  onMarkShipped: (id: string) => Promise<boolean>
}) {
  const [orders, setOrders] = useState<import('./lib/useAdmin').FullOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [shippingId, setShippingId] = useState<string | null>(null)

  useEffect(() => {
    admin.fetchOrders().then(data => { setOrders(data); setLoading(false) })
  }, [admin.fetchOrders])

  if (loading) {
    return <div className="signs-loading"><div className="loading-spinner" /><p>Loading orders...</p></div>
  }

  if (orders.length === 0) {
    return <div className="admin-empty" style={{ marginTop: 24 }}>No orders yet.</div>
  }

  return (
    <div className="admin-orders-page">
      {orders.map(order => {
        const itemTotal = order.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
        return (
          <div key={order.id} className="order-card order-card-full">
            <div className="order-card-header">
              <span className={`order-status status-${order.status}`}>{order.status}</span>
              <strong>{itemTotal.toLocaleString()} DT</strong>
              {order.shipping_fee > 0 && <span className="shipping-note">+ {order.shipping_fee.toLocaleString()} DT shipping</span>}
              <span className="order-card-date">{new Date(order.created_at).toLocaleDateString()}</span>
              {order.status !== 'shipped' && (
                <button
                  type="button"
                  className="button-primary button-sm"
                  disabled={shippingId === order.id}
                  onClick={async () => {
                    setShippingId(order.id)
                    const ok = await onMarkShipped(order.id)
                    if (ok) setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'shipped' } : o))
                    setShippingId(null)
                  }}
                >
                  <CheckCircle size={14} /> Mark Shipped
                </button>
              )}
            </div>
            <div className="order-card-body">
              <div className="order-card-field">
                <span className="field-label-sm">Name</span>
                <span>{order.shipping_name || '—'}</span>
              </div>
              <div className="order-card-field">
                <span className="field-label-sm">Email</span>
                <span>{order.shipping_email || '—'}</span>
              </div>
              <div className="order-card-field">
                <span className="field-label-sm">Phone</span>
                <span>{order.shipping_phone || '—'}</span>
              </div>
              <div className="order-card-field">
                <span className="field-label-sm">Address</span>
                <span>{order.shipping_address || '—'}</span>
              </div>
              <div className="order-card-field">
                <span className="field-label-sm">City</span>
                <span>{order.shipping_city || '—'}</span>
              </div>
              <div className="order-card-field">
                <span className="field-label-sm">Governorate</span>
                <span>{order.shipping_state || '—'}</span>
              </div>
              <div className="order-card-field">
                <span className="field-label-sm">ZIP</span>
                <span>{order.shipping_zip || '—'}</span>
              </div>
            </div>
            {order.items.length > 0 && (
              <div className="order-items-list">
                <span className="field-label-sm">Items</span>
                {order.items.map(item => (
                  <div key={item.id} className="order-item-row">
                    <span>Product #{item.product_id.slice(0, 8)}</span>
                    <span>×{item.quantity}</span>
                    <span>{(item.unit_price * item.quantity).toLocaleString()} DT</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AdminAddProduct({
  labels,
  onCreate,
  onSuccess,
}: {
  labels: Array<{ id: string; name: string; slug: string }>
  onCreate: (form: ProductForm, imageFiles: File[]) => Promise<boolean>
  onSuccess: () => void
}) {
  const navigate = useNavigate()
  const [form, setForm] = useState<ProductForm>({
    title: '',
    subtitle: '',
    description: '',
    price: '',
    glow: 'white',
    size: 'md',
    label_ids: [],
    stock: '10',
    is_trending: false,
    image_url: '',
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateField = (field: keyof ProductForm, value: string | boolean) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const toggleLabel = (labelId: string) => {
    setForm(f => ({
      ...f,
      label_ids: f.label_ids.includes(labelId)
        ? f.label_ids.filter(id => id !== labelId)
        : [...f.label_ids, labelId],
    }))
  }

  const addFiles = (files: FileList | File[]) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'))
    setImageFiles(prev => [...prev, ...valid])
    setImagePreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))])
  }

  const removeFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.price) return
    setSubmitting(true)
    const ok = await onCreate(form, imageFiles)
    setSubmitting(false)
    if (ok) {
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 1500)
    }
  }

  if (success) {
    return (
      <div className="order-success">
        <div className="order-success-icon">
          <Upload size={48} />
        </div>
        <h1>Product Created</h1>
        <p>Your new product has been added to the store.</p>
      </div>
    )
  }

  return (
    <form className="admin-add-form" onSubmit={handleSubmit}>
      <div className="admin-form-grid">
        <div className="admin-form-fields">
          <h3>Product Details</h3>
          <input
            className="field-input"
            placeholder="Product Title"
            value={form.title}
            onChange={e => updateField('title', e.target.value)}
            required
          />
          <input
            className="field-input"
            placeholder="Subtitle (e.g. Neon Edition · 1 of 50)"
            value={form.subtitle}
            onChange={e => updateField('subtitle', e.target.value)}
          />
          <textarea
            className="field-input field-textarea"
            placeholder="Product description..."
            rows={4}
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
          />

          <div className="field-row three-up">
            <div>
              <label className="field-label">Price (TND)</label>
              <input
                className="field-input"
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => updateField('price', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">Stock</label>
              <input
                className="field-input"
                type="number"
                placeholder="10"
                min="0"
                value={form.stock}
                onChange={e => updateField('stock', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Labels</label>
              <div className="chip-group">
                {labels.map(l => (
                  <button
                    key={l.id}
                    type="button"
                    className={`chip-button ${form.label_ids.includes(l.id) ? 'is-active' : ''}`}
                    onClick={() => toggleLabel(l.id)}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="field-row two-up">
            <div>
              <label className="field-label">Glow Color</label>
              <div className="chip-group">
                {GLOW_OPTIONS.map(g => (
                  <button
                    key={g}
                    type="button"
                    className={`chip-button ${form.glow === g ? 'is-active' : ''}`}
                    onClick={() => updateField('glow', g)}
                  >
                    <span className={`glow-dot sign-glow-${g}`} />
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Size</label>
              <div className="chip-group">
                {SIZE_OPTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`chip-button ${form.size === s ? 'is-active' : ''}`}
                    onClick={() => updateField('size', s)}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.is_trending}
              onChange={e => updateField('is_trending', e.target.checked)}
            />
            Mark as trending
          </label>
        </div>

        <div className="admin-form-image">
          <h3>Product Images</h3>
          <div className="edit-image-list">
            {imagePreviews.map((url, i) => (
              <div key={url} className="edit-image-item">
                <img src={url} alt={`Preview ${i + 1}`} className="edit-image-preview" />
                <button
                  type="button"
                  className="image-remove"
                  onClick={() => removeFile(i)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="edit-image-add"
              onClick={() => fileInputRef.current?.click()}
              title="Add image"
            >
              <Upload size={22} strokeWidth={1.5} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={e => {
              if (e.target.files) addFiles(e.target.files)
            }}
          />
          <p className="image-hint">First image is the primary. Drag to reorder. PNG, JPG, WEBP up to 5MB each.</p>
        </div>
      </div>

      <div className="admin-form-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={() => navigate('/admin/products')}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="button-primary"
          disabled={submitting || !form.title || !form.price}
        >
          {submitting ? 'Creating...' : 'Create Product'} <Upload size={16} />
        </button>
      </div>
    </form>
  )
}

function AdminEditProduct({
  product,
  labels,
  productLabelIds,
  onUpdate,
  onCancel,
}: {
  product: Product | null
  labels: Array<{ id: string; name: string; slug: string }>
  productLabelIds: string[]
  onUpdate: (form: ProductForm, newFiles: File[], removeIds: string[]) => Promise<boolean>
  onCancel: () => void
}) {
  const [form, setForm] = useState<ProductForm>({
    title: product?.title ?? '',
    subtitle: product?.subtitle ?? '',
    description: product?.description ?? '',
    price: product?.price.toString() ?? '',
    glow: product?.glow ?? 'white',
    size: product?.size ?? 'md',
    label_ids: productLabelIds,
    stock: product?.stock.toString() ?? '10',
    is_trending: product?.is_trending ?? false,
    image_url: product?.image_url ?? '',
  })
  const [existingImages, setExistingImages] = useState<Array<{ id: string; url: string }>>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [removeIds, setRemoveIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!product) return
    supabase.from('product_images').select('id, url').eq('product_id', product.id).order('sort_order').then(({ data }) => {
      setExistingImages(data ?? [])
    })
  }, [product])

  const updateField = (field: keyof ProductForm, value: string | boolean) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const toggleLabel = (labelId: string) => {
    setForm(f => ({
      ...f,
      label_ids: f.label_ids.includes(labelId)
        ? f.label_ids.filter(id => id !== labelId)
        : [...f.label_ids, labelId],
    }))
  }

  const addFiles = (files: FileList | File[]) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'))
    setNewFiles(prev => [...prev, ...valid])
    setNewPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))])
  }

  const removeExisting = (id: string) => {
    setRemoveIds(prev => [...prev, id])
    setExistingImages(prev => prev.filter(img => img.id !== id))
  }

  const removeNew = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
    setNewPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.price) return
    setSubmitting(true)
    const ok = await onUpdate(form, newFiles, removeIds)
    setSubmitting(false)
    if (ok) {
      setSuccess(true)
      setTimeout(onCancel, 1500)
    }
  }

  if (!product) {
    return <div className="signs-loading"><p>Product not found.</p></div>
  }

  if (success) {
    return (
      <div className="order-success">
        <div className="order-success-icon">
          <Upload size={48} />
        </div>
        <h1>Product Updated</h1>
        <p>Your changes have been saved.</p>
      </div>
    )
  }

  return (
    <form className="admin-add-form" onSubmit={handleSubmit}>
      <div className="admin-form-grid">
        <div className="admin-form-fields">
          <div>
            <label className="field-label">Title</label>
            <input
              className="field-input"
              type="text"
              placeholder="Product Title"
              value={form.title}
              onChange={e => updateField('title', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label">Subtitle</label>
            <input
              className="field-input"
              type="text"
              placeholder="Tagline (optional)"
              value={form.subtitle}
              onChange={e => updateField('subtitle', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Description</label>
            <textarea
              className="field-input field-textarea"
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
            />
          </div>
          <div className="form-row">
            <div>
              <label className="field-label">Price (DT)</label>
              <input
                className="field-input"
                type="number"
                placeholder="0"
                min="0"
                step="0.001"
                value={form.price}
                onChange={e => updateField('price', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">Stock</label>
              <input
                className="field-input"
                type="number"
                placeholder="10"
                min="0"
                value={form.stock}
                onChange={e => updateField('stock', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="field-label">Labels</label>
            <div className="chip-group">
              {labels.map(label => (
                <button
                  key={label.id}
                  type="button"
                  className={`chip-button ${form.label_ids.includes(label.id) ? 'is-active' : ''}`}
                  onClick={() => toggleLabel(label.id)}
                >
                  {label.name}
                </button>
              ))}
            </div>
          </div>
          <div className="form-row">
            <div>
              <label className="field-label">Glow Color</label>
              <div className="chip-group">
                {GLOW_OPTIONS.map(g => (
                  <button
                    key={g}
                    type="button"
                    className={`chip-button ${form.glow === g ? 'is-active' : ''}`}
                    onClick={() => updateField('glow', g)}
                  >
                    <span className={`glow-dot sign-glow-${g}`} />
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Size</label>
              <div className="chip-group">
                {SIZE_OPTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`chip-button ${form.size === s ? 'is-active' : ''}`}
                    onClick={() => updateField('size', s)}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.is_trending}
              onChange={e => updateField('is_trending', e.target.checked)}
            />
            Mark as trending
          </label>
        </div>

        <div className="admin-form-image">
          <h3>Product Images</h3>
          <div className="edit-image-list">
            {existingImages.map(img => (
              <div key={img.id} className="edit-image-item">
                <img src={img.url} alt="" className="edit-image-preview" />
                <button
                  type="button"
                  className="image-remove"
                  onClick={() => removeExisting(img.id)}
                  title="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {newPreviews.map((url, i) => (
              <div key={url} className="edit-image-item">
                <img src={url} alt={`New ${i + 1}`} className="edit-image-preview" />
                <button
                  type="button"
                  className="image-remove"
                  onClick={() => removeNew(i)}
                  title="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="edit-image-add"
              onClick={() => fileInputRef.current?.click()}
              title="Add image"
            >
              <Upload size={22} strokeWidth={1.5} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={e => {
              if (e.target.files) addFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <p className="image-hint">First image is the primary. PNG, JPG, WEBP up to 5MB each.</p>
        </div>
      </div>

      <div className="admin-form-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="button-primary"
          disabled={submitting || !form.title || !form.price}
        >
          {submitting ? 'Saving...' : 'Save Changes'} <Upload size={16} />
        </button>
      </div>
    </form>
  )
}

function AdminLabels({
  labels,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
}: {
  labels: Array<{ id: string; name: string; slug: string }>
  onCreate: (name: string, slug: string) => Promise<boolean>
  onUpdate: (id: string, name: string, slug: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
  onRefresh: () => Promise<void>
}) {
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return
    const ok = await onCreate(newName.trim(), newSlug.trim())
    if (ok) {
      setNewName('')
      setNewSlug('')
      onRefresh()
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim() || !editSlug.trim()) return
    const ok = await onUpdate(id, editName.trim(), editSlug.trim())
    if (ok) {
      setEditingId(null)
      onRefresh()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this label?')) return
    setDeleting(id)
    const ok = await onDelete(id)
    if (ok) onRefresh()
    setDeleting(null)
  }

  const startEdit = (label: typeof labels[number]) => {
    setEditingId(label.id)
    setEditName(label.name)
    setEditSlug(label.slug)
  }

  return (
    <div className="admin-panel">
      <h3 style={{ marginBottom: 16 }}>Labels</h3>

      <div className="admin-form-inline">
        <input
          className="field-input"
          placeholder="Label name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <input
          className="field-input"
          placeholder="e.g. street-signs"
          value={newSlug}
          onChange={e => setNewSlug(e.target.value)}
        />
        <button className="button-primary" type="button" onClick={handleCreate} style={{ minHeight: 48, padding: '0 20px' }}>
          Add
        </button>
      </div>

      {labels.length === 0 && <p className="admin-empty">No labels yet.</p>}

      {labels.map(label => (
        <div key={label.id} className="admin-list-row">
          {editingId === label.id ? (
            <>
              <div className="admin-form-inline" style={{ flex: 1, gap: 8 }}>
                <input
                  className="field-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={{ minHeight: 36, fontSize: '0.82rem' }}
                />
                <input
                  className="field-input"
                  value={editSlug}
                  onChange={e => setEditSlug(e.target.value)}
                  style={{ minHeight: 36, fontSize: '0.82rem' }}
                />
                <button className="button-primary" type="button" onClick={() => handleUpdate(label.id)} style={{ minHeight: 36, padding: '0 12px', fontSize: '0.75rem' }}>
                  Save
                </button>
                <button className="button-secondary" type="button" onClick={() => setEditingId(null)} style={{ minHeight: 36, padding: '0 12px', fontSize: '0.75rem' }}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="admin-list-main">
                <strong>{label.name}</strong>
                <span>/{label.slug}</span>
              </div>
              <div className="table-actions">
                <button type="button" className="icon-button small" onClick={() => startEdit(label)} title="Edit">
                  <Eye size={14} />
                </button>
                <button
                  type="button"
                  className="icon-button small danger"
                  disabled={deleting === label.id}
                  onClick={() => handleDelete(label.id)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function AdminShippingFee({
  fee,
  loading,
  onUpdate,
  onRefresh,
}: {
  fee: number
  loading: boolean
  onUpdate: (amount: number) => Promise<boolean>
  onRefresh: () => Promise<void>
}) {
  const [value, setValue] = useState(String(fee))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { setValue(String(fee)) }, [fee])

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    const amount = parseFloat(value)
    if (isNaN(amount) || amount < 0) {
      setMsg('Enter a valid amount')
      setSaving(false)
      return
    }
    const ok = await onUpdate(amount)
    if (ok) {
      setMsg('Saved')
      await onRefresh()
    } else {
      setMsg('Failed to save')
    }
    setSaving(false)
  }

  return (
    <div className="admin-panel" style={{ maxWidth: 480 }}>
      <h3 style={{ marginBottom: 16 }}>Shipping Fee</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: 16 }}>
        Set the flat shipping fee applied to all orders. Set to 0 for free shipping.
      </p>
      <div className="admin-form-inline">
        <input
          className="field-input"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={loading ? 'Loading...' : value}
          onChange={e => setValue(e.target.value)}
          style={{ maxWidth: 160 }}
        />
        <button className="button-primary" type="button" onClick={handleSave} disabled={saving || loading} style={{ minHeight: 48, padding: '0 24px' }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      {msg && <p style={{ fontSize: '0.82rem', marginTop: 8, color: msg === 'Saved' ? 'var(--glow-green)' : 'var(--glow-red)' }}>{msg}</p>}
    </div>
  )
}

function CheckoutBlock({ title, step, children }: { title: string; step: string; children: React.ReactNode }) {
  return (
    <section className="checkout-block">
      <div className="checkout-block-head">
        <h2>{title}</h2>
        <span>{step}</span>
      </div>
      <div className="checkout-block-body">{children}</div>
    </section>
  )
}

function CollectionCard({
  product,
  index,
}: {
  product: Product
  index: number
}) {
  const navigate = useNavigate()
  return (
    <article className={`collection-card ${index === 0 ? 'collection-featured' : ''}`} onClick={() => navigate(`/product/${product.id}`)}>
      <div className="collection-art">
        {product.image_url && <img src={product.image_url} alt={product.title} className="collection-card-image" />}
        {product.stock <= 0 && <span className="collection-badge badge-oos">OUT OF STOCK</span>}
        {product.stock > 0 && product.stock <= 10 && <span className="collection-badge">LIMITED</span>}
      </div>
      <div className="collection-body">
        <h3>{product.title}</h3>
        <p>{product.subtitle}</p>
        <div className="collection-footer-row">
          <strong>{product.price.toLocaleString()} DT</strong>
          <button type="button" className="text-link compact">
            View <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </article>
  )
}

function FilterSection({
  title,
  items,
  active,
  onSelect,
}: {
  title: string
  items: Array<{ label: string; value: string | null }>
  active: string | null
  onSelect: (value: string | null) => void
}) {
  return (
    <section className="filter-section">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              className={active === item.value ? 'is-active' : ''}
              onClick={() => onSelect(item.value)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span>SY<span className="brand-arabic">ڨ</span>N<span style={{ color: 'var(--glow-pink)' }}>.</span></span>
          <p>Street-grade signage for modern spaces. Handcrafted, precision-engineered, built to last.</p>
        </div>
        <p className="footer-copyright">&copy; 2024 SY<span className="brand-arabic">ڨ</span>N STUDIOS. ALL RIGHTS RESERVED.</p>
      </div>
    </footer>
  )
}

export default App
