export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          image_url: string
          price: number
          product_link: string
          category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          image_url: string
          price: number
          product_link: string
          category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          image_url?: string
          price?: number
          product_link?: string
          category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      seats: {
        Row: {
          seat_number: number
          status: 'available' | 'selected' | 'booked'
          registration_id: string | null
          selected_by: string | null
          selected_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          seat_number: number
          status?: 'available' | 'selected' | 'booked'
          registration_id?: string | null
          selected_by?: string | null
          selected_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          seat_number?: number
          status?: 'available' | 'selected' | 'booked'
          registration_id?: string | null
          selected_by?: string | null
          selected_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seats_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          }
        ]
      }
      registrations: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          workshop_date: string | null
          payment_status: 'pending' | 'verified' | 'sent'
          qr_code: string | null
          seat_number: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          workshop_date?: string | null
          payment_status?: 'pending' | 'verified' | 'sent'
          qr_code?: string | null
          seat_number?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          workshop_date?: string | null
          payment_status?: 'pending' | 'verified' | 'sent'
          qr_code?: string | null
          seat_number?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 