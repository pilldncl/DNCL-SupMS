'use client'

import { useState, useEffect, useRef } from 'react'
import type { OrderListItem } from '@/lib/types/supply'

interface EditOrderItemModalProps {
  isOpen: boolean
  onClose: () => void
  orderItem: OrderListItem | null
  onUpdate: (itemId: string, quantity?: number, ordered?: boolean) => Promise<void>
}

/**
 * Modal to edit order list item quantity
 */
export function EditOrderItemModal({ 
  isOpen, 
  onClose, 
  orderItem,
  onUpdate 
}: EditOrderItemModalProps) {
  const [quantity, setQuantity] = useState<string>('')
  const [ordered, setOrdered] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const quantityInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && orderItem) {
      setQuantity(orderItem.quantity?.toString() || '')
      setOrdered(orderItem.ordered || false)
      setError(null)
      setTimeout(() => quantityInputRef.current?.focus(), 100)
    }
  }, [isOpen, orderItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!orderItem) return

    const qty = quantity.trim() ? parseInt(quantity, 10) : undefined
    if (quantity.trim() && (isNaN(qty!) || qty! < 1)) {
      setError('Quantity must be a positive number or leave empty')
      return
    }

    setSubmitting(true)
    try {
      await onUpdate(orderItem.id, qty, ordered)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, submitting, onClose])

  if (!isOpen || !orderItem) return null

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
          maxWidth: '450px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Edit Order Item</h2>
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

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>SKU</div>
          <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{skuName}</div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Part Type</div>
          <div style={{ fontSize: '1rem', fontWeight: '500', color: '#111827' }}>
            {orderItem.part_type_display || orderItem.part_type}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            cursor: submitting ? 'not-allowed' : 'pointer',
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
          }}>
            <input
              type="checkbox"
              checked={ordered}
              onChange={(e) => setOrdered(e.target.checked)}
              disabled={submitting}
              style={{
                width: '20px',
                height: '20px',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            />
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#111827', marginBottom: '0.25rem' }}>
                Mark as Ordered
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                {ordered ? 'Item will be marked as ordered' : 'Item will remain pending'}
              </div>
            </div>
          </label>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#fee',
              color: '#c00',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
              Quantity (Optional)
            </label>
            <input
              ref={quantityInputRef}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Leave empty if not specified"
              disabled={submitting}
              min="1"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.95rem',
              }}
            />
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', margin: 0 }}>
              Enter the quantity ordered, or leave empty if not specified
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
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
              {submitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

