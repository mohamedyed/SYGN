import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Link, Navigate } from 'react-router-dom'
import {
  ArrowRight,
  CreditCard,
  Lock,
  Moon,
  Search,
  ShoppingBag,
  Sun,
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
  LayoutDashboard,
  Shield,
} from 'lucide-react'
import './index.css'

import { supabase } from './lib/supabase'
import { useAuth } from './lib/useAuth'
import { useCart } from './lib/useCart'
import { useProducts } from './lib/useProducts'
import { useAdmin } from './lib/useAdmin'
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
      price_display: `$${base.price.toLocaleString()}`,
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
  const { products, categories, loading, refetch } = useProducts()

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
                categories={categories}
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
                <AdminView products={products} categories={categories} refetchProducts={refetch} />
              ) : (
                <Navigate to="/auth" replace />
              )
            } />
          </Routes>
        </main>

        <SiteFooter />
      </div>
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
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => location.pathname === path ? 'is-active' : ''

  return (
    <header className="site-header">
      <div className="header-left">
        <Link to="/" className="brand-mark">
          SYGN<span className="brand-mark-accent">.</span>
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
        <button className="icon-button" type="button" aria-label="Search">
          <Search size={18} strokeWidth={2} />
        </button>
        <Link to="/checkout" className="icon-button cart-button" aria-label="Cart">
          <ShoppingBag size={18} strokeWidth={2} />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>
        <div className="user-menu-wrapper">
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

      <div className="streetscape">
        <div className="shop-intro">
          <h1>The Digital Street</h1>
          <p>Street-grade signage for modern spaces. Walk through and find your sign.</p>
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
  categories,
  loading,
}: {
  products: Product[]
  categories: Array<{ id: string; name: string; slug: string }>
  loading: boolean
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return products
    return products.filter(p => p.category_id === activeCategory)
  }, [products, activeCategory])

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
            title="Category"
            items={[{ label: 'All Signs', value: null }, ...categories.map(c => ({ label: c.name, value: c.id }))]}
            active={activeCategory}
            onSelect={setActiveCategory}
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
  const product = products.find(p => p.id === id) ?? products[0]

  if (!product) {
    return (
      <section className="page-product">
        <div className="signs-loading"><p>Product not found.</p></div>
      </section>
    )
  }

  const handleAddToCart = () => {
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
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} className="hero-image" />
            ) : (
              <div className={`hero-placeholder sign-glow-${product.glow}`}>
                <span className="sign-text">{product.title}</span>
              </div>
            )}
            <div className="art-glow" />
          </div>
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
          <div className="product-price">${product.price.toLocaleString()}.00</div>
          <p className="product-description">
            {product.description || 'Hand-crafted high-grade aluminum. Precision-engineered light distribution. 50,000 hour lifespan. A statement piece designed for modern interiors.'}
          </p>
          <div className="qty-row">
            <button type="button" className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>
              <Minus size={14} />
            </button>
            <span className="qty-value">{qty}</span>
            <button type="button" className="qty-btn" onClick={() => setQty(q => q + 1)}>
              <Plus size={14} />
            </button>
          </div>
          <div className="product-actions">
            <button className="button-primary" type="button" onClick={handleAddToCart}>
              Add to Bag <ArrowRight size={16} />
            </button>
          </div>
          <div className="product-meta">
            <div>
              <span>Availability</span>
              <strong>{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</strong>
            </div>
            <div>
              <span>Shipping</span>
              <strong>Free Global</strong>
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
  const [submitting, setSubmitting] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [shipping, setShipping] = useState({
    name: '', email: user?.email ?? '', address: '', city: '', state: '', zip: '',
  })

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) return
    setSubmitting(true)

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id ?? null,
          total: cart.total,
          shipping_name: shipping.name,
          shipping_email: shipping.email,
          shipping_address: shipping.address,
          shipping_city: shipping.city,
          shipping_state: shipping.state,
          shipping_zip: shipping.zip,
        })
        .select()
        .single()

      if (orderError) throw orderError

      const items = cart.items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(items)
      if (itemsError) throw itemsError

      cart.clearCart()
      setOrderPlaced(true)
    } catch (err) {
      console.error('Order failed:', err)
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
          <h1>Order Placed</h1>
          <p>Thank you for your purchase. You will receive a confirmation email shortly.</p>
          <button className="button-primary" type="button" onClick={() => navigate('/')}>
            Continue Shopping <ArrowRight size={16} />
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
          <h1>Your Bag is Empty</h1>
          <p>Browse our collection and find your perfect sign.</p>
          <button className="button-primary" type="button" onClick={() => navigate('/')}>
            Shop Now <ArrowRight size={16} />
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
          <p>Complete your secure purchase.</p>
        </div>
      </div>

      <div className="checkout-layout">
        <div className="checkout-form-grid">
          <CheckoutBlock title="Contact" step="Step 1 of 3">
            <input
              className="field-input"
              placeholder="Email Address"
              value={shipping.email}
              onChange={e => setShipping(s => ({ ...s, email: e.target.value }))}
            />
            {!user && (
              <p className="payment-note">Already have an account? <Link to="/auth" className="text-link">Sign in</Link></p>
            )}
          </CheckoutBlock>

          <CheckoutBlock title="Shipping" step="Step 2 of 3">
            <input
              className="field-input"
              placeholder="Full Name"
              value={shipping.name}
              onChange={e => setShipping(s => ({ ...s, name: e.target.value }))}
            />
            <input
              className="field-input"
              placeholder="Address"
              value={shipping.address}
              onChange={e => setShipping(s => ({ ...s, address: e.target.value }))}
            />
            <div className="field-row three-up">
              <input
                className="field-input"
                placeholder="City"
                value={shipping.city}
                onChange={e => setShipping(s => ({ ...s, city: e.target.value }))}
              />
              <input
                className="field-input"
                placeholder="State"
                value={shipping.state}
                onChange={e => setShipping(s => ({ ...s, state: e.target.value }))}
              />
              <input
                className="field-input"
                placeholder="ZIP Code"
                value={shipping.zip}
                onChange={e => setShipping(s => ({ ...s, zip: e.target.value }))}
              />
            </div>
          </CheckoutBlock>

          <CheckoutBlock title="Payment" step="Step 3 of 3">
            <p className="payment-note">All transactions are secure and encrypted.</p>
            <div className="payment-method">
              <label>
                <input type="radio" name="payment" defaultChecked />
                <span>Credit Card</span>
              </label>
              <CreditCard size={18} />
            </div>
            <div className="field-row three-up">
              <input className="field-input" placeholder="Card Number" />
              <input className="field-input" placeholder="MM / YY" />
              <input className="field-input" placeholder="CVC" />
            </div>
            <div className="payment-method">
              <label>
                <input type="radio" name="payment" />
                <span>PayPal</span>
              </label>
              <Lock size={18} />
            </div>
          </CheckoutBlock>
        </div>

        <aside className="summary-panel">
          <h2>Summary</h2>
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
                <p>Qty: {item.quantity}</p>
              </div>
              <strong>${(item.price * item.quantity).toLocaleString()}</strong>
            </div>
          ))}
          <div className="summary-lines">
            <div><span>Subtotal</span><strong>${cart.total.toLocaleString()}.00</strong></div>
            <div><span>Shipping</span><strong>Free</strong></div>
            <div><span>Taxes</span><strong>$0.00</strong></div>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>USD ${cart.total.toLocaleString()}.00</strong>
          </div>
          <button
            className="button-primary wide"
            type="button"
            onClick={handlePlaceOrder}
            disabled={submitting || !shipping.name || !shipping.address}
          >
            {submitting ? 'Placing Order...' : 'Complete Order'} <ArrowRight size={16} />
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
          <p>{isSignUp ? 'Join SYGN to track orders and more.' : 'Welcome back.'}</p>
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
  categories,
  refetchProducts,
}: {
  products: Product[]
  categories: Array<{ id: string; name: string; slug: string }>
  refetchProducts: () => Promise<void>
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const admin = useAdmin()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'add'>('dashboard')

  const tabFromUrl = useCallback(() => {
    if (location.pathname === '/admin/products') return 'products' as const
    if (location.pathname === '/admin/add') return 'add' as const
    return 'dashboard' as const
  }, [location.pathname])

  useEffect(() => {
    setActiveTab(tabFromUrl())
  }, [tabFromUrl])

  useEffect(() => {
    admin.fetchStats()
  }, [admin])

  const handleTabChange = (tab: 'dashboard' | 'products' | 'add') => {
    setActiveTab(tab)
    if (tab === 'dashboard') navigate('/admin')
    else if (tab === 'products') navigate('/admin/products')
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

      {activeTab === 'products' && (
        <AdminProducts
          products={products}
          onDelete={admin.deleteProduct}
          onRefresh={async () => { await admin.fetchStats(); await refetchProducts() }}
        />
      )}

      {activeTab === 'add' && (
        <AdminAddProduct
          categories={categories}
          onCreate={admin.createProduct}
          onSuccess={() => { refetchProducts(); navigate('/admin/products') }}
        />
      )}
    </section>
  )
}

function AdminDashboard({ stats }: { stats: import('./lib/useAdmin').AdminStats }) {
  return (
    <>
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Package size={20} /></div>
          <div className="stat-content">
            <span className="stat-label">Products</span>
            <strong className="stat-value">{stats.totalProducts}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><DollarSign size={20} /></div>
          <div className="stat-content">
            <span className="stat-label">Revenue</span>
            <strong className="stat-value">${stats.totalRevenue.toLocaleString()}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><BarChart3 size={20} /></div>
          <div className="stat-content">
            <span className="stat-label">Orders</span>
            <strong className="stat-value">{stats.totalOrders}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-content">
            <span className="stat-label">Users</span>
            <strong className="stat-value">{stats.totalUsers}</strong>
          </div>
        </div>
      </div>

      <div className="admin-panels">
        <div className="admin-panel">
          <h3>Recent Orders</h3>
          {stats.recentOrders.length === 0 && <p className="admin-empty">No orders yet.</p>}
          {stats.recentOrders.map(order => (
            <div key={order.id} className="admin-list-row">
              <div className="admin-list-main">
                <strong>{order.shipping_name || 'Guest'}</strong>
                <span>{order.shipping_email}</span>
              </div>
              <div className="admin-list-meta">
                <span className={`order-status status-${order.status}`}>{order.status}</span>
                <strong>${order.total.toLocaleString()}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-panel">
          <h3>Top Products</h3>
          {stats.topProducts.map(product => (
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
                <span>${product.price.toLocaleString()} · {product.stock} in stock</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function AdminProducts({
  products,
  onDelete,
  onRefresh,
}: {
  products: Product[]
  onDelete: (id: string) => Promise<boolean>
  onRefresh: () => Promise<void>
}) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    setDeleting(id)
    const ok = await onDelete(id)
    if (ok) onRefresh()
    setDeleting(null)
  }

  return (
    <div className="admin-products-table">
      <div className="table-header">
        <span>Product</span>
        <span>Price</span>
        <span>Stock</span>
        <span>Category</span>
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
          <span className="table-cell">${product.price.toLocaleString()}</span>
          <span className="table-cell">{product.stock}</span>
          <span className="table-cell">{product.glow}</span>
          <div className="table-actions">
            <Link to={`/product/${product.id}`} className="icon-button small" title="View">
              <Eye size={14} />
            </Link>
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

function AdminAddProduct({
  categories,
  onCreate,
  onSuccess,
}: {
  categories: Array<{ id: string; name: string; slug: string }>
  onCreate: (form: ProductForm, imageFile: File | null) => Promise<boolean>
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
    category_id: '',
    stock: '10',
    is_trending: false,
    image_url: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragAreaRef = useRef<HTMLDivElement>(null)

  const updateField = (field: keyof ProductForm, value: string | boolean) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragAreaRef.current?.classList.remove('is-dragover')
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    dragAreaRef.current?.classList.add('is-dragover')
  }

  const handleDragLeave = () => {
    dragAreaRef.current?.classList.remove('is-dragover')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.price) return
    setSubmitting(true)
    const ok = await onCreate(form, imageFile)
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
              <label className="field-label">Price (USD)</label>
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
              <label className="field-label">Category</label>
              <select
                className="field-input"
                value={form.category_id}
                onChange={e => updateField('category_id', e.target.value)}
              >
                <option value="">None</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
          <h3>Product Image</h3>
          <div
            ref={dragAreaRef}
            className={`image-drop-zone ${imagePreview ? 'has-image' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="image-preview" />
                <button
                  type="button"
                  className="image-remove"
                  onClick={e => {
                    e.stopPropagation()
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <Upload size={32} strokeWidth={1.5} />
                <p>Drop image here or click to upload</p>
                <span>PNG, JPG, WEBP up to 5MB</span>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />
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
        {product.stock <= 10 && <span className="collection-badge">LIMITED</span>}
      </div>
      <div className="collection-body">
        <h3>{product.title}</h3>
        <p>{product.subtitle}</p>
        <div className="collection-footer-row">
          <strong>${product.price.toLocaleString()}</strong>
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
          <span>SYGN<span style={{ color: 'var(--glow-pink)' }}>.</span></span>
          <p>Street-grade signage for modern spaces. Handcrafted, precision-engineered, built to last.</p>
        </div>
        <p className="footer-copyright">&copy; 2024 SYGN STUDIOS. ALL RIGHTS RESERVED.</p>
      </div>
    </footer>
  )
}

export default App
