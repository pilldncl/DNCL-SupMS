'use client'

import { useState, useEffect } from 'react'
import { StockService, SKUService, PartTypesService } from '@/lib/services'
import type { SKU, PartType } from '@/lib/types/supply'
import { SKUAutocomplete } from './SKUAutocomplete'
import { AddSKUModal } from './AddSKUModal'
import { useMobile } from '@/lib/hooks/useMobile'

interface QuickAddStockFormProps {
  onStockAdded: () => void
}

/**
 * Quick Add Stock Form - Simple form for adding stock quickly
 */
export function QuickAddStockForm({ onStockAdded }: QuickAddStockFormProps) {
  const isMobile = useMobile()
  const [selectedSKU, setSelectedSKU] = useState<SKU | null>(null)
  const [skuCode, setSkuCode] = useState('')
  const [partType, setPartType] = useState('')
  const [quantity, setQuantity] = useState('')
  const [threshold, setThreshold] = useState('5')
  const [partTypes, setPartTypes] = useState<PartType[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddSKUModal, setShowAddSKUModal] = useState(false)

  useEffect(() => {
    loadPartTypes()
  }, [])

  const loadPartTypes = async () => {
    try {
      const types = await PartTypesService.getActivePartTypes()
      setPartTypes(types)
    } catch (err) {
      console.error('Error loading part types:', err)
    }
  }

  const handleSKUSelect = (sku: SKU | null) => {
    setSelectedSKU(sku)
    if (sku) {
      setSkuCode(sku.sku_code || `SKU-${sku.id}`)
    } else {
      setSkuCode('')
    }
  }

  const handleSKUAdded = async (newSKU: SKU) => {
    setSelectedSKU(newSKU)
    setSkuCode(newSKU.sku_code || `SKU-${newSKU.id}`)
    setShowAddSKUModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedSKU) {
      setError('Please search and select a SKU')
      return
    }

    if (!partType) {
      setError('Please select a part type')
      return
    }

    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty < 0) {
      setError('Please enter a valid quantity (0 or greater)')
      return
    }

    setSubmitting(true)
    try {
      const thresh = threshold ? parseInt(threshold, 10) : 5
      await StockService.setStock(
        selectedSKU.id,
        partType.toUpperCase(),
        qty,
        isNaN(thresh) ? 5 : thresh,
        `Quick add: ${selectedSKU.sku_code || selectedSKU.id}`
      )

      setSuccess(`Stock added successfully!`)
      
      // Reset form
      setSelectedSKU(null)
      setSkuCode('')
      setPartType('')
      setQuantity('')
      setThreshold('5')
      
      // Refresh stock list
      onStockAdded()

      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stock')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        border: '1px solid #e5e7eb',
      }}>
        <h3 style={{
          margin: '0 0 1rem 0',
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#111827',
        }}>
          + Quick Add Stock
        </h3>

        {(error || success) && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: error ? '#fee' : '#e6ffed',
              color: error ? '#c00' : '#008000',
              borderRadius: '6px',
              marginBottom: '1rem',
              border: `1px solid ${error ? '#fcc' : '#b3e6cc'}`,
              fontSize: '0.875rem',
            }}
          >
            {error || success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '2fr 1.5fr 1fr 1fr auto',
            gap: '0.75rem',
            alignItems: 'end',
          }}>
            {/* SKU Search */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
              }}>
                SKU
              </label>
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <SKUAutocomplete
                    value={skuCode}
                    onChange={(value) => {
                      setSkuCode(value)
                      if (!value.trim()) {
                        setSelectedSKU(null)
                      }
                    }}
                    onSelect={handleSKUSelect}
                    selectedSKU={selectedSKU}
                    placeholder="Search SKU..."
                    disabled={submitting}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSKUModal(true)}
                  disabled={submitting}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    opacity: submitting ? 0.6 : 1,
                  }}
                  title="Add New SKU"
                >
                  + New
                </button>
              </div>
            </div>

            {/* Part Type */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
              }}>
                Part Type
              </label>
              <select
                value={partType}
                onChange={(e) => setPartType(e.target.value)}
                disabled={submitting || !selectedSKU}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  backgroundColor: selectedSKU ? 'white' : '#f3f4f6',
                }}
              >
                <option value="">Select...</option>
                {partTypes.map(pt => (
                  <option key={pt.name} value={pt.name}>{pt.display_name}</option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
              }}>
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                min="0"
                required
                disabled={submitting || !selectedSKU}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  backgroundColor: selectedSKU ? 'white' : '#f3f4f6',
                }}
              />
            </div>

            {/* Threshold */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
              }}>
                Threshold
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="5"
                min="0"
                disabled={submitting || !selectedSKU}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  backgroundColor: selectedSKU ? 'white' : '#f3f4f6',
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedSKU || !partType || !quantity}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: (!selectedSKU || !partType || !quantity) ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: (submitting || !selectedSKU || !partType || !quantity) ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>

      {/* Add SKU Modal */}
      {showAddSKUModal && (
        <AddSKUModal
          isOpen={showAddSKUModal}
          onClose={() => setShowAddSKUModal(false)}
          onSKUAdded={handleSKUAdded}
        />
      )}
    </>
  )
}

