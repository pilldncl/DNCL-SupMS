/**
 * Types for data transformation layer
 * These represent the transformed/restructured data format
 * that differs from the raw Supabase database structure
 */

export interface TransformedData {
  // Define your transformed data structure here
  // This is different from the raw DB schema
  id: string
  [key: string]: unknown
}

export interface TransformationConfig {
  // Configuration for how to transform the data
  sourceTable: string
  transformations: TransformationRule[]
}

export interface TransformationRule {
  sourceField: string
  targetField: string
  transform?: (value: unknown) => unknown
}

