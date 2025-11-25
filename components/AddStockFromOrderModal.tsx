'use client'

import { useState } from 'react'
import type { OrderListItem } from '@/lib/types/supply'
import { StockService } from '@/lib/services'

interface AddStockFromOrderModalProps {
  isOpen: boolean
  onClose: () => void
  orderItem: OrderListItem
  onStockAdded: () => void
}

/**
 * Modal to add stock when an ordered item arrives
 */
export function AddStockFromOrderModal({ 
  isOpen, 
  onClose, 
  orderItem,
  onStockAdded
}: AddStockFromOrderModalProps) {
  const [quantity, setQuantity] = useState<string>((orderItem.quantity || 1).toString())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity (greater than 0)')
      return
    }

    setSubmitting(true)
    try {
      await StockService.updateStock(
        orderItem.sku_id,
        orderItem.part_type,
        qty,
        `Received from order - ${orderItem.id.substring(0, 8)}`
      )
      onStockAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stock')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const skuName = orderItem.sku?.sku_code || 
    (orderItem.sku?.brand && orderItem.sku?.model 
      ? `${orderItem.sku.brand} ${orderItem.sku.model}` 
      : `SKU ${orderItem.sku_id}`)

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
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600' }}>
          Add Stock - Order Received
        </h2>

        <div style={{
          padding: '1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Order Item
          </div>
          <div style={{ fontWeight: '600', color: '#111827' }}>
            {skuName} • {orderItem.part_type_display || orderItem.part_type}
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
              Quantity Received <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.95rem',
              }}
            />
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', margin: 0 }}>
              Enter the quantity received from this order
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
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Adding...' : 'Add to Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

