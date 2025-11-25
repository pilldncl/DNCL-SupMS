'use client'

import { useState, useEffect } from 'react'
import { SKUService } from '@/lib/services'
import type { SKU } from '@/lib/types/supply'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { useMobile } from '@/lib/hooks/useMobile'
import { AddSKUModal } from '@/components/AddSKUModal'

/**
 * SKU Browser Page - View all SKU data in the database
 */
export default function SKUBrowserPage() {
  const isMobile = useMobile()
  const [skus, setSKUs] = useState<SKU[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null) // null = all, true = active, false = inactive
  const [showAddSKUModal, setShowAddSKUModal] = useState(false)

  useEffect(() => {
    loadSKUs()
  }, [])

  const loadSKUs = async () => {
    setLoading(true)
    setError(null)
    try {
      const skuData = await SKUService.getAllSKUs()
      setSKUs(skuData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SKUs')
      console.error('Error loading SKUs:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter SKUs
  const filteredSKUs = skus.filter(sku => {
    // Filter by active status
    if (filterActive !== null && sku.is_active !== filterActive) {
      return false
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      const brand = (sku.brand || '').toLowerCase()
      const model = (sku.model || '').toLowerCase()
      const code = (sku.sku_code || '').toLowerCase()
      const capacity = (sku.capacity || '').toLowerCase()
      const color = (sku.color || '').toLowerCase()
      const deviceType = (sku.device_type || '').toLowerCase()
      
      return brand.includes(search) || 
             model.includes(search) || 
             code.includes(search) ||
             capacity.includes(search) ||
             color.includes(search) ||
             deviceType.includes(search)
    }
    
    return true
  })

  const activeCount = skus.filter(s => s.is_active).length
  const inactiveCount = skus.filter(s => !s.is_active).length

  const handleSKUAdded = async (newSKU: SKU) => {
    await loadSKUs() // Reload SKUs to show the new one
    setShowAddSKUModal(false)
  }

  return (
    <>
      <Sidebar />
      <TopBar />
      <main style={{ 
        marginLeft: isMobile ? '0' : '240px', 
        marginTop: '64px',
        padding: isMobile ? '1rem' : '2rem',
        backgroundColor: '#f9fafb',
        minHeight: 'calc(100vh - 64px)',
      }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: '1rem',
        }}>
          <div>
            <h1 style={{ 
              margin: '0 0 0.5rem 0',
              fontSize: isMobile ? '1.5rem' : '1.875rem',
              fontWeight: '700',
              color: '#111827',
            }}>
              SKU Database
            </h1>
            <p style={{ 
              margin: 0,
              color: '#6b7280', 
              fontSize: '0.95rem',
            }}>
              Browse and search all SKU records in the system
            </p>
          </div>
          <button
            onClick={() => setShowAddSKUModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}
          >
            + Add New SKU
          </button>
        </div>

        {/* Summary */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
              {skus.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Total SKUs
            </div>
          </div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
              {activeCount}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Active
            </div>
          </div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6b7280' }}>
              {inactiveCount}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Inactive
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fee',
              color: '#c00',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #fcc',
            }}
          >
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid #e5e7eb',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SKU code, brand, model, capacity, color..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[null, true, false].map((status) => (
              <button
                key={status === null ? 'all' : status ? 'active' : 'inactive'}
                onClick={() => setFilterActive(status)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: filterActive === status ? '#0070f3' : '#f3f4f6',
                  color: filterActive === status ? 'white' : '#111827',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: filterActive === status ? '600' : '500',
                  cursor: 'pointer',
                }}
              >
                {status === null ? 'All' : status ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>

        {/* SKU Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#6b7280' }}>Loading SKUs...</p>
          </div>
        ) : filteredSKUs.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '3rem',
            textAlign: 'center',
            border: '1px solid #e5e7eb',
          }}>
            <p style={{ color: '#6b7280', margin: 0 }}>
              {searchTerm ? 'No SKUs found matching your search.' : 'No SKUs in the database.'}
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>SKU Code</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Brand</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Model</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Capacity</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Color</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Device Type</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Unlocked</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSKUs.map((sku) => (
                    <tr 
                      key={sku.id}
                      style={{ 
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: sku.is_active ? 'white' : '#f9fafb',
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                        {sku.sku_code || `SKU-${sku.id}`}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {sku.brand || '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {sku.model || '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {sku.capacity || '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {sku.color || '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {sku.device_type || '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'center' }}>
                        {sku.is_unlocked ? (
                          <span style={{ color: '#10b981', fontWeight: '600' }}>Yes</span>
                        ) : (
                          <span style={{ color: '#6b7280' }}>No</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: sku.is_active ? '#ecfdf5' : '#f3f4f6',
                          color: sku.is_active ? '#10b981' : '#6b7280',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                        }}>
                          {sku.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add SKU Modal */}
        {showAddSKUModal && (
          <AddSKUModal
            isOpen={showAddSKUModal}
            onClose={() => setShowAddSKUModal(false)}
            onSKUAdded={handleSKUAdded}
          />
        )}
      </main>
    </>
  )
}

