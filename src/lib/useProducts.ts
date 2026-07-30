import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

export interface Product {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  price: number
  glow: string
  size: string
  image_url: string | null
  images: string[]
  stock: number
  is_trending: boolean
  created_at: string
}

export interface Label {
  id: string
  name: string
  slug: string
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [productLabels, setProductLabels] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const [productsRes, imagesRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('product_images').select('product_id, url, sort_order').order('sort_order'),
    ])

    if (productsRes.error) {
      setError(productsRes.error.message)
    } else {
      const imgMap: Record<string, string[]> = {}
      for (const row of imagesRes.data ?? []) {
        if (!imgMap[row.product_id]) imgMap[row.product_id] = []
        imgMap[row.product_id].push(row.url)
      }

      setProducts((productsRes.data ?? []).map(p => ({
        ...p,
        images: imgMap[p.id] ?? [],
      })))
    }
    setLoading(false)
  }, [])

  const fetchLabels = useCallback(async () => {
    const { data } = await supabase
      .from('labels')
      .select('*')
      .order('name')

    setLabels(data ?? [])
  }, [])

  const fetchProductLabels = useCallback(async () => {
    const { data } = await supabase
      .from('product_labels')
      .select('product_id, label_id')

    const map: Record<string, string[]> = {}
    for (const row of data ?? []) {
      if (!map[row.product_id]) map[row.product_id] = []
      map[row.product_id].push(row.label_id)
    }
    setProductLabels(map)
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchLabels()
    fetchProductLabels()
  }, [fetchProducts, fetchLabels, fetchProductLabels])

  const getProduct = useCallback(async (id: string): Promise<Product | null> => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    return data
  }, [])

  const getProductsByLabel = useCallback(async (labelSlug: string): Promise<Product[]> => {
    const { data: label } = await supabase
      .from('labels')
      .select('id')
      .eq('slug', labelSlug)
      .single()

    if (!label) return []

    const { data: links } = await supabase
      .from('product_labels')
      .select('product_id')
      .eq('label_id', label.id)

    if (!links || links.length === 0) return []

    const ids = links.map(l => l.product_id)
    const { data } = await supabase
      .from('products')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false })

    return data ?? []
  }, [])

  return { products, labels, productLabels, loading, error, getProduct, getProductsByLabel, refetch: fetchProducts, refetchLabels: fetchLabels }
}
