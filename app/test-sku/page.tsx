'use client'

import { useState } from 'react'
import { SKUService } from '@/lib/services'

/**
 * Test page to verify SKU data fetching from sku_master table
 */
export default function TestSKUPage() {
  const [skus, setSKUs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSKUs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await SKUService.getAllSKUs('sku_master')
      setSKUs(data.slice(0, 20)) // Show first 20
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch SKUs')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>SKU Connection Test</h1>
      <p>Testing connection to sku_master table</p>

      <button
        onClick={fetchSKUs}
        disabled={loading}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          marginTop: '1rem',
        }}
      >
        {loading ? 'Loading...' : 'Fetch SKUs from sku_master'}
      </button>

      {error && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '4px'
        }}>
          Error: {error}
        </div>
      )}

      {skus.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>SKUs Found ({skus.length} shown)</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>SKU Code</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Brand</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Model</th>
              </tr>
            </thead>
            <tbody>
              {skus.map((sku) => (
                <tr key={sku.id}>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{sku.id}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{sku.sku_code}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{sku.brand}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{sku.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

