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
  category_id: string
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

  const createProduct = useCallback(async (form: ProductForm, imageFile: File | null): Promise<boolean> => {
    setError(null)
    try {
      let imageUrl = form.image_url || null

      if (imageFile) {
        const uploaded = await uploadImage(imageFile)
        if (!uploaded) return false
        imageUrl = uploaded
      }

      const { error: insertError } = await supabase.from('products').insert({
        title: form.title,
        subtitle: form.subtitle || null,
        description: form.description || null,
        price: parseFloat(form.price),
        glow: form.glow,
        size: form.size,
        category_id: form.category_id || null,
        stock: parseInt(form.stock) || 0,
        is_trending: form.is_trending,
        image_url: imageUrl,
      })

      if (insertError) {
        setError(insertError.message)
        return false
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
      return false
    }
  }, [uploadImage])

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
    if (updates.category_id !== undefined) payload.category_id = updates.category_id || null
    if (updates.stock !== undefined) payload.stock = parseInt(updates.stock)
    if (updates.is_trending !== undefined) payload.is_trending = updates.is_trending
    if (updates.image_url !== undefined) payload.image_url = updates.image_url || null

    const { error: updateError } = await supabase.from('products').update(payload).eq('id', id)
    if (updateError) {
      setError(updateError.message)
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
    uploadImage,
  }
}
