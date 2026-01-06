'use client'

import { useState, useEffect } from 'react'
import type { StockItem } from '@/lib/types/supply'
import { StockService } from '@/lib/services'

interface UpdateTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  stockItem: StockItem
  onTrackingUpdated: () => void
}

/**
 * Simple modal for quickly adding/editing tracking numbers
 */
type TrackingFormat = 'standard' | 'international' | 'custom'

interface TrackingTemplate {
  format: TrackingFormat
  label: string
  placeholder: string
  description: string
  prefix?: string
  suffix?: string
}

const TRACKING_TEMPLATES: TrackingTemplate[] = [
  {
    format: 'standard',
    label: 'Standard Tracking',
    placeholder: 'e.g., 1Z999AA10123456784',
    description: 'Standard shipping tracking numbers (UPS, FedEx, USPS, etc.)'
  },
  {
    format: 'international',
    label: 'International Waybill',
    placeholder: 'e.g., AWB123456789 or C1234567890',
    description: 'International waybill numbers (may include letters and numbers)'
  },
  {
    format: 'custom',
    label: 'Custom Format',
    placeholder: 'Enter any tracking format',
    description: 'Custom tracking number format (any text/number combination)'
  }
]

export function UpdateTrackingModal({ 
  isOpen, 
  onClose, 
  stockItem,
  onTrackingUpdated
}: UpdateTrackingModalProps) {
  const [trackingNumber, setTrackingNumber] = useState<string>('')
  const [trackingFormat, setTrackingFormat] = useState<TrackingFormat>('standard')
  const [customPrefix, setCustomPrefix] = useState<string>('')
  const [customSuffix, setCustomSuffix] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
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
      setError(null)
    }
  }, [isOpen, stockItem])

  const formatTrackingNumber = (): string => {
    let formatted = trackingNumber.trim()
    
    if (!formatted) return ''
    
    // Apply prefix/suffix if custom format
    if (trackingFormat === 'custom') {
      if (customPrefix) formatted = `${customPrefix}${formatted}`
      if (customSuffix) formatted = `${formatted}${customSuffix}`
    }
    
    // For international waybills, ensure uppercase
    if (trackingFormat === 'international') {
      formatted = formatted.toUpperCase()
    }
    
    return formatted
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number')
      return
    }

    try {
      setSubmitting(true)
      
      const finalTrackingNumber = formatTrackingNumber()
      
      // Update just the tracking number using unified method with existing values
      await StockService.addOrUpdateStock(
        stockItem.sku_id,
        stockItem.part_type,
        stockItem.quantity,
        'SET', // SET mode to preserve existing quantity
        'UPDATE_MODAL',
        {
          lowStockThreshold: stockItem.low_stock_threshold,
          notes: stockItem.notes || undefined,
          trackingNumber: finalTrackingNumber || undefined,
        }
      )

      onTrackingUpdated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tracking number')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTemplate = TRACKING_TEMPLATES.find(t => t.format === trackingFormat) || TRACKING_TEMPLATES[0]

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
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
            {stockItem.tracking_number ? 'Edit' : 'Add'} Tracking Number
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
          {/* Format Selector */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
              Tracking Format
            </label>
            <select
              value={trackingFormat}
              onChange={(e) => setTrackingFormat(e.target.value as TrackingFormat)}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.95rem',
                backgroundColor: 'white',
              }}
            >
              {TRACKING_TEMPLATES.map(template => (
                <option key={template.format} value={template.format}>
                  {template.label}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', margin: 0 }}>
              {selectedTemplate.description}
            </p>
          </div>

          {/* Tracking Number Input */}
          <div style={{ marginBottom: trackingFormat === 'custom' ? '1rem' : '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
              Tracking Number <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '400' }}>*</span>
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder={selectedTemplate.placeholder}
              disabled={submitting}
              autoFocus
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
            {trackingFormat === 'international' && (
              <p style={{ fontSize: '0.85rem', color: '#0070f3', marginTop: '0.25rem', margin: 0 }}>
                💡 International waybill numbers will be automatically converted to uppercase
              </p>
            )}
          </div>

          {/* Custom Format Options */}
          {trackingFormat === 'custom' && (
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              backgroundColor: '#f9fafb', 
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                Custom Format Options (Optional)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value)}
                    placeholder="e.g., AWB-"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    Suffix
                  </label>
                  <input
                    type="text"
                    value={customSuffix}
                    onChange={(e) => setCustomSuffix(e.target.value)}
                    placeholder="e.g., -INTL"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>
              {(customPrefix || customSuffix) && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#eff6ff', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Preview:</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#0070f3', fontWeight: '500' }}>
                    {customPrefix}{trackingNumber || 'TRACKING'}{customSuffix}
                  </div>
                </div>
              )}
            </div>
          )}

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
              {submitting ? 'Saving...' : stockItem.tracking_number ? 'Update' : 'Add Tracking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

