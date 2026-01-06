'use client'

import { useState, useEffect } from 'react'
import type { StockItem } from '@/lib/types/supply'
import { StockService } from '@/lib/services'

interface UpdateNotesModalProps {
  isOpen: boolean
  onClose: () => void
  stockItem: StockItem
  onNotesUpdated: () => void
}

/**
 * Simple modal for quickly adding/editing notes without changing quantity
 */
export function UpdateNotesModal({ 
  isOpen, 
  onClose, 
  stockItem,
  onNotesUpdated
}: UpdateNotesModalProps) {
  const [notes, setNotes] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setNotes(stockItem.notes || '')
      setError(null)
    }
  }, [isOpen, stockItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      setSubmitting(true)
      
      // Update just the notes using unified method with existing values
      await StockService.addOrUpdateStock(
        stockItem.sku_id,
        stockItem.part_type,
        stockItem.quantity,
        'SET', // SET mode to preserve existing quantity
        'UPDATE_MODAL',
        {
          lowStockThreshold: stockItem.low_stock_threshold,
          notes: notes.trim() || undefined,
          trackingNumber: stockItem.tracking_number || undefined,
        }
      )

      onNotesUpdated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notes')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const skuName = stockItem.sku?.sku_code || 
    (stockItem.sku?.brand && stockItem.sku?.model 
      ? `${stockItem.sku.brand} ${stockItem.sku.model}` 
      : `SKU ${stockItem.sku_id}`)

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
            {stockItem.notes ? 'Edit' : 'Add'} Notes
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              color: '#666',
              padding: '0.25rem 0.5rem',
              lineHeight: 1,
              opacity: submitting ? 0.5 : 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Stock Item Info */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Stock Item
          </div>
          <div style={{ fontWeight: '600', color: '#111827' }}>
            {skuName} • {stockItem.part_type_display || stockItem.part_type}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Quantity: <strong style={{ color: '#111827' }}>{stockItem.quantity}</strong>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#fee',
              color: '#c00',
              borderRadius: '4px',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Received from order #123, damaged items removed, special handling required, etc."
              disabled={submitting}
              autoFocus
              rows={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', margin: 0 }}>
              Add notes about this stock item (e.g., condition, location, special instructions)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '0.95rem',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Saving...' : stockItem.notes ? 'Update Notes' : 'Add Notes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



