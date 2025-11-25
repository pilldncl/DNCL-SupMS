'use client'

import { useState, useEffect, useRef } from 'react'
import type { SKU, PartType } from '@/lib/types/supply'
import { SKUService, PartTypesService } from '@/lib/services'
import { AddSKUModal } from './AddSKUModal'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (skuId: string | number, partType: string, quantity?: number) => Promise<void>
  skuTableName?: string
}

export function AddItemModal({ 
  isOpen, 
  onClose, 
  onAdd,
  skuTableName = 'sku_master' 
}: AddItemModalProps) {
  const [skus, setSKUs] = useState<SKU[]>([])
  const [partTypes, setPartTypes] = useState<PartType[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Search/autocomplete state
  const [searchTerm, setSearchTerm] = useState('')
  const [showSKUDropdown, setShowSKUDropdown] = useState(false)
  const [selectedSKUIndex, setSelectedSKUIndex] = useState(-1)
  const [selectedSKU, setSelectedSKU] = useState<SKU | null>(null)
  
  // Add SKU modal state
  const [showAddSKUModal, setShowAddSKUModal] = useState(false)
  
  // Form state
  const [selectedPartType, setSelectedPartType] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadData()
      // Auto-focus search input when modal opens
      setTimeout(() => searchInputRef.current?.focus(), 100)
    } else {
      // Reset form when modal closes
      resetForm()
    }
  }, [isOpen])

  // Format SKU display name (defined early so it can be used by other functions)
  const formatSKUDisplay = (sku: SKU): string => {
    const parts: string[] = []
    if (sku.brand) parts.push(sku.brand)
    if (sku.model) parts.push(sku.model)
    if (sku.capacity) parts.push(sku.capacity)
    if (sku.color) parts.push(sku.color)
    
    let display = parts.length > 0 ? parts.join(' • ') : ''
    if (sku.sku_code) {
      display = display ? `${display} (${sku.sku_code})` : sku.sku_code
    }
    return display || `SKU ${sku.id}`
  }

  const resetForm = () => {
    setSearchTerm('')
    setSelectedSKU(null)
    setSelectedPartType('')
    setQuantity('')
    setError(null)
    setSelectedSKUIndex(-1)
    setShowSKUDropdown(false)
    setShowAddSKUModal(false)
  }
  
  const handleSKUAdded = async (newSKU: SKU) => {
    // Reload SKU list to include the new one
    await loadData()
    
    // Auto-select the newly added SKU
    setSelectedSKU(newSKU)
    setSearchTerm(formatSKUDisplay(newSKU))
    setShowSKUDropdown(false)
    
    // Show success message
    setError(null)
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [skuData, partTypeData] = await Promise.all([
        SKUService.getAllSKUs(skuTableName),
        PartTypesService.getActivePartTypes(),
      ])
      setSKUs(skuData)
      setPartTypes(partTypeData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Filter SKUs based on search
  const filteredSKUs = skus.filter(sku => {
    if (!searchTerm.trim()) return false // Don't show all SKUs until user starts typing
    const search = searchTerm.toLowerCase()
    const brand = (sku.brand || '').toLowerCase()
    const model = (sku.model || '').toLowerCase()
    const code = (sku.sku_code || '').toLowerCase()
    const capacity = (sku.capacity || '').toLowerCase()
    const color = (sku.color || '').toLowerCase()
    return brand.includes(search) || 
           model.includes(search) || 
           code.includes(search) ||
           capacity.includes(search) ||
           color.includes(search)
  }).slice(0, 10) // Limit to 10 results for better performance

  const handleSKUSearchChange = (value: string) => {
    setSearchTerm(value)
    setShowSKUDropdown(true)
    setSelectedSKUIndex(-1)
    if (!value.trim()) {
      setSelectedSKU(null)
    }
  }

  const handleSKUSelect = (sku: SKU) => {
    setSelectedSKU(sku)
    setSearchTerm(formatSKUDisplay(sku))
    setShowSKUDropdown(false)
    setSelectedSKUIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSKUDropdown || filteredSKUs.length === 0) {
      if (e.key === 'Enter' && selectedSKU && selectedPartType) {
        handleSubmit(e as any)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSKUIndex(prev => 
          prev < filteredSKUs.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSKUIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSKUIndex >= 0 && selectedSKUIndex < filteredSKUs.length) {
          handleSKUSelect(filteredSKUs[selectedSKUIndex])
        }
        break
      case 'Escape':
        setShowSKUDropdown(false)
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedSKU) {
      setError('Please search and select a SKU')
      return
    }

    if (!selectedPartType) {
      setError('Please select a Part Type')
      return
    }

    setSubmitting(true)
    try {
      const qty = quantity ? parseInt(quantity, 10) : undefined
      if (qty && (isNaN(qty) || qty < 1)) {
        setError('Quantity must be a positive number')
        setSubmitting(false)
        return
      }
      
      await onAdd(selectedSKU.id, selectedPartType, qty)
      resetForm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setSubmitting(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSKUDropdown(false)
      }
    }

    if (showSKUDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSKUDropdown])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        if (showSKUDropdown) {
          setShowSKUDropdown(false)
        } else {
          onClose()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, submitting, showSKUDropdown, onClose])

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
        zIndex: 1000,
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
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Add Item to Order List</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
              padding: '0.25rem 0.5rem',
              lineHeight: 1,
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
          {/* SKU Search with Autocomplete */}
          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                SKU <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddSKUModal(true)}
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#0070f3',
                }}
              >
                + New SKU
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => handleSKUSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchTerm.trim()) {
                    setShowSKUDropdown(true)
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Start typing to search SKU (brand, model, code, capacity, color)..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: selectedSKU ? '2px solid #16a34a' : '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  transition: 'border-color 0.2s',
                }}
              />
              {selectedSKU && (
                <span
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#16a34a',
                    fontSize: '1.2rem',
                  }}
                >
                  ✓
                </span>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showSKUDropdown && searchTerm.trim() && filteredSKUs.length > 0 && (
              <div
                ref={dropdownRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  marginTop: '0.25rem',
                  maxHeight: '300px',
                  overflow: 'auto',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 1001,
                }}
              >
                {filteredSKUs.map((sku, index) => (
                  <div
                    key={sku.id}
                    onClick={() => handleSKUSelect(sku)}
                    onMouseEnter={() => setSelectedSKUIndex(index)}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      backgroundColor: selectedSKUIndex === index ? '#f3f4f6' : 'white',
                      borderBottom: index < filteredSKUs.length - 1 ? '1px solid #f3f4f6' : 'none',
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                      {formatSKUDisplay(sku)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {[
                        sku.device_type ? `Type: ${sku.device_type}` : null,
                      ].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showSKUDropdown && searchTerm.trim() && filteredSKUs.length === 0 && !loading && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  marginTop: '0.25rem',
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#666',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 1001,
                }}
              >
                No SKUs found matching "{searchTerm}"
              </div>
            )}
          </div>

          {/* Part Type Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
              Part Type <span style={{ color: '#dc2626' }}>*</span>
            </label>
            {loading ? (
              <p style={{ color: '#666' }}>Loading part types...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                {partTypes.map((part) => (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => setSelectedPartType(part.name)}
                    style={{
                      padding: '0.75rem 1rem',
                      border: selectedPartType === part.name ? '2px solid #0070f3' : '1px solid #ddd',
                      borderRadius: '6px',
                      backgroundColor: selectedPartType === part.name ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      fontWeight: selectedPartType === part.name ? '600' : '400',
                      transition: 'all 0.2s',
                    }}
                  >
                    {part.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity (Optional) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
              Quantity <span style={{ color: '#666', fontWeight: '400', fontSize: '0.85rem' }}>(Optional)</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              placeholder="Enter quantity..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.95rem',
              }}
            />
          </div>

          {/* Preview of what will be added */}
          {selectedSKU && selectedPartType && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Preview:</div>
              <div style={{ fontWeight: '500' }}>
                {formatSKUDisplay(selectedSKU)} • {partTypes.find(p => p.name === selectedPartType)?.display_name}
                {quantity && ` • Qty: ${quantity}`}
              </div>
            </div>
          )}

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
              disabled={loading || submitting || !selectedSKU || !selectedPartType}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: (!selectedSKU || !selectedPartType) ? '#9ca3af' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (loading || submitting || !selectedSKU || !selectedPartType) ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                opacity: (loading || submitting || !selectedSKU || !selectedPartType) ? 0.6 : 1,
                transition: 'background-color 0.2s',
              }}
            >
              {submitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>

        {/* Add SKU Modal */}
        <AddSKUModal
          isOpen={showAddSKUModal}
          onClose={() => setShowAddSKUModal(false)}
          onSKUAdded={handleSKUAdded}
          skuTableName={skuTableName}
        />
      </div>
    </div>
  )
}
