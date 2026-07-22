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
  category_id: string | null
  stock: number
  is_trending: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setProducts(data ?? [])
    }
    setLoading(false)
  }, [])

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    setCategories(data ?? [])
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  const getProduct = useCallback(async (id: string): Promise<Product | null> => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    return data
  }, [])

  const getProductsByCategory = useCallback(async (categorySlug: string): Promise<Product[]> => {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (!cat) return []

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', cat.id)
      .order('created_at', { ascending: false })

    return data ?? []
  }, [])

  return { products, categories, loading, error, getProduct, getProductsByCategory, refetch: fetchProducts }
}
