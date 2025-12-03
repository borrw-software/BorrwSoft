export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assets: {
        Row: {
          asset_id: string
          asset_type: string | null
          brand: string | null
          category: Database["public"]["Enums"]["asset_category"]
          colour: string | null
          condition: Database["public"]["Enums"]["asset_condition"] | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          last_inspection_date: string | null
          location: string | null
          model_make: string | null
          model_name: string | null
          model_year: number | null
          name: string
          notes: string | null
          organisation_id: string
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          status: Database["public"]["Enums"]["asset_status"]
          updated_at: string
          warranty_expiration_date: string | null
        }
        Insert: {
          asset_id: string
          asset_type?: string | null
          brand?: string | null
          category: Database["public"]["Enums"]["asset_category"]
          colour?: string | null
          condition?: Database["public"]["Enums"]["asset_condition"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          last_inspection_date?: string | null
          location?: string | null
          model_make?: string | null
          model_name?: string | null
          model_year?: number | null
          name: string
          notes?: string | null
          organisation_id: string
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
          warranty_expiration_date?: string | null
        }
        Update: {
          asset_id?: string
          asset_type?: string | null
          brand?: string | null
          category?: Database["public"]["Enums"]["asset_category"]
          colour?: string | null
          condition?: Database["public"]["Enums"]["asset_condition"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          last_inspection_date?: string | null
          location?: string | null
          model_make?: string | null
          model_name?: string | null
          model_year?: number | null
          name?: string
          notes?: string | null
          organisation_id?: string
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
          warranty_expiration_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          organisation_id: string | null
          organisation_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          organisation_id?: string | null
          organisation_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          organisation_id?: string | null
          organisation_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      asset_summary: {
        Row: {
          available_count: number | null
          borrowed_count: number | null
          car_count: number | null
          damaged_count: number | null
          electronics_count: number | null
          equipment_count: number | null
          expired_warranty_count: number | null
          lost_count: number | null
          maintenance_count: number | null
          needs_repair_count: number | null
          organisation_id: string | null
          total_assets: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_asset_id: {
        Args: {
          p_category: Database["public"]["Enums"]["asset_category"]
          p_organisation_id: string
        }
        Returns: string
      }
    }
    Enums: {
      asset_category: "equipment" | "car" | "electronics"
      asset_condition: "excellent" | "good" | "fair" | "needs_repair"
      asset_status:
        | "available"
        | "borrowed"
        | "in_maintenance"
        | "lost"
        | "damaged"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Organisation = Database['public']['Tables']['organisations']['Row']
export type OrganisationInsert = Database['public']['Tables']['organisations']['Insert']
export type OrganisationUpdate = Database['public']['Tables']['organisations']['Update']

export type Asset = Database['public']['Tables']['assets']['Row']
export type AssetInsert = Database['public']['Tables']['assets']['Insert']
export type AssetUpdate = Database['public']['Tables']['assets']['Update']

export type AssetSummary = Database['public']['Views']['asset_summary']['Row']

// Enum types
export type AssetCategory = Database['public']['Enums']['asset_category']
export type AssetStatus = Database['public']['Enums']['asset_status']
export type AssetCondition = Database['public']['Enums']['asset_condition']

// Constants for dropdowns/selects
export const ASSET_CATEGORIES: AssetCategory[] = ['equipment', 'car', 'electronics']
export const ASSET_STATUSES: AssetStatus[] = ['available', 'borrowed', 'in_maintenance', 'lost', 'damaged']
export const ASSET_CONDITIONS: AssetCondition[] = ['excellent', 'good', 'fair', 'needs_repair']

// Display labels for enums
export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  equipment: 'Equipment',
  car: 'Car',
  electronics: 'Electronics'
}

export const STATUS_LABELS: Record<AssetStatus, string> = {
  available: 'Available',
  borrowed: 'Borrowed',
  in_maintenance: 'In Maintenance',
  lost: 'Lost',
  damaged: 'Damaged'
}

export const CONDITION_LABELS: Record<AssetCondition, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  needs_repair: 'Needs Repair'
}
