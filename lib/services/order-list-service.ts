import { supabase } from '../supabase/client'
import type { OrderListItem, SKU, PartType, WeekCycle, OrderListSummary } from '../types/supply'

/**
 * Service for managing the order list functionality
 */
export class OrderListService {
  /**
   * Get current active week cycle
   */
  static async getCurrentWeekCycle(): Promise<WeekCycle | null> {
    try {
      const { data, error } = await supabase
        .from('supply_order_week_cycles')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error) {
        // PGRST116 = no rows returned (not found)
        if (error.code === 'PGRST116') {
          // No active cycle exists, will create one below
        } else {
          console.error('Error fetching current week cycle:', error)
          throw new Error(`Failed to fetch week cycle: ${error.message}`)
        }
      }

      // If no active cycle exists, create one for current week
      if (!data) {
        return await this.createCurrentWeekCycle()
      }

      return data as WeekCycle
    } catch (error) {
      console.error('Error in getCurrentWeekCycle:', error)
      throw error
    }
  }

  /**
   * Create a week cycle for the current week
   */
  static async createCurrentWeekCycle(): Promise<WeekCycle> {
    try {
      const now = new Date()
      const year = now.getFullYear()
      const week = this.getWeekNumber(now)
      const weekId = `${year}-W${String(week).padStart(2, '0')}`
      
      const startOfWeek = this.getStartOfWeek(now)
      const endOfWeek = this.getEndOfWeek(now)

      // Deactivate all other cycles first
      await supabase
        .from('supply_order_week_cycles')
        .update({ is_active: false })
        .eq('is_active', true)

      const { data, error } = await supabase
        .from('supply_order_week_cycles')
        .insert({
          id: weekId,
          start_date: startOfWeek.toISOString().split('T')[0],
          end_date: endOfWeek.toISOString().split('T')[0],
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating week cycle:', error)
        throw error
      }

      return data as WeekCycle
    } catch (error) {
      console.error('Error in createCurrentWeekCycle:', error)
      throw error
    }
  }

  /**
   * Get all order list items for current week
   */
  static async getCurrentOrderList(): Promise<OrderListItem[]> {
    try {
      const weekCycle = await this.getCurrentWeekCycle()
      if (!weekCycle) {
        return []
      }

      const { data, error } = await supabase
        .from('supply_order_items')
        .select(`
          *,
          sku:sku_master!sku_id (*)
        `)
        .eq('week_cycle_id', weekCycle.id)
        .order('added_at', { ascending: false })

      if (error) {
        console.error('Error fetching order list:', error)
        throw error
      }

      // Fetch part type info separately and merge
      let partTypeMap = new Map<string, string>()
      if (data && data.length > 0) {
        const uniquePartTypes = Array.from(new Set(data.map((item: any) => item.part_type)))
        const { data: partTypesData } = await supabase
          .from('supply_order_part_types')
          .select('name, display_name')
          .in('name', uniquePartTypes)
        
        partTypeMap = new Map(
          (partTypesData || []).map(pt => [pt.name, pt.display_name])
        )
      }

      // Transform the data to match our type
      return (data || []).map((item: any) => ({
        ...item,
        sku: item.sku || undefined,
        part_type_display: partTypeMap.get(item.part_type) || item.part_type,
      })) as OrderListItem[]
    } catch (error) {
      console.error('Error in getCurrentOrderList:', error)
      throw error
    }
  }

  /**
   * Add item to order list
   */
  static async addItem(
    skuId: string | number,
    partType: string,
    quantity?: number,
    userId?: string
  ): Promise<OrderListItem> {
    try {
      const weekCycle = await this.getCurrentWeekCycle()
      if (!weekCycle) {
        throw new Error('No active week cycle found')
      }

      const { data, error } = await supabase
        .from('supply_order_items')
        .insert({
          sku_id: skuId,
          part_type: partType,
          quantity: quantity || null,
          added_by: userId || null,
          week_cycle_id: weekCycle.id,
          ordered: false,
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding item to order list:', error)
        throw error
      }

      return data as OrderListItem
    } catch (error) {
      console.error('Error in addItem:', error)
      throw error
    }
  }

  /**
   * Mark item as ordered
   */
  static async markAsOrdered(itemId: string, userId?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('supply_order_items')
        .update({
          ordered: true,
          ordered_by: userId || null,
          ordered_at: new Date().toISOString(),
        })
        .eq('id', itemId)

      if (error) {
        console.error('Error marking item as ordered:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in markAsOrdered:', error)
      throw error
    }
  }

  /**
   * Unmark item (remove from ordered status)
   */
  static async unmarkAsOrdered(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('supply_order_items')
        .update({
          ordered: false,
          ordered_by: null,
          ordered_at: null,
        })
        .eq('id', itemId)

      if (error) {
        console.error('Error unmarking item:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in unmarkAsOrdered:', error)
      throw error
    }
  }

  /**
   * Remove item from order list
   */
  static async removeItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('supply_order_items')
        .delete()
        .eq('id', itemId)

      if (error) {
        console.error('Error removing item:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in removeItem:', error)
      throw error
    }
  }

  /**
   * Reset current week's order list (clear all items)
   */
  static async resetCurrentWeek(): Promise<void> {
    try {
      const weekCycle = await this.getCurrentWeekCycle()
      if (!weekCycle) {
        throw new Error('No active week cycle found. Please refresh the page.')
      }

      const { error } = await supabase
        .from('supply_order_items')
        .delete()
        .eq('week_cycle_id', weekCycle.id)

      if (error) {
        console.error('Error resetting week:', error)
        throw new Error(`Failed to reset week: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in resetCurrentWeek:', error)
      throw error
    }
  }

  /**
   * Get summary statistics for current order list
   */
  static async getOrderListSummary(): Promise<OrderListSummary> {
    try {
      const items = await this.getCurrentOrderList()
      
      const total_items = items.length
      const ordered_items = items.filter(item => item.ordered).length
      const pending_items = total_items - ordered_items

      const items_by_part_type: Record<string, number> = {}
      items.forEach(item => {
        const partType = item.part_type_display || item.part_type
        items_by_part_type[partType] = (items_by_part_type[partType] || 0) + 1
      })

      return {
        total_items,
        ordered_items,
        pending_items,
        items_by_part_type,
        items_by_status: {
          ordered: ordered_items,
          pending: pending_items,
        },
      }
    } catch (error) {
      console.error('Error in getOrderListSummary:', error)
      throw error
    }
  }

  // Helper functions
  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  private static getStartOfWeek(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
  }

  private static getEndOfWeek(date: Date): Date {
    const start = this.getStartOfWeek(date)
    return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000) // Add 6 days
  }
}

