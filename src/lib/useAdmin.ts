import { useState, useCallback } from 'react'
import { supabase } from './supabase'

export interface AdminStats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  totalUsers: number
  recentOrders: Array<{
    id: string
    total: number
    status: string
    shipping_name: string | null
    shipping_email: string | null
    created_at: string
  }>
  topProducts: Array<{
    id: string
    title: string
    price: number
    stock: number
    image_url: string | null
    glow: string
  }>
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
      const [productsRes, ordersRes, profilesRes, orderItemsRes] = await Promise.all([
        supabase.from('products').select('id, title, price, stock, image_url, glow'),
        supabase.from('orders').select('id, total, status, shipping_name, shipping_email, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('order_items').select('unit_price, quantity'),
      ])

      const products = productsRes.data ?? []
      const orders = ordersRes.data ?? []
      const orderItems = orderItemsRes.data ?? []

      const totalRevenue = orderItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
        totalUsers: profilesRes.count ?? 0,
        recentOrders: orders,
        topProducts: products.slice(0, 5),
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

  const createProduct = useCallback(async (form: ProductForm, imageFile: File | null): Promise<boolean> => {
    setError(null)
    try {
      let imageUrl = form.image_url || null

      if (imageFile) {
        const uploaded = await uploadImage(imageFile)
        if (!uploaded) return false
        imageUrl = uploaded
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
        image_url: imageUrl,
      }).select().single()

      if (insertError) {
        setError(insertError.message)
        return false
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

  return {
    stats,
    loading,
    error,
    fetchStats,
    createProduct,
    deleteProduct,
    updateProduct,
    addStock,
    createLabel,
    updateLabel,
    deleteLabel,
    uploadImage,
  }
}
