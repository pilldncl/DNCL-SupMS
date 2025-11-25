'use client'

import { useState } from 'react'
import { DataService } from '@/lib/api/data-service'
import { BaseDataTransformer, TransformationConfig } from '@/lib/data-transformers'
import { DataDisplay } from '@/components'

/**
 * Example page demonstrating data transformation
 * 
 * This shows how to:
 * 1. Create a custom transformer
 * 2. Fetch raw data from Supabase
 * 3. Transform it into a different structure
 * 4. Display the transformed data
 */
export default function ExamplesPage() {
  const [rawData, setRawData] = useState<unknown[]>([])
  const [transformedData, setTransformedData] = useState<unknown[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Example: Create a transformer inline for demonstration
  const createExampleTransformer = () => {
    const config: TransformationConfig = {
      sourceTable: 'your_table_name',
      transformations: [
        {
          sourceField: 'id',
          targetField: 'id',
        },
        {
          sourceField: 'name',
          targetField: 'displayName',
        },
        {
          sourceField: 'created_at',
          targetField: 'formattedDate',
          transform: (value) => {
            if (!value) return 'N/A'
            try {
              return new Date(value as string).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            } catch {
              return String(value)
            }
          },
        },
      ],
    }
    return new BaseDataTransformer(config)
  }

  const fetchRaw = async () => {
    setLoading(true)
    setError(null)
    try {
      // Replace with your actual table name
      const data = await DataService.fetchRawData('your_table_name')
      setRawData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch raw data')
    } finally {
      setLoading(false)
    }
  }

  const fetchTransformed = async () => {
    setLoading(true)
    setError(null)
    try {
      const transformer = createExampleTransformer()
      // Replace with your actual table name
      const data = await DataService.fetchTransformedData(
        'your_table_name',
        transformer
      )
      setTransformedData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transform data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Data Transformation Examples</h1>
      
      <p style={{ marginTop: '1rem', color: '#666' }}>
        This page demonstrates how to fetch and transform Supabase data into 
        a different structure than the database schema.
      </p>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={fetchRaw}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Fetch Raw Data
        </button>
        
        <button
          onClick={fetchTransformed}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Fetch Transformed Data
        </button>
      </div>

      {error && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {rawData.length > 0 && (
        <DataDisplay 
          data={rawData} 
          title="Raw Data from Database"
        />
      )}

      {transformedData.length > 0 && (
        <DataDisplay 
          data={transformedData} 
          title="Transformed Data (Different Structure)"
        />
      )}
    </main>
  )
}

