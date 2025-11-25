import { supabase } from '../supabase/client'
import { BaseDataTransformer, TransformationConfig } from '../data-transformers'

/**
 * Service layer for fetching and transforming data from Supabase
 * Handles data retrieval and applies transformations
 */
export class DataService {
  /**
   * Fetch raw data from Supabase table
   */
  static async fetchRawData(tableName: string): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')

      if (error) {
        console.error(`Error fetching data from ${tableName}:`, error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Data fetch error:', error)
      throw error
    }
  }

  /**
   * Fetch and transform data using a transformer
   */
  static async fetchTransformedData(
    tableName: string,
    transformer: BaseDataTransformer
  ): Promise<unknown[]> {
    try {
      const rawData = await this.fetchRawData(tableName)
      return transformer.transformRows(rawData)
    } catch (error) {
      console.error('Transformed data fetch error:', error)
      throw error
    }
  }

  /**
   * Fetch data from multiple tables and combine/transform
   */
  static async fetchCombinedData(
    configs: Array<{ table: string; transformer?: BaseDataTransformer }>
  ): Promise<unknown[]> {
    try {
      const results = await Promise.all(
        configs.map(async (config) => {
          const rawData = await this.fetchRawData(config.table)
          return config.transformer
            ? config.transformer.transformRows(rawData)
            : rawData
        })
      )

      // Combine results - override this method for custom combination logic
      return results.flat()
    } catch (error) {
      console.error('Combined data fetch error:', error)
      throw error
    }
  }
}

