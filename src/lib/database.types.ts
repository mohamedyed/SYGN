export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
      }
      products: {
        Row: {
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
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          description?: string | null
          price: number
          glow?: string
          size?: string
          image_url?: string | null
          category_id?: string | null
          stock?: number
          is_trending?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          is_admin: boolean
          created_at: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          status: string
          total: number
          shipping_name: string | null
          shipping_email: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_state: string | null
          shipping_zip: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          status?: string
          total: number
          shipping_name?: string | null
          shipping_email?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_state?: string | null
          shipping_zip?: string | null
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price: number
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string | null
          user_id: string | null
          rating: number
          comment: string | null
          created_at: string
        }
      }
    }
  }
}
