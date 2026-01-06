'use client'

import { useState, useEffect, useRef } from 'react'
import type { StockItem, SKU, PartType } from '@/lib/types/supply'
import { StockService, SKUService, PartTypesService } from '@/lib/services'

interface UpdateStockModalProps {
  isOpen: boolean
  onClose: () => void
  stockItem: StockItem
  onStockUpdated: () => void
}

export function UpdateStockModal({ 
  isOpen, 
  onClose, 
  stockItem,
  onStockUpdated
}: UpdateStockModalProps) {
  const [mode, setMode] = useState<'add' | 'set'>('add') // 'add' = add/subtract, 'set' = set absolute value
  const [quantityChange, setQuantityChange] = useState<string>('')
  const [absoluteQuantity, setAbsoluteQuantity] = useState<string>('')
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('')
  const [trackingNumber, setTrackingNumber] = useState<string>('')
  const [trackingFormat, setTrackingFormat] = useState<'standard' | 'international' | 'custom'>('standard')
  const [customPrefix, setCustomPrefix] = useState<string>('')
  const [customSuffix, setCustomSuffix] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setAbsoluteQuantity(stockItem.quantity.toString())
      setLowStockThreshold(stockItem.low_stock_threshold.toString())
      const existing = stockItem.tracking_number || ''
      setTrackingNumber(existing)
      
      // Try to detect format from existing tracking number
      if (existing) {
        if (/^[A-Z]{2,4}\d+/.test(existing) || /^[A-Z]\d{10,}/.test(existing)) {
          setTrackingFormat('international')
        } else if (/^[A-Z0-9]{10,}$/.test(existing)) {
          setTrackingFormat('standard')
        } else {
          setTrackingFormat('custom')
        }
      } else {
        setTrackingFormat('standard')
      }
      
      setCustomPrefix('')
      setCustomSuffix('')
      setQuantityChange('')
      setNotes('')
      setError(null)
      setMode('add')
    }
  }, [isOpen, stockItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      setSubmitting(true)

      if (mode === 'add') {
        // Add/subtract mode
        const change = parseInt(quantityChange, 10)
        if (isNaN(change)) {
          setError('Please enter a valid quantity change')
          setSubmitting(false)
          return
        }

        await StockService.addOrUpdateStock(
          stockItem.sku_id,
          stockItem.part_type,
          change,
          'ADD', // ADD mode for incremental changes
          'UPDATE_MODAL',
          {
            notes: notes || undefined,
          }
        )
      } else {
        // Set absolute value mode
        const quantity = parseInt(absoluteQuantity, 10)
        const threshold = parseInt(lowStockThreshold, 10)

        if (isNaN(quantity) || quantity < 0) {
          setError('Please enter a valid quantity (0 or greater)')
          setSubmitting(false)
          return
        }

        if (isNaN(threshold) || threshold < 0) {
          setError('Please enter a valid low stock threshold (0 or greater)')
          setSubmitting(false)
          return
        }

        // Format tracking number based on selected format
        let finalTrackingNumber = trackingNumber.trim()
        if (finalTrackingNumber) {
          if (trackingFormat === 'custom') {
            if (customPrefix) finalTrackingNumber = `${customPrefix}${finalTrackingNumber}`
            if (customSuffix) finalTrackingNumber = `${finalTrackingNumber}${customSuffix}`
          } else if (trackingFormat === 'international') {
            finalTrackingNumber = finalTrackingNumber.toUpperCase()
          }
        }
        
        await StockService.addOrUpdateStock(
          stockItem.sku_id,
          stockItem.part_type,
          quantity,
          'SET', // SET mode for absolute quantity
          'UPDATE_MODAL',
          {
            lowStockThreshold: threshold,
            notes: notes || undefined,
            trackingNumber: finalTrackingNumber || undefined,
          }
        )
      }

      onStockUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock')
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
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Update Stock</h2>
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

        {/* Current Stock Info */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Current Stock
          </div>
          <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
            {skuName} • {stockItem.part_type_display || stockItem.part_type}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Quantity: <strong style={{ color: '#111827' }}>{stockItem.quantity}</strong> • 
            Threshold: <strong style={{ color: '#111827' }}>{stockItem.low_stock_threshold}</strong>
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

        {/* Mode Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => setMode('add')}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: `2px solid ${mode === 'add' ? '#0070f3' : '#e5e7eb'}`,
                borderRadius: '6px',
                backgroundColor: mode === 'add' ? '#eff6ff' : 'white',
                color: mode === 'add' ? '#0070f3' : '#111827',
                fontWeight: mode === 'add' ? '600' : '400',
                cursor: 'pointer',
              }}
            >
              Add/Subtract
            </button>
            <button
              type="button"
              onClick={() => setMode('set')}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: `2px solid ${mode === 'set' ? '#0070f3' : '#e5e7eb'}`,
                borderRadius: '6px',
                backgroundColor: mode === 'set' ? '#eff6ff' : 'white',
                color: mode === 'set' ? '#0070f3' : '#111827',
                fontWeight: mode === 'set' ? '600' : '400',
                cursor: 'pointer',
              }}
            >
              Set Quantity
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'add' ? (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
                Quantity Change <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                value={quantityChange}
                onChange={(e) => setQuantityChange(e.target.value)}
                placeholder="e.g., +10 to add, -5 to remove"
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
                Use positive numbers to add stock, negative to subtract
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                New quantity: <strong>{stockItem.quantity + (parseInt(quantityChange) || 0)}</strong>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
                  Quantity <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  value={absoluteQuantity}
                  onChange={(e) => setAbsoluteQuantity(e.target.value)}
                  min="0"
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
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  min="0"
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
                  Alert when stock falls below this number
                </p>
              </div>
            </>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
              Tracking Number <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '400' }}>(Optional)</span>
            </label>
            <select
              value={trackingFormat}
              onChange={(e) => setTrackingFormat(e.target.value as 'standard' | 'international' | 'custom')}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.875rem',
                marginBottom: '0.5rem',
                backgroundColor: 'white',
              }}
            >
              <option value="standard">Standard Tracking</option>
              <option value="international">International Waybill</option>
              <option value="custom">Custom Format</option>
            </select>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder={
                trackingFormat === 'international' 
                  ? 'e.g., AWB123456789' 
                  : trackingFormat === 'custom'
                  ? 'Custom format'
                  : 'e.g., 1Z999AA10123456784'
              }
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontFamily: 'monospace',
                textTransform: trackingFormat === 'international' ? 'uppercase' : 'none',
              }}
            />
            {trackingFormat === 'custom' && (
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value)}
                  placeholder="Prefix (optional)"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                  }}
                />
                <input
                  type="text"
                  value={customSuffix}
                  onChange={(e) => setCustomSuffix(e.target.value)}
                  placeholder="Suffix (optional)"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            )}
            {trackingFormat === 'international' && (
              <p style={{ fontSize: '0.85rem', color: '#0070f3', marginTop: '0.25rem', margin: 0 }}>
                💡 International waybill numbers will be automatically converted to uppercase
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Received from order #123, damaged items removed, etc."
              rows={3}
              disabled={submitting}
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
              {submitting ? 'Updating...' : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

