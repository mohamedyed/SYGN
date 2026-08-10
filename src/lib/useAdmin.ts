import { useState, useCallback } from 'react'
import { supabase } from './supabase'

export interface AdminStats {
  totalRevenue: number
  totalOrders: number
  totalUsers: number
  pendingOrders: number
  shippedOrders: number
  averageOrderValue: number
  bestSellingProducts: Array<{
    id: string
    title: string
    price: number
    stock: number
    image_url: string | null
    glow: string
    totalSold: number
    revenue: number
  }>
  lowStockProducts: Array<{
    id: string
    title: string
    price: number
    stock: number
    image_url: string | null
    glow: string
  }>
  orderStatusCounts: Record<string, number>
  monthlyRevenue: Array<{ month: string; revenue: number }>
}

export interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: string
}

export interface FullOrder {
  id: string
  user_id: string | null
  status: string
  total: number
  shipping_fee: number
  shipping_name: string | null
  shipping_email: string | null
  shipping_phone: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_zip: string | null
  created_at: string
  items: OrderItem[]
}

export interface ProductForm {
  title: string
  subtitle: string
  description: string
  price: string
  glow: string
  size: string
  label_ids: string[]
  stock: string
  is_trending: boolean
  image_url: string
}

export const GLOW_OPTIONS = ['pink', 'blue', 'cyan', 'amber', 'red', 'purple', 'white', 'green', 'warm'] as const
export const SIZE_OPTIONS = ['sm', 'md', 'lg', 'xl'] as const

export function useAdmin() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [productsRes, orderItemsRes, allOrdersRes, profilesRes] = await Promise.all([
        supabase.from('products').select('id, title, price, stock, image_url, glow'),
        supabase.from('order_items').select('order_id, product_id, unit_price, quantity'),
        supabase.from('orders').select('id, shipping_fee, status, created_at'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ])

      const products = productsRes.data ?? []
      const allOrders = allOrdersRes.data ?? []
      const allOrderItems = orderItemsRes.data ?? []

      // Archived orders are excluded from all analytics (soft reset)
      const archivedOrderIds = new Set(allOrders.filter(o => o.status === 'archived').map(o => o.id))
      const orders = allOrders.filter(o => o.status !== 'archived')
      const orderItems = allOrderItems.filter(item => !archivedOrderIds.has(item.order_id))

      // Revenue: only shipped orders, exclude shipping_fee
      const shippedOrders = orders.filter(o => o.status === 'shipped')
      const shippedOrderIds = new Set(shippedOrders.map(o => o.id))
      const shippedItems = orderItems.filter(item => shippedOrderIds.has(item.order_id))
      const totalRevenue = shippedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)

      const totalOrders = orders.length
      const shippedCount = shippedOrders.length
      const pendingCount = orders.filter(o => o.status !== 'shipped').length
      const avgOrderValue = shippedCount > 0 ? Math.round(totalRevenue / shippedCount) : 0

      // Best-selling products: aggregate sold qty and revenue from ALL order_items (not just shipped)
      const productSales: Record<string, { totalSold: number; revenue: number }> = {}
      for (const item of orderItems) {
        if (!productSales[item.product_id]) productSales[item.product_id] = { totalSold: 0, revenue: 0 }
        productSales[item.product_id].totalSold += item.quantity
        productSales[item.product_id].revenue += item.unit_price * item.quantity
      }
      const bestSellingProducts = products
        .map(p => ({
          ...p,
          totalSold: productSales[p.id]?.totalSold ?? 0,
          revenue: productSales[p.id]?.revenue ?? 0,
        }))
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 10)

      const lowStockProducts = products
        .filter(p => p.stock > 0 && p.stock <= 5)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 8)

      const orderStatusCounts: Record<string, number> = {}
      for (const o of orders) {
        const s = o.status || 'pending'
        orderStatusCounts[s] = (orderStatusCounts[s] || 0) + 1
      }

      // Monthly revenue: only shipped orders, exclude shipping_fee
      const monthMap: Record<string, number> = {}
      for (const o of shippedOrders) {
        const m = o.created_at.slice(0, 7)
        const itemSum = orderItems
          .filter(item => item.order_id === o.id)
          .reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
        monthMap[m] = (monthMap[m] || 0) + itemSum
      }
      const monthlyRevenue = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, revenue]) => ({ month, revenue }))

      setStats({
        totalRevenue,
        totalOrders,
        totalUsers: profilesRes.count ?? 0,
        pendingOrders: pendingCount,
        shippedOrders: shippedCount,
        averageOrderValue: avgOrderValue,
        bestSellingProducts,
        lowStockProducts,
        orderStatusCounts,
        monthlyRevenue,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return null
    }
    if (!file.type.startsWith('image/')) {
      setError('File must be an image')
      return null
    }

    const ext = file.name.split('.').pop() ?? 'png'
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      setError(uploadError.message)
      return null
    }

    const { data } = supabase.storage.from('products').getPublicUrl(path)
    return data.publicUrl
  }, [])

  const setProductLabels = useCallback(async (productId: string, labelIds: string[]) => {
    await supabase.from('product_labels').delete().eq('product_id', productId)
    if (labelIds.length > 0) {
      const rows = labelIds.map(label_id => ({ product_id: productId, label_id }))
      await supabase.from('product_labels').insert(rows)
    }
  }, [])

  const createProduct = useCallback(async (form: ProductForm, imageFiles: File[]): Promise<boolean> => {
    setError(null)
    try {
      let primaryUrl: string | null = form.image_url || null

      if (imageFiles.length > 0) {
        const first = await uploadImage(imageFiles[0])
        if (!first) return false
        primaryUrl = first
      }

      const { data: product, error: insertError } = await supabase.from('products').insert({
        title: form.title,
        subtitle: form.subtitle || null,
        description: form.description || null,
        price: parseFloat(form.price),
        glow: form.glow,
        size: form.size,
        stock: parseInt(form.stock) || 0,
        is_trending: form.is_trending,
        image_url: primaryUrl,
      }).select().single()

      if (insertError) {
        setError(insertError.message)
        return false
      }

      // Upload remaining images and insert product_images rows
      if (imageFiles.length > 0) {
        const rows: Array<{ product_id: string; url: string; sort_order: number }> = []
        for (let i = 0; i < imageFiles.length; i++) {
          const url = i === 0 ? primaryUrl! : await uploadImage(imageFiles[i])
          if (url) rows.push({ product_id: product.id, url, sort_order: i })
        }
        if (rows.length > 0) {
          await supabase.from('product_images').insert(rows)
        }
      }

      if (form.label_ids.length > 0) {
        await setProductLabels(product.id, form.label_ids)
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
      return false
    }
  }, [uploadImage, setProductLabels])

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    setError(null)
    const { error: deleteError } = await supabase.from('products').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      return false
    }
    return true
  }, [])

  const deleteProductImage = useCallback(async (id: string): Promise<boolean> => {
    setError(null)
    const { error } = await supabase.from('product_images').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return false
    }
    return true
  }, [])

  const updateProductImages = useCallback(async (productId: string, newFiles: File[], removeIds: string[]): Promise<boolean> => {
    setError(null)
    try {
      if (removeIds.length > 0) {
        await supabase.from('product_images').delete().in('id', removeIds)
      }

      if (newFiles.length > 0) {
        const rows: Array<{ product_id: string; url: string; sort_order: number }> = []
        for (let i = 0; i < newFiles.length; i++) {
          const url = await uploadImage(newFiles[i])
          if (url) rows.push({ product_id: productId, url, sort_order: i })
        }
        if (rows.length > 0) {
          await supabase.from('product_images').insert(rows)
        }
      }

      // Update the primary image_url to the first product_images row if it exists
      const { data: existing } = await supabase
        .from('product_images')
        .select('url')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })
        .limit(1)

      if (existing && existing.length > 0) {
        await supabase.from('products').update({ image_url: existing[0].url }).eq('id', productId)
      } else if (removeIds.length > 0 && (!newFiles || newFiles.length === 0)) {
        // All images removed, set to null
        await supabase.from('products').update({ image_url: null }).eq('id', productId)
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update images')
      return false
    }
  }, [uploadImage])

  const updateProduct = useCallback(async (id: string, updates: Partial<ProductForm>): Promise<boolean> => {
    setError(null)
    const payload: Record<string, unknown> = {}
    if (updates.title !== undefined) payload.title = updates.title
    if (updates.subtitle !== undefined) payload.subtitle = updates.subtitle
    if (updates.description !== undefined) payload.description = updates.description
    if (updates.price !== undefined) payload.price = parseFloat(updates.price)
    if (updates.glow !== undefined) payload.glow = updates.glow
    if (updates.size !== undefined) payload.size = updates.size
    if (updates.stock !== undefined) payload.stock = parseInt(updates.stock)
    if (updates.is_trending !== undefined) payload.is_trending = updates.is_trending
    if (updates.image_url !== undefined) payload.image_url = updates.image_url || null

    const { error: updateError } = await supabase.from('products').update(payload).eq('id', id)
    if (updateError) {
      setError(updateError.message)
      return false
    }

    if (updates.label_ids !== undefined) {
      await setProductLabels(id, updates.label_ids)
    }

    return true
  }, [setProductLabels])

  const addStock = useCallback(async (id: string, amount: number): Promise<boolean> => {
    setError(null)
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', id)
      .single()

    if (!product) {
      setError('Product not found')
      return false
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: product.stock + amount })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      return false
    }
    return true
  }, [])

  const createLabel = useCallback(async (name: string, slug: string): Promise<boolean> => {
    setError(null)
    const { error: insertError } = await supabase.from('labels').insert({ name, slug })
    if (insertError) {
      setError(insertError.message)
      return false
    }
    return true
  }, [])

  const updateLabel = useCallback(async (id: string, name: string, slug: string): Promise<boolean> => {
    setError(null)
    const { error: updateError } = await supabase.from('labels').update({ name, slug }).eq('id', id)
    if (updateError) {
      setError(updateError.message)
      return false
    }
    return true
  }, [])

  const deleteLabel = useCallback(async (id: string): Promise<boolean> => {
    setError(null)
    const { error: deleteError } = await supabase.from('labels').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      return false
    }
    return true
  }, [])

  const markAsShipped = useCallback(async (orderId: string): Promise<boolean> => {
    setError(null)
    const { error } = await supabase
      .from('orders')
      .update({ status: 'shipped' })
      .eq('id', orderId)
    if (error) {
      setError(error.message)
      return false
    }
    return true
  }, [])

  const resetAnalytics = useCallback(async (): Promise<boolean> => {
    setError(null)
    const { error } = await supabase
      .from('orders')
      .update({ status: 'archived' })
      .neq('status', 'archived')
    if (error) {
      setError(error.message)
      return false
    }
    return true
  }, [])

  const fetchOrders = useCallback(async (): Promise<FullOrder[]> => {
    setError(null)
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')

      if (itemsError) throw itemsError

      const itemMap: Record<string, OrderItem[]> = {}
      for (const item of items ?? []) {
        if (!itemMap[item.order_id]) itemMap[item.order_id] = []
        itemMap[item.order_id].push(item)
      }

      return (orders ?? []).map(o => ({
        ...o,
        items: itemMap[o.id] ?? [],
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
      return []
    }
  }, [])

  return {
    stats,
    loading,
    error,
    fetchStats,
    createProduct,
    deleteProduct,
    updateProduct,
    updateProductImages,
    addStock,
    deleteProductImage,
    createLabel,
    updateLabel,
    deleteLabel,
    uploadImage,
    markAsShipped,
    resetAnalytics,
    fetchOrders,
  }
}
