import { useState, useCallback } from 'react'
import { supabase } from './supabase'

export function useShippingFee() {
  const [fee, setFee] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  const fetchFee = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'shipping_fee')
      .single()
    if (data) setFee(parseFloat(data.value) || 0)
    setLoading(false)
  }, [])

  const updateFee = useCallback(async (amount: number): Promise<boolean> => {
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'shipping_fee', value: String(amount) }, { onConflict: 'key' })
    if (error) return false
    setFee(amount)
    return true
  }, [])

  return { fee, loading, fetchFee, updateFee }
}
