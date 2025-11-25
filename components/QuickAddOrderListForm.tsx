'use client'

import { useState, useEffect } from 'react'
import { OrderListService, SKUService, PartTypesService } from '@/lib/services'
import type { SKU, PartType } from '@/lib/types/supply'
import { SKUAutocomplete } from './SKUAutocomplete'
import { AddPartTypeModal } from './AddPartTypeModal'
import { useMobile } from '@/lib/hooks/useMobile'

interface QuickAddOrderListFormProps {
  onItemAdded: () => void
}

/**
 * Quick Add Order List Form - Similar to QuickAddStockForm but for order list
 */
export function QuickAddOrderListForm({ onItemAdded }: QuickAddOrderListFormProps) {
  const isMobile = useMobile()
  
  // Form state
  const [selectedSKU, setSelectedSKU] = useState<SKU | null>(null)
  const [skuCode, setSkuCode] = useState('')
  const [partType, setPartType] = useState('')
  const [quantity, setQuantity] = useState('')
  const [partTypes, setPartTypes] = useState<PartType[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddPartTypeModal, setShowAddPartTypeModal] = useState(false)

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
      const parts: string[] = []
      if (sku.brand) parts.push(sku.brand)
      if (sku.model) parts.push(sku.model)
      if (sku.capacity) parts.push(sku.capacity)
      if (sku.color) parts.push(sku.color)
      
      let display = parts.length > 0 ? parts.join(' • ') : ''
      if (sku.sku_code) {
        display = display ? `${display} (${sku.sku_code})` : sku.sku_code
      }
      setSkuCode(display || `SKU ${sku.id}`)
    } else {
      setSkuCode('')
    }
  }

  const handlePartTypeAdded = (newPartType: PartType) => {
    setPartType(newPartType.name)
    loadPartTypes() // Refresh the list
  }

  const resetForm = () => {
    setSelectedSKU(null)
    setSkuCode('')
    setPartType('')
    setQuantity('')
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedSKU) {
      setError('Please select a SKU')
      return
    }

    if (!partType) {
      setError('Please select a Part Type')
      return
    }

    setSubmitting(true)
    try {
      const qty = quantity.trim() ? parseInt(quantity, 10) : undefined
      if (quantity.trim() && (isNaN(qty!) || qty! < 1)) {
        setError('Quantity must be a positive number')
        setSubmitting(false)
        return
      }

      await OrderListService.addItem(selectedSKU.id, partType, qty)
      setSuccess('Item added to order list successfully!')
      resetForm()
      onItemAdded()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to order list')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}>
        <h3 style={{ 
          margin: '0 0 1.25rem 0', 
          fontSize: '1.125rem', 
          fontWeight: '600',
          color: '#111827',
        }}>
          Quick Add to Order List
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
          {/* SKU Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
              SKU <span style={{ color: '#dc2626' }}>*</span>
            </label>
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
              placeholder="Search for SKU..."
              disabled={submitting}
            />
          </div>

          {/* Part Type Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
              Part Type <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              value={partType}
              onChange={(e) => {
                const value = e.target.value
                if (value === '__ADD_NEW__') {
                  setShowAddPartTypeModal(true)
                  setPartType('')
                } else {
                  setPartType(value)
                }
              }}
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
              <option value="__ADD_NEW__" style={{ 
                fontStyle: 'italic',
                color: '#0070f3',
                fontWeight: '500',
              }}>
                + Add New Part Type...
              </option>
            </select>
          </div>

          {/* Quantity (Optional) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
              Quantity (Optional)
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Leave empty if not specified"
              disabled={submitting}
              min="1"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={submitting || !selectedSKU || !partType}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: (submitting || !selectedSKU || !partType) ? '#9ca3af' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (submitting || !selectedSKU || !partType) ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                opacity: (submitting || !selectedSKU || !partType) ? 0.6 : 1,
              }}
            >
              {submitting ? 'Adding...' : 'Add to Order List'}
            </button>
          </div>
        </form>
      </div>

      {/* Add Part Type Modal */}
      {showAddPartTypeModal && (
        <AddPartTypeModal
          isOpen={showAddPartTypeModal}
          onClose={() => setShowAddPartTypeModal(false)}
          onPartTypeAdded={handlePartTypeAdded}
        />
      )}
    </>
  )
}

