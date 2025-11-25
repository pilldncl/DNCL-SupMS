'use client'

import { useState, useRef, useEffect } from 'react'
import type { SKU } from '@/lib/types/supply'
import { SKUService } from '@/lib/services'

interface SKUAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (sku: SKU | null) => void
  selectedSKU: SKU | null
  placeholder?: string
  disabled?: boolean
  skuTableName?: string
}

/**
 * Reusable SKU autocomplete search component
 */
export function SKUAutocomplete({
  value,
  onChange,
  onSelect,
  selectedSKU,
  placeholder = 'Search SKU...',
  disabled = false,
  skuTableName = 'sku_master'
}: SKUAutocompleteProps) {
  const [skus, setSKUs] = useState<SKU[]>([])
  const [filteredSKUs, setFilteredSKUs] = useState<SKU[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSKUs()
  }, [])

  useEffect(() => {
    if (value.trim()) {
      const search = value.toLowerCase()
      const filtered = skus.filter(sku => {
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
      }).slice(0, 8)
      setFilteredSKUs(filtered)
      setShowDropdown(filtered.length > 0)
    } else {
      setFilteredSKUs([])
      setShowDropdown(false)
    }
    setSelectedIndex(-1)
  }, [value, skus])

  const loadSKUs = async () => {
    setLoading(true)
    try {
      const skuData = await SKUService.getAllSKUs(skuTableName)
      setSKUs(skuData)
    } catch (err) {
      console.error('Error loading SKUs:', err)
    } finally {
      setLoading(false)
    }
  }

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

  const handleSelect = (sku: SKU) => {
    onSelect(sku)
    onChange(formatSKUDisplay(sku))
    setShowDropdown(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredSKUs.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredSKUs.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredSKUs.length) {
          handleSelect(filteredSKUs[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        break
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (filteredSKUs.length > 0) setShowDropdown(true)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.625rem 0.75rem',
          border: selectedSKU ? '2px solid #10b981' : '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
      />
      
      {selectedSKU && (
        <span style={{
          position: 'absolute',
          right: '0.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#10b981',
          fontSize: '1rem',
        }}>
          ✓
        </span>
      )}

      {showDropdown && filteredSKUs.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            maxHeight: '320px',
            overflowY: 'auto',
            marginTop: '0',
          }}
        >
          {filteredSKUs.map((sku, index) => {
            const display = formatSKUDisplay(sku)
            const isHighlighted = index === selectedIndex
            
            return (
              <div
                key={sku.id}
                onClick={() => handleSelect(sku)}
                style={{
                  padding: '0.875rem 1rem',
                  cursor: 'pointer',
                  backgroundColor: isHighlighted ? '#f3f4f6' : 'white',
                  borderBottom: index < filteredSKUs.length - 1 ? '1px solid #f3f4f6' : 'none',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#111827', lineHeight: '1.4' }}>
                  {display}
                </div>
                {sku.brand && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.375rem', lineHeight: '1.3' }}>
                    {sku.brand} {sku.model || ''}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

