import { supabase } from '../supabase/client'
import type { PartType } from '../types/supply'

/**
 * Service for managing part types (SCREEN, COVER, RING, BAND, etc.)
 */
export class PartTypesService {
  /**
   * Get all active part types
   */
  static async getActivePartTypes(): Promise<PartType[]> {
    try {
      const { data, error } = await supabase
        .from('supply_order_part_types')
        .select('*')
        .eq('is_active', true)
        .order('display_name', { ascending: true })

      if (error) {
        console.error('Error fetching part types:', error)
        throw error
      }

      return (data || []) as PartType[]
    } catch (error) {
      console.error('Error in getActivePartTypes:', error)
      throw error
    }
  }

  /**
   * Get all part types (including inactive)
   */
  static async getAllPartTypes(): Promise<PartType[]> {
    try {
      const { data, error } = await supabase
        .from('supply_order_part_types')
        .select('*')
        .order('display_name', { ascending: true })

      if (error) {
        console.error('Error fetching all part types:', error)
        throw error
      }

      return (data || []) as PartType[]
    } catch (error) {
      console.error('Error in getAllPartTypes:', error)
      throw error
    }
  }

  /**
   * Add a new part type
   */
  static async addPartType(
    name: string,
    displayName: string
  ): Promise<PartType> {
    try {
      // Normalize name to uppercase
      const normalizedName = name.toUpperCase().trim()

      const { data, error } = await supabase
        .from('supply_order_part_types')
        .insert({
          name: normalizedName,
          display_name: displayName,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding part type:', error)
        throw error
      }

      return data as PartType
    } catch (error) {
      console.error('Error in addPartType:', error)
      throw error
    }
  }

  /**
   * Initialize default part types if they don't exist
   */
  static async initializeDefaultPartTypes(): Promise<void> {
    try {
      const defaults = [
        { name: 'SCREEN', display_name: 'Screen' },
        { name: 'COVER', display_name: 'Cover' },
        { name: 'RING', display_name: 'Ring' },
        { name: 'BAND', display_name: 'Band' },
      ]

      const existing = await this.getAllPartTypes()
      const existingNames = new Set(existing.map(pt => pt.name.toUpperCase()))

      for (const partType of defaults) {
        if (!existingNames.has(partType.name)) {
          await this.addPartType(partType.name, partType.display_name)
        }
      }
    } catch (error) {
      console.error('Error initializing default part types:', error)
      throw error
    }
  }
}

