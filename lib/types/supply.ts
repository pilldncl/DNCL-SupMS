/**
 * Type definitions for Supply Order Management System
 */

export interface SKU {
  id: number // integer in sku_master table
  sku_code?: string
  brand?: string
  model?: string
  capacity?: string
  color?: string
  carrier?: string
  post_fix?: string
  is_unlocked?: boolean
  is_active?: boolean
  device_type?: string
  [key: string]: unknown // Allow for additional DB fields
}

export interface PartType {
  id: string
  name: string // SCREEN, COVER, RING, BAND, etc.
  display_name: string
  created_at?: string
  is_active?: boolean
}

export interface OrderListItem {
  id: string
  sku_id: number // integer - references sku_master(id)
  sku?: SKU // Populated when fetching with join
  part_type: string
  part_type_display?: string // Populated from part_types table
  quantity?: number
  added_by: string
  added_by_name?: string // Populated from users
  added_at: string
  ordered: boolean
  ordered_by?: string | null
  ordered_by_name?: string | null
  ordered_at?: string | null
  week_cycle_id: string
}

export interface WeekCycle {
  id: string // Format: "2024-W01"
  start_date: string
  end_date: string
  is_active: boolean
  created_at?: string
}

export interface OrderListSummary {
  total_items: number
  ordered_items: number
  pending_items: number
  items_by_part_type: Record<string, number>
  items_by_status: {
    ordered: number
    pending: number
  }
}

export interface StockItem {
  id: string
  sku_id: number
  sku?: SKU // Populated when fetching with join
  part_type: string
  part_type_display?: string // Populated from part_types table
  quantity: number
  low_stock_threshold: number
  last_updated: string
  updated_by?: string | null
  notes?: string | null
  created_at?: string
  is_low_stock?: boolean // Calculated field
}

export interface StockUpdate {
  sku_id: number
  part_type: string
  quantity_change: number // Positive for adding, negative for removing
  notes?: string
}

