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

export type OrderStatus = 'PENDING' | 'ORDERED' | 'SHIPPING' | 'RECEIVED' | 'STOCK_ADDED'

// Status order for sequential progression
export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  'PENDING',
  'ORDERED', 
  'SHIPPING',
  'RECEIVED',
  'STOCK_ADDED'
]

// Get next status in sequence
export function getNextStatus(current: OrderStatus): OrderStatus | null {
  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(current)
  if (currentIndex === -1 || currentIndex >= ORDER_STATUS_SEQUENCE.length - 1) {
    return null
  }
  return ORDER_STATUS_SEQUENCE[currentIndex + 1]
}

// Get previous status in sequence
export function getPreviousStatus(current: OrderStatus): OrderStatus | null {
  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(current)
  if (currentIndex <= 0) {
    return null
  }
  return ORDER_STATUS_SEQUENCE[currentIndex - 1]
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
  ordered: boolean // Legacy field, kept for backward compatibility
  ordered_by?: string | null
  ordered_by_name?: string | null
  ordered_at?: string | null
  week_cycle_id: string
  // New status workflow fields
  status?: OrderStatus
  tracking_number?: string | null
  tracking_url?: string | null
  shipping_at?: string | null
  received_at?: string | null
  stock_added_at?: string | null
  stock_added_by?: string | null
  stock_quantity_added?: number | null
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
  tracking_number?: string | null
  created_at?: string
  is_low_stock?: boolean // Calculated field
}

export interface StockUpdate {
  sku_id: number
  part_type: string
  quantity_change: number // Positive for adding, negative for removing
  notes?: string
}

export interface StockTransaction {
  id: string
  stock_id: string
  sku_id: number
  sku?: SKU // Populated when fetching with join
  part_type: string
  part_type_display?: string // Populated from part_types table
  quantity: number // The quantity set/added in this transaction
  quantity_before?: number | null // Previous quantity before this transaction
  quantity_after: number // New quantity after this transaction
  tracking_number?: string | null // Tracking number for this specific transaction
  notes?: string | null // Notes for this specific transaction
  transaction_type: 'SET' | 'ADD' | 'SUBTRACT' // Type of transaction
  source?: 'QUICK_ADD' | 'UPDATE_MODAL' | 'BULK_ENTRY' | 'ORDER_RECEIVED' | 'MANUAL' | null // Source of transaction
  created_at: string
  created_by?: string | null // User who created this transaction
}

export interface DailyTransactionReport {
  date: string
  transactions: StockTransaction[]
  summary: {
    totalTransactions: number
    totalAdded: number
    totalSubtracted: number
    totalSet: number
    bySource: Record<string, number>
    byType: Record<string, number>
    uniqueSKUs: number
    uniquePartTypes: number
  }
}

