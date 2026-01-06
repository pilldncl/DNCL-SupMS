'use client'

import { useState, useEffect, useRef } from 'react'
import { StockService, SKUService, PartTypesService } from '@/lib/services'
import type { SKU, PartType } from '@/lib/types/supply'
import { SKUAutocomplete } from './SKUAutocomplete'
import { AddPartTypeModal } from './AddPartTypeModal'
import { useMobile } from '@/lib/hooks/useMobile'

interface QuickAddStockFormProps {
  onStockAdded: () => void
}

/**
 * Quick Add Stock Form - Tabbed interface for adding stock or SKUs
 */
export function QuickAddStockForm({ onStockAdded }: QuickAddStockFormProps) {
  const isMobile = useMobile()
  const [activeTab, setActiveTab] = useState<'stock' | 'sku'>('stock')
  
  // Stock form state
  const [selectedSKU, setSelectedSKU] = useState<SKU | null>(null)
  const [skuCode, setSkuCode] = useState('')
  const [partType, setPartType] = useState('')
  const [quantity, setQuantity] = useState('')
  const [threshold, setThreshold] = useState('5')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingFormat, setTrackingFormat] = useState<'standard' | 'international' | 'custom'>('standard')
  const [customPrefix, setCustomPrefix] = useState('')
  const [customSuffix, setCustomSuffix] = useState('')
  const [partTypes, setPartTypes] = useState<PartType[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddPartTypeModal, setShowAddPartTypeModal] = useState(false)
  
  // SKU form state
  const [skuSubmitting, setSkuSubmitting] = useState(false)
  const [skuError, setSkuError] = useState<string | null>(null)
  const [skuSuccess, setSkuSuccess] = useState<string | null>(null)
  const [newSkuCode, setNewSkuCode] = useState('')
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
      // Use the formatted display string that SKUAutocomplete provides
      // This ensures consistency between what's displayed and what's stored
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

  const handleSKUAdded = async (newSKU: SKU) => {
    // Switch to stock tab and pre-fill the SKU
    setActiveTab('stock')
    setSelectedSKU(newSKU)
    const parts: string[] = []
    if (newSKU.brand) parts.push(newSKU.brand)
    if (newSKU.model) parts.push(newSKU.model)
    if (newSKU.capacity) parts.push(newSKU.capacity)
    if (newSKU.color) parts.push(newSKU.color)
    
    let display = parts.length > 0 ? parts.join(' • ') : ''
    if (newSKU.sku_code) {
      display = display ? `${display} (${newSKU.sku_code})` : newSKU.sku_code
    }
    setSkuCode(display || `SKU ${newSKU.id}`)
  }

  const resetSKUForm = () => {
    setNewSkuCode('')
    setBrand('')
    setModel('')
    setCapacity('')
    setColor('')
    setCarrier('')
    setPostFix('')
    setDeviceType('')
    setIsUnlocked(false)
    setIsActive(true)
    setSkuError(null)
    setSkuSuccess(null)
  }

  const handleSKUSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSkuError(null)
    setSkuSuccess(null)

    if (!newSkuCode.trim()) {
      setSkuError('SKU Code is required')
      return
    }

    setSkuSubmitting(true)
    try {
      const newSKU = await SKUService.addSKU({
        sku_code: newSkuCode,
        brand: brand || undefined,
        model: model || undefined,
        capacity: capacity || undefined,
        color: color || undefined,
        carrier: carrier || undefined,
        post_fix: postFix || undefined,
        device_type: deviceType || undefined,
        is_unlocked: isUnlocked,
        is_active: isActive,
      })

      setSkuSuccess('SKU added successfully!')
      handleSKUAdded(newSKU)
      resetSKUForm()
      
      setTimeout(() => setSkuSuccess(null), 2000)
    } catch (err) {
      setSkuError(err instanceof Error ? err.message : 'Failed to add SKU')
    } finally {
      setSkuSubmitting(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'sku' && skuCodeInputRef.current) {
      setTimeout(() => skuCodeInputRef.current?.focus(), 100)
    }
  }, [activeTab])

  const handlePartTypeAdded = async (newPartType: PartType) => {
    // Reload part types to include the new one
    await loadPartTypes()
    // Auto-select the newly added part type
    setPartType(newPartType.name)
    setShowAddPartTypeModal(false)
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
      
      await StockService.setStock(
        selectedSKU.id,
        partType.toUpperCase(),
        qty,
        isNaN(thresh) ? 5 : thresh,
        `Quick add: ${selectedSKU.sku_code || selectedSKU.id}`,
        undefined,
        finalTrackingNumber || undefined
      )

      setSuccess(`Stock added successfully! Transaction history has been recorded.`)
      
      // Reset form
      setSelectedSKU(null)
      setSkuCode('')
      setPartType('')
      setQuantity('')
      setThreshold('5')
      setTrackingNumber('')
      setTrackingFormat('standard')
      setCustomPrefix('')
      setCustomSuffix('')
      
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
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid #e5e7eb',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: activeTab === 'stock' ? '#0070f3' : '#6b7280',
              border: 'none',
              borderBottom: activeTab === 'stock' ? '2px solid #0070f3' : '2px solid transparent',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'stock' ? '600' : '500',
              cursor: 'pointer',
              marginBottom: '-2px',
            }}
          >
            📦 Quick Add Stock
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sku')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: activeTab === 'sku' ? '#0070f3' : '#6b7280',
              border: 'none',
              borderBottom: activeTab === 'sku' ? '2px solid #0070f3' : '2px solid transparent',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'sku' ? '600' : '500',
              cursor: 'pointer',
              marginBottom: '-2px',
            }}
          >
            ➕ Quick Add SKU
          </button>
        </div>

        {/* Stock Tab Content */}
        {activeTab === 'stock' && (
          <>
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
            gridTemplateColumns: isMobile ? '1fr' : '2fr 1.5fr 1fr 1fr 1.5fr auto',
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
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '__ADD_NEW__') {
                    setShowAddPartTypeModal(true)
                    // Reset to empty to keep dropdown in "Select..." state
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

            {/* Tracking Number */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
              }}>
                Tracking # <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '400' }}>(Optional)</span>
              </label>
              <select
                value={trackingFormat}
                onChange={(e) => setTrackingFormat(e.target.value as 'standard' | 'international' | 'custom')}
                disabled={submitting || !selectedSKU}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  marginBottom: '0.25rem',
                  backgroundColor: selectedSKU ? 'white' : '#f3f4f6',
                }}
              >
                <option value="standard">Standard</option>
                <option value="international">International Waybill</option>
                <option value="custom">Custom</option>
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
                disabled={submitting || !selectedSKU}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  backgroundColor: selectedSKU ? 'white' : '#f3f4f6',
                  textTransform: trackingFormat === 'international' ? 'uppercase' : 'none',
                }}
              />
              {trackingFormat === 'custom' && (
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value)}
                    placeholder="Prefix"
                    disabled={submitting || !selectedSKU}
                    style={{
                      flex: 1,
                      padding: '0.375rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      backgroundColor: selectedSKU ? 'white' : '#f3f4f6',
                    }}
                  />
                  <input
                    type="text"
                    value={customSuffix}
                    onChange={(e) => setCustomSuffix(e.target.value)}
                    placeholder="Suffix"
                    disabled={submitting || !selectedSKU}
                    style={{
                      flex: 1,
                      padding: '0.375rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      backgroundColor: selectedSKU ? 'white' : '#f3f4f6',
                    }}
                  />
                </div>
              )}
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
          </>
        )}

        {/* SKU Tab Content */}
        {activeTab === 'sku' && (
          <>
            {(skuError || skuSuccess) && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: skuError ? '#fee' : '#e6ffed',
                  color: skuError ? '#c00' : '#008000',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  border: `1px solid ${skuError ? '#fcc' : '#b3e6cc'}`,
                  fontSize: '0.875rem',
                }}
              >
                {skuError || skuSuccess}
              </div>
            )}

            <form onSubmit={handleSKUSubmit}>
              {/* Required Field */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
                  SKU Code <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  ref={skuCodeInputRef}
                  type="text"
                  value={newSkuCode}
                  onChange={(e) => setNewSkuCode(e.target.value.toUpperCase())}
                  placeholder="e.g., IPH14-128-SG"
                  required
                  disabled={skuSubmitting}
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
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
                    Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g., Apple"
                    disabled={skuSubmitting}
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
                    disabled={skuSubmitting}
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
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
                    Capacity
                  </label>
                  <input
                    type="text"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g., 128GB"
                    disabled={skuSubmitting}
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
                    disabled={skuSubmitting}
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
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
                    Device Type
                  </label>
                  <input
                    type="text"
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value)}
                    placeholder="e.g., Phone, Tablet"
                    disabled={skuSubmitting}
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
                    disabled={skuSubmitting}
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
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: skuSubmitting ? 'not-allowed' : 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isUnlocked}
                    onChange={(e) => setIsUnlocked(e.target.checked)}
                    disabled={skuSubmitting}
                    style={{
                      marginRight: '0.5rem',
                      width: '18px',
                      height: '18px',
                      cursor: skuSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  />
                  <span style={{ fontWeight: '500' }}>Unlocked</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: skuSubmitting ? 'not-allowed' : 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={skuSubmitting}
                    style={{
                      marginRight: '0.5rem',
                      width: '18px',
                      height: '18px',
                      cursor: skuSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  />
                  <span style={{ fontWeight: '500' }}>Active</span>
                </label>
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={skuSubmitting || !newSkuCode.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: (!newSkuCode.trim()) ? '#9ca3af' : '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (skuSubmitting || !newSkuCode.trim()) ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    opacity: (skuSubmitting || !newSkuCode.trim()) ? 0.6 : 1,
                  }}
                >
                  {skuSubmitting ? 'Adding...' : 'Add SKU'}
                </button>
              </div>
            </form>
          </>
        )}
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

