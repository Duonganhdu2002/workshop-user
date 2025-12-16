import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export class ApiService {
  // Categories
  static async getAllCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  }

  // Products
  static async getAllProducts(limit?: number) {
    let query = supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  static async getProductsByCategory(categoryId: string, limit?: number) {
    let query = supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name
        )
      `)
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  static async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Utility functions
  static formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }
} 