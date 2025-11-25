/**
 * Reusable component for displaying transformed data
 * Works with any data structure from the transformation layer
 */
interface DataDisplayProps {
  data: unknown[]
  loading?: boolean
  error?: string | null
  title?: string
}

export function DataDisplay({ 
  data, 
  loading = false, 
  error = null,
  title = 'Data' 
}: DataDisplayProps) {
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        padding: '1rem',
        backgroundColor: '#fee',
        color: '#c00',
        borderRadius: '4px',
        margin: '1rem 0'
      }}>
        <strong>Error:</strong> {error}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '1rem', color: '#666' }}>
        No data available
      </div>
    )
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>{title} ({data.length} items)</h2>
      
      <div style={{ 
        marginTop: '1rem',
        display: 'grid',
        gap: '1rem'
      }}>
        {data.map((item, index) => (
          <div
            key={index}
            style={{
              padding: '1rem',
              backgroundColor: '#f9f9f9',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <pre style={{ 
              margin: 0,
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {JSON.stringify(item, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}

