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
  const isSelectingRef = useRef(false) // Track if we're in the process of selecting
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    loadSKUs()
  }, [])

  useEffect(() => {
    if (value.trim()) {
      const search = value.toLowerCase().trim()
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
      
      // Check if the current value matches the selected SKU's display format
      // This prevents clearing selection when value is the formatted display string
      const selectedDisplay = selectedSKU ? formatSKUDisplay(selectedSKU).toLowerCase().trim() : ''
      const isSelectedDisplay = selectedSKU && selectedDisplay === search
      
      // Auto-select if the typed value exactly matches a SKU code
      // This enables the Part Type dropdown when user types a valid SKU code
      const currentSkuCode = selectedSKU?.sku_code?.toLowerCase().trim()
      const exactMatch = skus.find(sku => {
        const code = (sku.sku_code || '').toLowerCase().trim()
        return code === search
      })
      
      if (exactMatch) {
        // Auto-select if there's an exact match and it's different from current selection
        if (!selectedSKU || selectedSKU.id !== exactMatch.id) {
          onSelect(exactMatch)
        }
      } else if (selectedSKU && !isSelectedDisplay && currentSkuCode !== search) {
        // Only clear selection if:
        // 1. We have a selected SKU
        // 2. The value is NOT the formatted display of the selected SKU
        // 3. The value is NOT the SKU code of the selected SKU
        // This prevents clearing when user has selected a SKU and the value shows the formatted display
        console.log('[SKUAutocomplete] Clearing selection - value changed and no longer matches', {
          search,
          currentSkuCode,
          selectedDisplay,
          isSelectedDisplay
        })
        onSelect(null)
      }
    } else {
      setFilteredSKUs([])
      setShowDropdown(false)
      // Clear selection if value is cleared
      if (selectedSKU) {
        onSelect(null)
      }
    }
    setSelectedIndex(-1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, skus, selectedSKU])

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

  const handleSelect = (sku: SKU, event?: React.MouseEvent | React.TouchEvent) => {
    console.log('[SKUAutocomplete] handleSelect called', { 
      sku: sku.sku_code, 
      eventType: event?.type,
      timestamp: Date.now()
    })
    
    // Mark that we're selecting IMMEDIATELY - this must happen synchronously
    isSelectingRef.current = true
    
    // Stop event propagation to prevent outside click handler from firing
    if (event) {
      event.stopPropagation()
      // preventDefault may fail on passive listeners (touch events), so handle gracefully
      try {
        event.preventDefault()
      } catch (err) {
        // Ignore passive listener error - selection will still work
        console.log('[SKUAutocomplete] preventDefault failed (passive listener) - continuing anyway')
      }
    }
    
    // Use requestAnimationFrame to ensure state updates happen in the right order
    requestAnimationFrame(() => {
      // Perform selection
      onSelect(sku)
      onChange(formatSKUDisplay(sku))
      setShowDropdown(false)
      setSelectedIndex(-1)
      
      // Reset flag after a longer delay to ensure all events have processed
      setTimeout(() => {
        console.log('[SKUAutocomplete] Resetting selection flag')
        isSelectingRef.current = false
      }, 500) // Longer delay for desktop browsers to ensure click events complete
    })
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
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Don't close if we're in the process of selecting
      if (isSelectingRef.current) {
        console.log('[SKUAutocomplete] Click outside blocked - selecting in progress')
        return
      }
      
      const target = event.target as Node
      const isInDropdown = dropdownRef.current?.contains(target)
      const isInInput = inputRef.current?.contains(target)
      
      console.log('[SKUAutocomplete] Click outside check', { 
        isInDropdown, 
        isInInput, 
        isSelecting: isSelectingRef.current,
        target: (target as HTMLElement)?.tagName,
        eventType: event.type
      })
      
      // Check if click is outside both input and dropdown
      if (
        dropdownRef.current &&
        !isInDropdown &&
        inputRef.current &&
        !isInInput
      ) {
        console.log('[SKUAutocomplete] Closing dropdown - click outside')
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      console.log('[SKUAutocomplete] Dropdown shown - adding outside click listener')
      // Use click event (not mousedown) and add with delay
      // Click fires AFTER mousedown, so dropdown item mousedown handlers will fire first
      const timeoutId = setTimeout(() => {
        // Use click instead of mousedown - click fires after mousedown, so selection happens first
        document.addEventListener('click', handleClickOutside as EventListener, true)
        document.addEventListener('touchend', handleClickOutside as EventListener, true) // For mobile
      }, 200) // Longer delay to ensure dropdown item handlers are registered first
      
      return () => {
        console.log('[SKUAutocomplete] Removing outside click listener')
        clearTimeout(timeoutId)
        document.removeEventListener('click', handleClickOutside as EventListener, true)
        document.removeEventListener('touchend', handleClickOutside as EventListener, true)
      }
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
        onMouseDown={(e) => {
          // Prevent form submission if input is inside a form
          if (showDropdown) {
            e.stopPropagation()
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
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
          onClick={(e) => {
            // Prevent form submission when clicking in dropdown
            e.stopPropagation()
          }}
          onMouseDown={(e) => {
            // Prevent form submission and input blur
            e.stopPropagation()
          }}
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
                onMouseDown={(e) => {
                  // Use mousedown instead of click for more reliable selection on web
                  console.log('[SKUAutocomplete] Dropdown item mousedown', { sku: sku.sku_code })
                  e.preventDefault()
                  e.stopPropagation()
                  // Set flag immediately before async operations
                  isSelectingRef.current = true
                  handleSelect(sku, e)
                }}
                onTouchStart={(e) => {
                  // Handle touch events for mobile
                  // Note: preventDefault may not work on passive listeners, so we handle it gracefully
                  console.log('[SKUAutocomplete] Dropdown item touchstart', { sku: sku.sku_code })
                  try {
                    e.preventDefault()
                  } catch (err) {
                    // Ignore passive listener error - it's expected on some browsers
                    console.log('[SKUAutocomplete] preventDefault failed (passive listener) - continuing anyway')
                  }
                  e.stopPropagation()
                  isSelectingRef.current = true
                  handleSelect(sku, e)
                }}
                onClick={(e) => {
                  // Also handle click as fallback, but prevent default behavior
                  console.log('[SKUAutocomplete] Dropdown item click', { sku: sku.sku_code })
                  e.preventDefault()
                  e.stopPropagation()
                  // If mousedown didn't fire (unlikely), handle it here
                  if (!isSelectingRef.current) {
                    isSelectingRef.current = true
                    handleSelect(sku, e)
                  }
                }}
                style={{
                  padding: '0.875rem 1rem',
                  cursor: 'pointer',
                  backgroundColor: isHighlighted ? '#f3f4f6' : 'white',
                  borderBottom: index < filteredSKUs.length - 1 ? '1px solid #f3f4f6' : 'none',
                  transition: 'background-color 0.15s ease',
                  userSelect: 'none', // Prevent text selection
                  WebkitUserSelect: 'none', // Safari
                  touchAction: 'manipulation', // Better touch handling
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

