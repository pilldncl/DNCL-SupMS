import { supabase } from '../supabase/client'
import type { StockItem, StockUpdate, StockTransaction, SKU } from '../types/supply'

/**
 * Service for managing stock/inventory for parts/components
 */
export class StockService {
  /**
   * Get all stock items
   */
  static async getAllStock(): Promise<StockItem[]> {
    try {
      const { data, error } = await supabase
        .from('supply_order_stock')
        .select(`
          *,
          sku:sku_master!sku_id (*)
        `)
        .order('last_updated', { ascending: false })

      if (error) {
        console.error('Error fetching stock:', error)
        throw error
      }

      // Fetch part type info separately
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

      return (data || []).map((item: any) => {
        // Threshold is disabled if set to 999999 or higher
        const thresholdDisabled = item.low_stock_threshold >= 999999
        return {
          ...item,
          sku: item.sku || undefined,
          part_type_display: partTypeMap.get(item.part_type) || item.part_type,
          is_low_stock: thresholdDisabled ? false : item.quantity <= item.low_stock_threshold,
        }
      }) as StockItem[]
    } catch (error) {
      console.error('Error in getAllStock:', error)
      throw error
    }
  }

  /**
   * Get stock for a specific SKU + Part Type
   */
  static async getStockItem(skuId: number, partType: string): Promise<StockItem | null> {
    try {
      const { data, error } = await supabase
        .from('supply_order_stock')
        .select(`
          *,
          sku:sku_master!sku_id (*)
        `)
        .eq('sku_id', skuId)
        .eq('part_type', partType)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        console.error('Error fetching stock item:', error)
        throw error
      }

      // Get part type display name
      const { data: partTypeData } = await supabase
        .from('supply_order_part_types')
        .select('display_name')
        .eq('name', partType)
        .single()

      // Threshold is disabled if set to 999999 or higher
      const thresholdDisabled = data.low_stock_threshold >= 999999
      return {
        ...data,
        sku: data.sku || undefined,
        part_type_display: partTypeData?.display_name || partType,
        is_low_stock: thresholdDisabled ? false : data.quantity <= data.low_stock_threshold,
      } as StockItem
    } catch (error) {
      console.error('Error in getStockItem:', error)
      throw error
    }
  }

  /**
   * Get low stock items (quantity <= threshold)
   */
  static async getLowStockItems(): Promise<StockItem[]> {
    try {
      const { data, error } = await supabase
        .from('supply_order_stock')
        .select(`
          *,
          sku:sku_master!sku_id (*)
        `)
        .order('quantity', { ascending: true })

      if (error) {
        console.error('Error fetching low stock items:', error)
        throw error
      }

      // Filter low stock items
      const lowStockItems = (data || []).filter((item: any) => 
        item.quantity <= item.low_stock_threshold
      )

      // Get part type display names
      if (lowStockItems.length > 0) {
        const uniquePartTypes = Array.from(new Set(lowStockItems.map((item: any) => item.part_type)))
        const { data: partTypesData } = await supabase
          .from('supply_order_part_types')
          .select('name, display_name')
          .in('name', uniquePartTypes)
        
        const partTypeMap = new Map(
          (partTypesData || []).map(pt => [pt.name, pt.display_name])
        )

        return lowStockItems.map((item: any) => ({
          ...item,
          sku: item.sku || undefined,
          part_type_display: partTypeMap.get(item.part_type) || item.part_type,
          is_low_stock: true,
        })) as StockItem[]
      }

      return []
    } catch (error) {
      console.error('Error in getLowStockItems:', error)
      throw error
    }
  }

  /**
   * Unified method to add or update stock with flexible mode
   * All forms should use this method for consistent transaction tracking
   * 
   * @param mode - 'ADD' to add to existing quantity, 'SET' to set absolute quantity
   * @param source - Where the transaction came from (for audit trail)
   */
  static async addOrUpdateStock(
    skuId: number,
    partType: string,
    quantity: number,
    mode: 'ADD' | 'SET' = 'ADD',
    source: 'QUICK_ADD' | 'UPDATE_MODAL' | 'BULK_ENTRY' | 'ORDER_RECEIVED' | 'MANUAL' = 'MANUAL',
    options?: {
      lowStockThreshold?: number
      notes?: string
      userId?: string
      trackingNumber?: string
    }
  ): Promise<StockItem> {
    try {
      // Input validation
      if (!skuId || skuId <= 0) {
        throw new Error('Invalid SKU ID')
      }
      if (!partType || partType.trim() === '') {
        throw new Error('Part type is required')
      }
      if (isNaN(quantity)) {
        throw new Error('Quantity must be a valid number')
      }

      const existing = await this.getStockItem(skuId, partType)
      const quantityBefore = existing?.quantity ?? 0
      
      // Calculate new quantity based on mode
      let newQuantity: number
      let transactionQuantity: number
      let transactionType: 'SET' | 'ADD' | 'SUBTRACT'
      
      if (mode === 'SET') {
        // SET mode: Use quantity as absolute value
        newQuantity = Math.max(0, quantity)
        transactionQuantity = newQuantity
        transactionType = 'SET'
      } else {
        // ADD mode: Add quantity to existing
        newQuantity = Math.max(0, quantityBefore + quantity)
        transactionQuantity = Math.abs(quantity)
        transactionType = quantity >= 0 ? 'ADD' : 'SUBTRACT'
      }

      if (existing) {
        // Update existing stock
        const { data, error } = await supabase
          .from('supply_order_stock')
          .update({
            quantity: newQuantity,
            low_stock_threshold: options?.lowStockThreshold ?? existing.low_stock_threshold,
            last_updated: new Date().toISOString(),
            updated_by: options?.userId || null,
            notes: options?.notes ?? existing.notes ?? null,
            tracking_number: options?.trackingNumber !== undefined 
              ? (options.trackingNumber || null) 
              : existing.tracking_number,
          })
          .eq('sku_id', skuId)
          .eq('part_type', partType)
          .select(`
            *,
            sku:sku_master!sku_id (*)
          `)
          .single()

        if (error) {
          console.error('Error updating stock:', error)
          throw error
        }

        // Create transaction history entry
        const { error: transactionError } = await supabase
          .from('supply_order_stock_transactions')
          .insert({
            stock_id: data.id,
            sku_id: skuId,
            part_type: partType,
            quantity: transactionQuantity,
            quantity_before: quantityBefore,
            quantity_after: newQuantity,
            tracking_number: options?.trackingNumber || null,
            notes: options?.notes || null,
            transaction_type: transactionType,
            source: source,
            created_by: options?.userId || null,
          })

        if (transactionError) {
          console.error('Error creating transaction history:', transactionError)
          // Don't throw - stock was updated successfully, transaction history is secondary
          // Log error for monitoring but don't fail the operation
        }

        // Get part type display name
        const { data: partTypeData } = await supabase
          .from('supply_order_part_types')
          .select('display_name')
          .eq('name', partType)
          .single()

        // Threshold is disabled if set to 999999 or higher
        const thresholdDisabled = data.low_stock_threshold >= 999999
        return {
          ...data,
          sku: data.sku || undefined,
          part_type_display: partTypeData?.display_name || partType,
          is_low_stock: thresholdDisabled ? false : data.quantity <= data.low_stock_threshold,
        } as StockItem
      } else {
        // Create new stock item
        if (mode === 'ADD' && quantity < 0) {
          throw new Error('Cannot remove stock from non-existent item')
        }

        const finalQuantity = Math.max(0, quantity) // Both modes use quantity as-is for new items

        const { data, error } = await supabase
          .from('supply_order_stock')
          .insert({
            sku_id: skuId,
            part_type: partType,
            quantity: finalQuantity,
            low_stock_threshold: options?.lowStockThreshold ?? 5,
            last_updated: new Date().toISOString(),
            updated_by: options?.userId || null,
            notes: options?.notes || null,
            tracking_number: options?.trackingNumber || null,
          })
          .select(`
            *,
            sku:sku_master!sku_id (*)
          `)
          .single()

        if (error) {
          console.error('Error creating stock item:', error)
          throw error
        }

        // Create transaction history entry for new stock
        const { error: transactionError } = await supabase
          .from('supply_order_stock_transactions')
          .insert({
            stock_id: data.id,
            sku_id: skuId,
            part_type: partType,
            quantity: finalQuantity,
            quantity_before: 0,
            quantity_after: finalQuantity,
            tracking_number: options?.trackingNumber || null,
            notes: options?.notes || null,
            transaction_type: 'ADD',
            source: source,
            created_by: options?.userId || null,
          })

        if (transactionError) {
          console.error('Error creating transaction history:', transactionError)
          // Don't throw - stock was created successfully, transaction history is secondary
        }

        // Get part type display name
        const { data: partTypeData } = await supabase
          .from('supply_order_part_types')
          .select('display_name')
          .eq('name', partType)
          .single()

        // Threshold is disabled if set to 999999 or higher
        const thresholdDisabled = data.low_stock_threshold >= 999999
        return {
          ...data,
          sku: data.sku || undefined,
          part_type_display: partTypeData?.display_name || partType,
          is_low_stock: thresholdDisabled ? false : data.quantity <= data.low_stock_threshold,
        } as StockItem
      }
    } catch (error) {
      console.error('Error in addOrUpdateStock:', error)
      throw error
    }
  }

  /**
   * Update stock (add or remove quantity) - Legacy method, use addOrUpdateStock instead
   * Creates a transaction history entry for each update
   */
  static async updateStock(
    skuId: number,
    partType: string,
    quantityChange: number,
    notes?: string,
    userId?: string
  ): Promise<StockItem> {
    try {
      // Check if stock item exists
      const existing = await this.getStockItem(skuId, partType)

      if (existing) {
        // Update existing stock
        const quantityBefore = existing.quantity
        const newQuantity = Math.max(0, existing.quantity + quantityChange) // Don't go below 0
        const transactionType = quantityChange >= 0 ? 'ADD' : 'SUBTRACT'

        const { data, error } = await supabase
          .from('supply_order_stock')
          .update({
            quantity: newQuantity,
            last_updated: new Date().toISOString(),
            updated_by: userId || null,
            notes: notes || existing.notes || null,
          })
          .eq('sku_id', skuId)
          .eq('part_type', partType)
          .select(`
            *,
            sku:sku_master!sku_id (*)
          `)
          .single()

        if (error) {
          console.error('Error updating stock:', error)
          throw error
        }

        // Create transaction history entry
        await supabase
          .from('supply_order_stock_transactions')
          .insert({
            stock_id: data.id,
            sku_id: skuId,
            part_type: partType,
            quantity: Math.abs(quantityChange),
            quantity_before: quantityBefore,
            quantity_after: newQuantity,
            tracking_number: null,
            notes: notes || null,
            transaction_type: transactionType,
            created_by: userId || null,
          })

        // Get part type display name
        const { data: partTypeData } = await supabase
          .from('supply_order_part_types')
          .select('display_name')
          .eq('name', partType)
          .single()

        // Threshold is disabled if set to 999999 or higher
        const thresholdDisabled = data.low_stock_threshold >= 999999
        return {
          ...data,
          sku: data.sku || undefined,
          part_type_display: partTypeData?.display_name || partType,
          is_low_stock: thresholdDisabled ? false : data.quantity <= data.low_stock_threshold,
        } as StockItem
      } else {
        // Create new stock item
        if (quantityChange < 0) {
          throw new Error('Cannot remove stock from non-existent item')
        }

        const { data, error } = await supabase
          .from('supply_order_stock')
          .insert({
            sku_id: skuId,
            part_type: partType,
            quantity: quantityChange,
            last_updated: new Date().toISOString(),
            updated_by: userId || null,
            notes: notes || null,
          })
          .select(`
            *,
            sku:sku_master!sku_id (*)
          `)
          .single()

        if (error) {
          console.error('Error creating stock item:', error)
          throw error
        }

        // Create transaction history entry for new stock
        await supabase
          .from('supply_order_stock_transactions')
          .insert({
            stock_id: data.id,
            sku_id: skuId,
            part_type: partType,
            quantity: quantityChange,
            quantity_before: 0,
            quantity_after: quantityChange,
            tracking_number: null,
            notes: notes || null,
            transaction_type: 'ADD',
            created_by: userId || null,
          })

        // Get part type display name
        const { data: partTypeData } = await supabase
          .from('supply_order_part_types')
          .select('display_name')
          .eq('name', partType)
          .single()

        // Threshold is disabled if set to 999999 or higher
        const thresholdDisabled = data.low_stock_threshold >= 999999
        return {
          ...data,
          sku: data.sku || undefined,
          part_type_display: partTypeData?.display_name || partType,
          is_low_stock: thresholdDisabled ? false : data.quantity <= data.low_stock_threshold,
        } as StockItem
      }
    } catch (error) {
      console.error('Error in updateStock:', error)
      throw error
    }
  }

  /**
   * Set absolute stock quantity (instead of relative change) - Legacy wrapper
   * Use addOrUpdateStock with mode='SET' instead for consistency
   * Creates a transaction history entry for each update
   */
  static async setStock(
    skuId: number,
    partType: string,
    quantity: number,
    lowStockThreshold?: number,
    notes?: string,
    userId?: string,
    trackingNumber?: string
  ): Promise<StockItem> {
    // Delegate to unified method for consistency
    return this.addOrUpdateStock(
      skuId,
      partType,
      quantity,
      'SET',
      'MANUAL',
      {
        lowStockThreshold,
        notes,
        userId,
        trackingNumber,
      }
    )
  }

  /**
   * Update stock when orders arrive (bulk update from order list)
   */
  static async updateStockFromOrder(orderItemId: string, userId?: string): Promise<void> {
    try {
      // Get the order item
      const { data: orderItem, error: orderError } = await supabase
        .from('supply_order_items')
        .select('sku_id, part_type, quantity')
        .eq('id', orderItemId)
        .single()

      if (orderError || !orderItem) {
        throw new Error('Order item not found')
      }

      // Update stock (add quantity when order arrives) using unified method
      const quantity = orderItem.quantity || 1
      await this.addOrUpdateStock(
        orderItem.sku_id,
        orderItem.part_type,
        quantity,
        'ADD', // ADD mode - add received quantity to existing stock
        'ORDER_RECEIVED',
        {
          notes: `Received from order ${orderItemId}`,
          userId,
        }
      )
    } catch (error) {
      console.error('Error updating stock from order:', error)
      throw error
    }
  }

  /**
   * Get stock summary statistics
   */
  static async getStockSummary(): Promise<{
    total_items: number
    low_stock_count: number
    out_of_stock_count: number
    total_value?: number
  }> {
    try {
      const allStock = await this.getAllStock()
      
      return {
        total_items: allStock.length,
        low_stock_count: allStock.filter(item => item.is_low_stock && item.quantity > 0).length,
        out_of_stock_count: allStock.filter(item => item.quantity === 0).length,
      }
    } catch (error) {
      console.error('Error in getStockSummary:', error)
      throw error
    }
  }

  /**
   * Get latest arrivals (recently updated stock items)
   */
  static async getLatestArrivals(limit: number = 5): Promise<StockItem[]> {
    try {
      const { data, error } = await supabase
        .from('supply_order_stock')
        .select(`
          *,
          sku:sku_master!sku_id (*)
        `)
        .order('last_updated', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching latest arrivals:', error)
        throw error
      }

      // Fetch part type info separately
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

      return (data || []).map((item: any) => {
        // Threshold is disabled if set to 999999 or higher
        const thresholdDisabled = item.low_stock_threshold >= 999999
        return {
          ...item,
          sku: item.sku || undefined,
          part_type_display: partTypeMap.get(item.part_type) || item.part_type,
          is_low_stock: thresholdDisabled ? false : item.quantity <= item.low_stock_threshold,
        }
      }) as StockItem[]
    } catch (error) {
      console.error('Error in getLatestArrivals:', error)
      throw error
    }
  }

  /**
   * Get transaction history for a specific stock item
   */
  static async getStockTransactionHistory(
    skuId: number,
    partType: string,
    limit?: number
  ): Promise<StockTransaction[]> {
    try {
      let query = supabase
        .from('supply_order_stock_transactions')
        .select(`
          *,
          sku:sku_master!sku_id (*)
        `)
        .eq('sku_id', skuId)
        .eq('part_type', partType)
        .order('created_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching stock transaction history:', error)
        throw error
      }

      // Fetch part type display name
      const { data: partTypeData } = await supabase
        .from('supply_order_part_types')
        .select('display_name')
        .eq('name', partType)
        .single()

      return (data || []).map((item: any) => ({
        ...item,
        sku: item.sku || undefined,
        part_type_display: partTypeData?.display_name || partType,
      })) as StockTransaction[]
    } catch (error) {
      console.error('Error in getStockTransactionHistory:', error)
      throw error
    }
  }

  /**
   * Get all transaction history (across all stock items)
   */
  static async getAllTransactionHistory(limit?: number): Promise<StockTransaction[]> {
    try {
      let query = supabase
        .from('supply_order_stock_transactions')
        .select(`
          *,
          sku:sku_master!sku_id (*)
        `)
        .order('created_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching all transaction history:', error)
        throw error
      }

      // Fetch part type display names
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

      return (data || []).map((item: any) => ({
        ...item,
        sku: item.sku || undefined,
        part_type_display: partTypeMap.get(item.part_type) || item.part_type,
      })) as StockTransaction[]
    } catch (error) {
      console.error('Error in getAllTransactionHistory:', error)
      throw error
    }
  }

  /**
   * Get daily transaction report from pre-aggregated summary table
   * Falls back to calculating on-the-fly if summary doesn't exist
   */
  static async getDailyTransactionReport(targetDate?: Date): Promise<{
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
  } | null> {
    try {
      // First, try to get from pre-aggregated summary table
      const date = targetDate || new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      
      // Check if summary exists
      const { data: summaryData, error: summaryError } = await supabase
        .from('supply_order_daily_report_summary')
        .select('*')
        .eq('report_date', dateString)
        .single()
      
      if (!summaryError && summaryData) {
        console.log('[DailyReport] Using pre-aggregated summary for:', dateString)
        
        // Get transactions for the day
        const startOfDay = new Date(year, date.getMonth(), date.getDate(), 0, 0, 0, 0)
        const endOfDay = new Date(year, date.getMonth(), date.getDate(), 23, 59, 59, 999)
        
        const { data: transactions, error: transError } = await supabase
          .from('supply_order_stock_transactions')
          .select(`
            *,
            sku:sku_master!sku_id (*)
          `)
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString())
          .order('created_at', { ascending: false })
        
        if (transError) {
          console.error('[DailyReport] Error fetching transactions:', transError)
          throw transError
        }
        
        // Fetch part type display names
        let partTypeMap = new Map<string, string>()
        if (transactions && transactions.length > 0) {
          const uniquePartTypes = Array.from(new Set(transactions.map((item: any) => item.part_type)))
          const { data: partTypesData } = await supabase
            .from('supply_order_part_types')
            .select('name, display_name')
            .in('name', uniquePartTypes)
          
          partTypeMap = new Map(
            (partTypesData || []).map(pt => [pt.name, pt.display_name])
          )
        }
        
        const formattedTransactions = (transactions || []).map((item: any) => ({
          ...item,
          sku: item.sku || undefined,
          part_type_display: partTypeMap.get(item.part_type) || item.part_type,
        })) as StockTransaction[]
        
        // Convert JSONB to Record
        const bySource = (summaryData.by_source as Record<string, number>) || {}
        const byType = (summaryData.by_type as Record<string, number>) || {}
        
        return {
          date: dateString,
          transactions: formattedTransactions,
          summary: {
            totalTransactions: summaryData.total_transactions || 0,
            totalAdded: summaryData.total_added || 0,
            totalSubtracted: summaryData.total_subtracted || 0,
            totalSet: summaryData.total_set_operations || 0,
            bySource,
            byType,
            uniqueSKUs: summaryData.unique_skus || 0,
            uniquePartTypes: summaryData.unique_part_types || 0,
          }
        }
      }
      
      // Fallback to on-the-fly calculation if summary doesn't exist
      console.log('[DailyReport] Summary not found, calculating on-the-fly for:', dateString)
      return await this.calculateDailyReportOnTheFly(targetDate)
    } catch (error) {
      console.error('[DailyReport] Error in getDailyTransactionReport:', error)
      // Fallback to on-the-fly calculation on error
      return await this.calculateDailyReportOnTheFly(targetDate)
    }
  }

  /**
   * Calculate daily report on-the-fly (fallback method)
   * This is used when pre-aggregated summary doesn't exist
   */
  private static async calculateDailyReportOnTheFly(targetDate?: Date): Promise<{
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
  } | null> {
    // Use the original calculation logic as fallback
    const date = targetDate || new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    
    const startOfDay = new Date(year, date.getMonth(), date.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(year, date.getMonth(), date.getDate(), 23, 59, 59, 999)

    console.log('[DailyReport] Calculating on-the-fly for:', {
      dateString,
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
    })

    const { data, error } = await supabase
      .from('supply_order_stock_transactions')
      .select(`
        *,
        sku:sku_master!sku_id (*)
      `)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[DailyReport] Database error:', error)
      throw new Error(`Database error: ${error.message || JSON.stringify(error)}`)
    }

    console.log('[DailyReport] Query result:', {
      dataLength: data?.length || 0,
      hasData: !!data,
    })

    if (!data || data.length === 0) {
      console.log('[DailyReport] No transactions found for date:', dateString)
      return null
    }

    // Fetch part type display names
    const uniquePartTypes = Array.from(new Set(data.map((item: any) => item.part_type)))
    const { data: partTypesData } = await supabase
      .from('supply_order_part_types')
      .select('name, display_name')
      .in('name', uniquePartTypes)
    
    const partTypeMap = new Map(
      (partTypesData || []).map(pt => [pt.name, pt.display_name])
    )

    const transactions = data.map((item: any) => ({
      ...item,
      sku: item.sku || undefined,
      part_type_display: partTypeMap.get(item.part_type) || item.part_type,
    })) as StockTransaction[]

    // Calculate summary statistics
    const summary = {
      totalTransactions: transactions.length,
      totalAdded: transactions
        .filter(t => t.transaction_type === 'ADD')
        .reduce((sum, t) => sum + t.quantity, 0),
      totalSubtracted: transactions
        .filter(t => t.transaction_type === 'SUBTRACT')
        .reduce((sum, t) => sum + t.quantity, 0),
      totalSet: transactions
        .filter(t => t.transaction_type === 'SET')
        .length,
      bySource: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      uniqueSKUs: new Set(transactions.map(t => t.sku_id)).size,
      uniquePartTypes: new Set(transactions.map(t => t.part_type)).size,
    }

    // Count by source
    transactions.forEach(t => {
      const source = t.source || 'MANUAL'
      summary.bySource[source] = (summary.bySource[source] || 0) + 1
    })

    // Count by type
    transactions.forEach(t => {
      summary.byType[t.transaction_type] = (summary.byType[t.transaction_type] || 0) + 1
    })

    return {
      date: dateString,
      transactions,
      summary,
    }
  }

  /**
   * Backfill daily report summaries for existing transactions
   * Call this once after migration to populate historical data
   */
  static async backfillDailyReports(startDate?: Date, endDate?: Date): Promise<number> {
    try {
      const start = startDate ? startDate.toISOString().split('T')[0] : null
      const end = endDate ? endDate.toISOString().split('T')[0] : null
      
      const { data, error } = await supabase.rpc('backfill_daily_reports', {
        start_date: start,
        end_date: end,
      })

      if (error) {
        console.error('[DailyReport] Error backfilling reports:', error)
        throw error
      }

      console.log('[DailyReport] Backfilled', data, 'daily reports')
      return data || 0
    } catch (error) {
      console.error('[DailyReport] Error in backfillDailyReports:', error)
      throw error
    }
  }

  /**
   * Get available dates that have transactions (for date picker)
   */
  static async getAvailableReportDates(limit: number = 30): Promise<string[]> {
    try {
      console.log('[DailyReport] Fetching available dates, limit:', limit)
      const { data, error } = await supabase
        .from('supply_order_stock_transactions')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(limit * 10) // Get more records to ensure we have enough unique dates

      if (error) {
        console.error('[DailyReport] Error fetching available report dates:', error)
        throw error
      }

      console.log('[DailyReport] Raw dates fetched:', data?.length || 0)

      // Extract unique dates
      const uniqueDates = new Set<string>()
      data?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0]
        uniqueDates.add(date)
      })

      const result = Array.from(uniqueDates)
        .sort((a, b) => b.localeCompare(a))
        .slice(0, limit)
      
      console.log('[DailyReport] Unique dates found:', result.length)
      return result
    } catch (error) {
      console.error('[DailyReport] Error in getAvailableReportDates:', error)
      throw error
    }
  }
}

