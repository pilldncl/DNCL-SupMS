import { TransformedData, TransformationConfig, TransformationRule } from './types'

/**
 * Base transformer class for restructuring Supabase data
 * This allows data to be presented in a different format than the DB structure
 */
export class BaseDataTransformer {
  protected config: TransformationConfig

  constructor(config: TransformationConfig) {
    this.config = config
  }

  /**
   * Transform raw database row into restructured format
   */
  transformRow(rawData: Record<string, unknown>): TransformedData {
    const transformed: TransformedData = { id: String(rawData.id || '') }

    this.config.transformations.forEach((rule: TransformationRule) => {
      const sourceValue = rawData[rule.sourceField]
      const transformedValue = rule.transform
        ? rule.transform(sourceValue)
        : sourceValue
      
      transformed[rule.targetField] = transformedValue
    })

    return transformed
  }

  /**
   * Transform array of database rows
   */
  transformRows(rawData: Record<string, unknown>[]): TransformedData[] {
    return rawData.map((row) => this.transformRow(row))
  }

  /**
   * Transform and aggregate data from multiple sources
   */
  transformAggregate(
    sources: Record<string, unknown>[]
  ): TransformedData[] {
    // Override in child classes for custom aggregation logic
    return this.transformRows(sources)
  }
}

