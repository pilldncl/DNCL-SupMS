import { supabase } from '../supabase/client'
import type { OrderListItem, SKU, PartType, WeekCycle, OrderListSummary, OrderStatus } from '../types/supply'

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
          status,
          tracking_number,
          tracking_url,
          shipping_at,
          received_at,
          stock_added_at,
          stock_added_by,
          stock_quantity_added,
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
      return (data || []).map((item: any) => {
        // Ensure status is properly set - use explicit status if available, otherwise derive from ordered
        const resolvedStatus = item.status || (item.ordered ? 'ORDERED' : 'PENDING')
        return {
          ...item,
          sku: item.sku || undefined,
          part_type_display: partTypeMap.get(item.part_type) || item.part_type,
          // Explicitly set status field
          status: resolvedStatus,
        } as OrderListItem
      })
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
          status: 'PENDING',
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
  static async markAsOrdered(itemId: string, userId?: string, trackingNumber?: string, trackingUrl?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('supply_order_items')
        .update({
          ordered: true,
          ordered_by: userId || null,
          ordered_at: new Date().toISOString(),
          status: 'ORDERED',
          tracking_number: trackingNumber || null,
          tracking_url: trackingUrl || null,
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
   * Update order status (workflow transitions)
   * Supports both forward and backward progression
   */
  static async updateStatus(
    itemId: string, 
    newStatus: OrderStatus, 
    userId?: string
  ): Promise<void> {
    try {
      const now = new Date().toISOString()
      const updateData: any = {
        status: newStatus,
      }

      // Update status-specific fields
      switch (newStatus) {
        case 'PENDING':
          // Reverting to pending - clear ordered fields
          updateData.ordered = false
          updateData.ordered_by = null
          updateData.ordered_at = null
          updateData.tracking_number = null
          updateData.tracking_url = null
          updateData.shipping_at = null
          updateData.received_at = null
          updateData.stock_added_at = null
          updateData.stock_added_by = null
          updateData.stock_quantity_added = null
          break
        case 'ORDERED':
          updateData.ordered = true
          updateData.ordered_by = userId || null
          updateData.ordered_at = now
          // Clear later stage fields if reverting
          updateData.shipping_at = null
          updateData.received_at = null
          updateData.stock_added_at = null
          updateData.stock_added_by = null
          updateData.stock_quantity_added = null
          break
        case 'SHIPPING':
          updateData.shipping_at = now
          // Ensure ordered is set
          updateData.ordered = true
          // Clear later stage fields if reverting
          updateData.received_at = null
          updateData.stock_added_at = null
          updateData.stock_added_by = null
          updateData.stock_quantity_added = null
          break
        case 'RECEIVED':
          updateData.received_at = now
          // Ensure previous stages are set
          updateData.ordered = true
          // Clear stock fields if reverting
          // If stock was added, we need to remove it from inventory
          const { data: currentItem } = await supabase
            .from('supply_order_items')
            .select('stock_quantity_added, sku_id, part_type')
            .eq('id', itemId)
            .single()
          
          if (currentItem?.stock_quantity_added && currentItem.stock_quantity_added > 0) {
            // Remove stock that was previously added
            const { StockService } = await import('./stock-service')
            await StockService.updateStock(
              currentItem.sku_id,
              currentItem.part_type,
              -currentItem.stock_quantity_added,
              `Reverted from STOCK_ADDED status - order ${itemId.substring(0, 8)}`,
              userId
            )
          }
          updateData.stock_added_at = null
          updateData.stock_added_by = null
          updateData.stock_quantity_added = null
          break
        case 'STOCK_ADDED':
          updateData.stock_added_at = now
          updateData.stock_added_by = userId || null
          // Ensure previous stages are set
          updateData.ordered = true
          break
      }

      const { error } = await supabase
        .from('supply_order_items')
        .update(updateData)
        .eq('id', itemId)

      if (error) {
        console.error('Error updating order status:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in updateStatus:', error)
      throw error
    }
  }

  /**
   * Mark as shipping
   */
  static async markAsShipping(itemId: string, userId?: string): Promise<void> {
    return this.updateStatus(itemId, 'SHIPPING', userId)
  }

  /**
   * Update tracking information for an order item
   */
  static async updateTracking(
    itemId: string,
    trackingNumber?: string,
    trackingUrl?: string
  ): Promise<void> {
    try {
      const updateData: any = {}
      if (trackingNumber !== undefined) {
        updateData.tracking_number = trackingNumber || null
      }
      if (trackingUrl !== undefined) {
        updateData.tracking_url = trackingUrl || null
      }

      const { error } = await supabase
        .from('supply_order_items')
        .update(updateData)
        .eq('id', itemId)

      if (error) {
        console.error('Error updating tracking:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in updateTracking:', error)
      throw error
    }
  }

  /**
   * Mark as received
   */
  static async markAsReceived(itemId: string, userId?: string): Promise<void> {
    return this.updateStatus(itemId, 'RECEIVED', userId)
  }

  /**
   * Add stock and mark as stock added
   */
  static async addStockAndComplete(
    itemId: string,
    quantity: number,
    userId?: string
  ): Promise<void> {
    try {
      // Get the order item
      const { data: orderItem, error: orderError } = await supabase
        .from('supply_order_items')
        .select('sku_id, part_type, quantity')
        .eq('id', itemId)
        .single()

      if (orderError || !orderItem) {
        throw new Error('Order item not found')
      }

      // Import StockService dynamically to avoid circular dependency
      const { StockService } = await import('./stock-service')
      
      // Add to stock
      await StockService.updateStock(
        orderItem.sku_id,
        orderItem.part_type,
        quantity,
        `Received from order ${itemId.substring(0, 8)}`,
        userId
      )

      // Update order status
      const now = new Date().toISOString()
      const { error: updateError } = await supabase
        .from('supply_order_items')
        .update({
          status: 'STOCK_ADDED',
          stock_added_at: now,
          stock_added_by: userId || null,
          stock_quantity_added: quantity,
        })
        .eq('id', itemId)

      if (updateError) {
        console.error('Error updating order status:', updateError)
        throw updateError
      }
    } catch (error) {
      console.error('Error in addStockAndComplete:', error)
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
          status: 'PENDING',
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
   * Update order list item quantity
   */
  static async updateItemQuantity(itemId: string, quantity?: number): Promise<OrderListItem> {
    try {
      const { data, error } = await supabase
        .from('supply_order_items')
        .update({
          quantity: quantity || null,
        })
        .eq('id', itemId)
        .select(`
          *,
          sku:sku_master!sku_id (*)
        `)
        .single()

      if (error) {
        console.error('Error updating item quantity:', error)
        throw error
      }

      // Fetch part type display name
      let partTypeDisplay = data.part_type
      if (data.part_type) {
        const { data: partTypeData } = await supabase
          .from('supply_order_part_types')
          .select('display_name')
          .eq('name', data.part_type)
          .single()
        
        partTypeDisplay = partTypeData?.display_name || data.part_type
      }

      return {
        ...data,
        sku: data.sku || undefined,
        part_type_display: partTypeDisplay,
      } as OrderListItem
    } catch (error) {
      console.error('Error in updateItemQuantity:', error)
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
      // Count by status for better accuracy
      const ordered_items = items.filter(item => {
        const status = item.status || (item.ordered ? 'ORDERED' : 'PENDING')
        return status === 'ORDERED' || status === 'SHIPPING' || status === 'RECEIVED'
      }).length
      const pending_items = items.filter(item => {
        const status = item.status || (item.ordered ? 'ORDERED' : 'PENDING')
        return status === 'PENDING'
      }).length

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

