import { supabase } from '../supabase/client'
import type { SKU } from '../types/supply'

/**
 * Service for fetching SKU data from Supabase
 * Works with existing SKU table structure
 */
export class SKUService {
  /**
   * Get all SKUs from the database
   * Uses sku_master table
   */
  static async getAllSKUs(tableName: string = 'sku_master'): Promise<SKU[]> {
    try {
      // Supabase has a default limit of 1000 rows, so we need to fetch all pages
      let allSKUs: SKU[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('id', { ascending: true })
          .range(from, from + pageSize - 1)

        if (error) {
          console.error(`Error fetching SKUs from ${tableName}:`, error)
          throw error
        }

        if (data && data.length > 0) {
          allSKUs = [...allSKUs, ...(data as SKU[])]
          hasMore = data.length === pageSize
          from += pageSize
        } else {
          hasMore = false
        }
      }

      return allSKUs
    } catch (error) {
      console.error('Error in getAllSKUs:', error)
      throw error
    }
  }

  /**
   * Get a single SKU by ID
   */
  static async getSKUById(skuId: number, tableName: string = 'sku_master'): Promise<SKU | null> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', skuId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        console.error(`Error fetching SKU ${skuId}:`, error)
        throw error
      }

      return data as SKU
    } catch (error) {
      console.error('Error in getSKUById:', error)
      throw error
    }
  }

  /**
   * Search SKUs by code or name
   */
  static async searchSKUs(
    searchTerm: string,
    tableName: string = 'sku_master'
  ): Promise<SKU[]> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .or(`sku_code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .limit(50)

      if (error) {
        console.error(`Error searching SKUs:`, error)
        throw error
      }

      return (data || []) as SKU[]
    } catch (error) {
      console.error('Error in searchSKUs:', error)
      throw error
    }
  }

  /**
   * Get a SKU by its code
   */
  static async getSKUByCode(
    skuCode: string,
    tableName: string = 'sku_master'
  ): Promise<SKU | null> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('sku_code', skuCode.trim().toUpperCase())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        console.error(`Error fetching SKU by code ${skuCode}:`, error)
        throw error
      }

      return data as SKU
    } catch (error) {
      console.error('Error in getSKUByCode:', error)
      throw error
    }
  }

  /**
   * Add a new SKU to the database
   * @param skuData - SKU data (sku_code is required)
   * @returns Created SKU
   */
  static async addSKU(
    skuData: {
      sku_code: string // Required
      brand?: string
      model?: string
      capacity?: string
      color?: string
      carrier?: string
      post_fix?: string
      is_unlocked?: boolean
      is_active?: boolean
      device_type?: string
      [key: string]: unknown
    },
    tableName: string = 'sku_master'
  ): Promise<SKU> {
    try {
      if (!skuData.sku_code || !skuData.sku_code.trim()) {
        throw new Error('SKU code is required')
      }

      // Check if SKU code already exists
      const { data: existing } = await supabase
        .from(tableName)
        .select('id, sku_code')
        .eq('sku_code', skuData.sku_code.trim())
        .single()

      if (existing) {
        throw new Error(`SKU code "${skuData.sku_code}" already exists`)
      }

      const { data, error } = await supabase
        .from(tableName)
        .insert({
          sku_code: skuData.sku_code.trim(),
          brand: skuData.brand?.trim() || null,
          model: skuData.model?.trim() || null,
          capacity: skuData.capacity?.trim() || null,
          color: skuData.color?.trim() || null,
          carrier: skuData.carrier?.trim() || null,
          post_fix: skuData.post_fix?.trim() || null,
          is_unlocked: skuData.is_unlocked ?? false,
          is_active: skuData.is_active ?? true,
          device_type: skuData.device_type?.trim() || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding SKU:', error)
        throw new Error(`Failed to add SKU: ${error.message}`)
      }

      return data as SKU
    } catch (error) {
      console.error('Error in addSKU:', error)
      throw error
    }
  }
}

