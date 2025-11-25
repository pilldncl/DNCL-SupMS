'use client'

import { useState, useEffect, useRef } from 'react'
import type { SKU } from '@/lib/types/supply'
import { SKUService } from '@/lib/services'

interface AddSKUModalProps {
  isOpen: boolean
  onClose: () => void
  onSKUAdded: (sku: SKU) => void // Called when SKU is successfully added
  skuTableName?: string
}

export function AddSKUModal({ 
  isOpen, 
  onClose, 
  onSKUAdded,
  skuTableName = 'sku_master' 
}: AddSKUModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form fields
  const [skuCode, setSkuCode] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [capacity, setCapacity] = useState('')
  const [color, setColor] = useState('')
  const [carrier, setCarrier] = useState('')
  const [postFix, setPostFix] = useState('')
  const [deviceType, setDeviceType] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isActive, setIsActive] = useState(true)

  const skuCodeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Auto-focus SKU code input when modal opens
      setTimeout(() => skuCodeInputRef.current?.focus(), 100)
    } else {
      // Reset form when modal closes
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setSkuCode('')
    setBrand('')
    setModel('')
    setCapacity('')
    setColor('')
    setCarrier('')
    setPostFix('')
    setDeviceType('')
    setIsUnlocked(false)
    setIsActive(true)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!skuCode.trim()) {
      setError('SKU Code is required')
      return
    }

    setSubmitting(true)
    try {
      const newSKU = await SKUService.addSKU({
        sku_code: skuCode,
        brand: brand || undefined,
        model: model || undefined,
        capacity: capacity || undefined,
        color: color || undefined,
        carrier: carrier || undefined,
        post_fix: postFix || undefined,
        device_type: deviceType || undefined,
        is_unlocked: isUnlocked,
        is_active: isActive,
      }, skuTableName)

      // Notify parent component
      onSKUAdded(newSKU)
      
      // Reset and close
      resetForm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add SKU')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle ESC key to close modal
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

  if (!isOpen) return null

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
        zIndex: 2000, // Higher than AddItemModal
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Add New SKU</h2>
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

        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#fee',
              color: '#c00',
              borderRadius: '4px',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#c00',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0 0.5rem',
              }}
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Required Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
              SKU Code <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              ref={skuCodeInputRef}
              type="text"
              value={skuCode}
              onChange={(e) => setSkuCode(e.target.value.toUpperCase())}
              placeholder="e.g., IPH14-128-SG"
              required
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.95rem',
                textTransform: 'uppercase',
              }}
            />
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', margin: 0 }}>
              Unique identifier for this SKU
            </p>
          </div>

          {/* Brand and Model Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Apple"
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
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g., iPhone 14"
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
          </div>

          {/* Capacity, Color Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
                Capacity
              </label>
              <input
                type="text"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g., 128GB"
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
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
                Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g., Space Gray"
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
          </div>

          {/* Device Type and Post Fix Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
                Device Type
              </label>
              <input
                type="text"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                placeholder="e.g., Phone, Tablet"
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
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
                Post Fix
              </label>
              <input
                type="text"
                value={postFix}
                onChange={(e) => setPostFix(e.target.value)}
                placeholder="Optional suffix"
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
          </div>

          {/* Checkboxes */}
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: submitting ? 'not-allowed' : 'pointer' }}>
              <input
                type="checkbox"
                checked={isUnlocked}
                onChange={(e) => setIsUnlocked(e.target.checked)}
                disabled={submitting}
                style={{
                  marginRight: '0.5rem',
                  width: '18px',
                  height: '18px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              />
              <span style={{ fontWeight: '500' }}>Unlocked</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: submitting ? 'not-allowed' : 'pointer' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={submitting}
                style={{
                  marginRight: '0.5rem',
                  width: '18px',
                  height: '18px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              />
              <span style={{ fontWeight: '500' }}>Active</span>
            </label>
          </div>

          {/* Action Buttons */}
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
              disabled={submitting || !skuCode.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: (!skuCode.trim()) ? '#9ca3af' : '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (submitting || !skuCode.trim()) ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                opacity: (submitting || !skuCode.trim()) ? 0.6 : 1,
              }}
            >
              {submitting ? 'Adding...' : 'Add SKU'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

