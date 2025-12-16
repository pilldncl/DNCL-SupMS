'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { StockService, SKUService, PartTypesService } from '@/lib/services'
import type { StockItem, SKU, PartType } from '@/lib/types/supply'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { UpdateStockModal } from '@/components/UpdateStockModal'
import { UpdateTrackingModal } from '@/components/UpdateTrackingModal'
import { UpdateNotesModal } from '@/components/UpdateNotesModal'
import { SKUAutocomplete } from '@/components/SKUAutocomplete'
import { AddSKUModal } from '@/components/AddSKUModal'
import { AddPartTypeModal } from '@/components/AddPartTypeModal'
import { QuickAddStockForm } from '@/components/QuickAddStockForm'
import { useMobile } from '@/lib/hooks/useMobile'

interface BulkEntryRow {
  skuCode: string
  selectedSKU: SKU | null
  partType: string
  quantity: string
  threshold?: string
}

/**
 * Stock Management Page - Clean design with tabs for View and Bulk Entry
 */
export default function StockPage() {
  const isMobile = useMobile()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'view' | 'entry'>('view')
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null)
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [selectedTrackingItem, setSelectedTrackingItem] = useState<StockItem | null>(null)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [selectedNotesItem, setSelectedNotesItem] = useState<StockItem | null>(null)

  // Bulk Entry State
  const [bulkRows, setBulkRows] = useState<BulkEntryRow[]>([
    { skuCode: '', selectedSKU: null, partType: '', quantity: '', threshold: '5' },
    { skuCode: '', selectedSKU: null, partType: '', quantity: '', threshold: '5' },
    { skuCode: '', selectedSKU: null, partType: '', quantity: '', threshold: '5' },
  ])
  const [partTypes, setPartTypes] = useState<Array<{ name: string; display_name: string }>>([])
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null)
  const [showAddSKUModal, setShowAddSKUModal] = useState(false)
  const [showAddPartTypeModal, setShowAddPartTypeModal] = useState(false)
  const [skuToAddAfter, setSkuToAddAfter] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Read filter from URL query parameter
    const filterParam = searchParams.get('filter')
    if (filterParam === 'low' || filterParam === 'out') {
      setFilter(filterParam)
    }
  }, [searchParams])

  useEffect(() => {
    loadStock()
    loadPartTypes()
  }, [])

  const loadStock = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await StockService.getAllStock()
      setStockItems(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock')
      console.error('Error loading stock:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPartTypes = async () => {
    try {
      const types = await PartTypesService.getAllPartTypes()
      setPartTypes(types.map(pt => ({ name: pt.name, display_name: pt.display_name })))
    } catch (err) {
      console.error('Error loading part types:', err)
    }
  }

  const handleUpdateStock = (item: StockItem) => {
    setSelectedStockItem(item)
    setShowUpdateModal(true)
  }

  const handleUpdateTracking = (item: StockItem) => {
    setSelectedTrackingItem(item)
    setShowTrackingModal(true)
  }

  const handleUpdateNotes = (item: StockItem) => {
    setSelectedNotesItem(item)
    setShowNotesModal(true)
  }

  const handleStockUpdated = () => {
    loadStock()
    setShowUpdateModal(false)
    setSelectedStockItem(null)
    setBulkError(null)
    setBulkSuccess(null)
  }

  // Bulk Entry Functions
  const addBulkRow = () => {
    setBulkRows([...bulkRows, { skuCode: '', selectedSKU: null, partType: '', quantity: '', threshold: '5' }])
  }

  const removeBulkRow = (index: number) => {
    setBulkRows(bulkRows.filter((_, i) => i !== index))
  }

  const updateBulkRow = (index: number, field: keyof BulkEntryRow, value: string | SKU | null) => {
    const newRows = [...bulkRows]
    if (field === 'selectedSKU') {
      newRows[index] = { ...newRows[index], selectedSKU: value as SKU | null }
    } else {
      newRows[index] = { ...newRows[index], [field]: value }
    }
    setBulkRows(newRows)
  }

  const handleSKUAdded = async (newSKU: SKU) => {
    if (skuToAddAfter !== null) {
      const newRows = [...bulkRows]
      newRows[skuToAddAfter] = {
        ...newRows[skuToAddAfter],
        selectedSKU: newSKU,
        skuCode: newSKU.sku_code || `SKU-${newSKU.id}`,
      }
      setBulkRows(newRows)
    }
    setShowAddSKUModal(false)
    setSkuToAddAfter(null)
  }

  const handlePartTypeAdded = async (newPartType: PartType) => {
    // Reload part types to include the new one
    await loadPartTypes()
    setShowAddPartTypeModal(false)
  }

  const handleBulkFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setBulkError(null)
    setBulkSuccess(null)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const parsedRows: BulkEntryRow[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        
        let cells = line.includes('\t') ? line.split('\t') : line.split(',')
        cells = cells.map(cell => cell.trim().replace(/^["']|["']$/g, ''))
        
        if (cells.length >= 2) {
          const skuCode = cells[0] || ''
          const partType = cells[1]?.toUpperCase().trim() || ''
          const quantity = cells[2] || ''
          const threshold = cells[3] || '5'
          
          if (skuCode) {
            parsedRows.push({ 
              skuCode, 
              selectedSKU: null,
              partType, 
              quantity, 
              threshold 
            })
          }
        }
      }

      if (parsedRows.length > 0) {
        const existingRows = bulkRows.filter(r => r.skuCode || r.selectedSKU)
        setBulkRows([...existingRows, ...parsedRows])
        setBulkSuccess(`Imported ${parsedRows.length} row(s) from CSV. Please search and select SKUs.`)
      } else {
        setBulkError('No valid rows found in CSV')
      }
      
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setBulkError('Failed to parse CSV file')
      console.error('CSV parse error:', err)
    }
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBulkError(null)
    setBulkSuccess(null)

    const validRows = bulkRows.filter(row => 
      row.selectedSKU && row.partType.trim() && row.quantity.trim()
    )

    if (validRows.length === 0) {
      setBulkError('Please complete at least one valid stock entry (select SKU, part type, and quantity)')
      return
    }

    setBulkSubmitting(true)
    let successCount = 0
    const errors: string[] = []

    try {
      for (const row of validRows) {
        try {
          if (!row.selectedSKU) {
            errors.push(`Row: SKU not selected`)
            continue
          }

          const partTypeExists = partTypes.some(pt => pt.name === row.partType.trim().toUpperCase())
          if (!partTypeExists) {
            errors.push(`${row.selectedSKU.sku_code || 'SKU'}: Invalid part type`)
            continue
          }

          const quantity = parseInt(row.quantity.trim(), 10)
          const threshold = row.threshold ? parseInt(row.threshold.trim(), 10) : 5

          if (isNaN(quantity) || quantity < 0) {
            errors.push(`${row.selectedSKU.sku_code || 'SKU'}: Invalid quantity`)
            continue
          }

          await StockService.setStock(
            row.selectedSKU.id,
            row.partType.trim().toUpperCase(),
            quantity,
            isNaN(threshold) ? 5 : threshold,
            `Bulk entry: ${row.selectedSKU.sku_code || row.selectedSKU.id}`
          )

          successCount++
        } catch (err) {
          const skuCode = row.selectedSKU?.sku_code || 'Unknown'
          errors.push(`${skuCode}: ${err instanceof Error ? err.message : 'Failed'}`)
        }
      }

      if (successCount > 0) {
        setBulkSuccess(`Successfully updated ${successCount} stock items${errors.length > 0 ? ` (${errors.length} errors)` : ''}`)
        if (errors.length > 0) {
          setBulkError(errors.slice(0, 5).join('; ') + (errors.length > 5 ? '...' : ''))
        }
        setTimeout(() => {
          loadStock()
          setBulkRows([
            { skuCode: '', selectedSKU: null, partType: '', quantity: '', threshold: '5' },
            { skuCode: '', selectedSKU: null, partType: '', quantity: '', threshold: '5' },
            { skuCode: '', selectedSKU: null, partType: '', quantity: '', threshold: '5' },
          ])
          setBulkSuccess(null)
          setActiveTab('view')
        }, 2000)
      } else {
        setBulkError(`Failed to update any items. Errors: ${errors.slice(0, 3).join('; ')}`)
      }
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Failed to update stock')
    } finally {
      setBulkSubmitting(false)
    }
  }

  // Filter stock items
  const filteredItems = stockItems.filter(item => {
    if (filter === 'low' && !item.is_low_stock) return false
    if (filter === 'out' && item.quantity > 0) return false
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      const skuName = item.sku?.sku_code?.toLowerCase() || ''
      const brand = (item.sku?.brand || '').toLowerCase()
      const model = (item.sku?.model || '').toLowerCase()
      const partType = (item.part_type_display || item.part_type || '').toLowerCase()
      
      return skuName.includes(search) || brand.includes(search) || model.includes(search) || partType.includes(search)
    }
    
    return true
  })

  const lowStockCount = stockItems.filter(item => item.is_low_stock && item.quantity > 0).length
  const outOfStockCount = stockItems.filter(item => item.quantity === 0).length

  return (
    <>
      <Sidebar />
      <TopBar />
      <main style={{ 
        marginLeft: isMobile ? '0' : '240px', 
        marginTop: '64px',
        padding: isMobile ? '1rem' : '2rem',
        backgroundColor: '#f9fafb',
        minHeight: 'calc(100vh - 64px)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? '1rem' : '2rem' }}>
          <h1 style={{ 
            margin: '0 0 0.5rem 0',
            fontSize: isMobile ? '1.5rem' : '1.875rem',
            fontWeight: '700',
            color: '#111827',
          }}>
            Stock Management
          </h1>
          <p style={{ 
            margin: 0,
            color: '#6b7280', 
            fontSize: '0.95rem',
          }}>
            Track inventory levels and update stock in bulk
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
              {stockItems.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Total Items
            </div>
          </div>
          <div style={{
            backgroundColor: lowStockCount > 0 ? '#fffbeb' : 'white',
            borderRadius: '8px',
            padding: '1rem',
            border: `1px solid ${lowStockCount > 0 ? '#fde68a' : '#e5e7eb'}`,
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: lowStockCount > 0 ? '#f59e0b' : '#111827' }}>
              {lowStockCount}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Low Stock
            </div>
          </div>
          <div style={{
            backgroundColor: outOfStockCount > 0 ? '#fee' : 'white',
            borderRadius: '8px',
            padding: '1rem',
            border: `1px solid ${outOfStockCount > 0 ? '#fcc' : '#e5e7eb'}`,
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: outOfStockCount > 0 ? '#dc2626' : '#111827' }}>
              {outOfStockCount}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Out of Stock
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid #e5e7eb',
        }}>
          <button
            onClick={() => setActiveTab('view')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: activeTab === 'view' ? '#0070f3' : '#6b7280',
              border: 'none',
              borderBottom: activeTab === 'view' ? '2px solid #0070f3' : '2px solid transparent',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'view' ? '600' : '500',
              cursor: 'pointer',
              marginBottom: '-2px',
            }}
          >
            📋 View Stock
          </button>
          <button
            onClick={() => setActiveTab('entry')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: activeTab === 'entry' ? '#0070f3' : '#6b7280',
              border: 'none',
              borderBottom: activeTab === 'entry' ? '2px solid #0070f3' : '2px solid transparent',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'entry' ? '600' : '500',
              cursor: 'pointer',
              marginBottom: '-2px',
            }}
          >
            📊 Bulk Entry
          </button>
        </div>

        {/* View Tab */}
        {activeTab === 'view' && (
          <>
            {/* Quick Add Stock Form */}
            <QuickAddStockForm onStockAdded={loadStock} />

            {(error || bulkError) && (
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#fee',
                  color: '#c00',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  border: '1px solid #fcc',
                }}
              >
                {error || bulkError}
              </div>
            )}

            {/* Filters and Search */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '1rem',
              alignItems: isMobile ? 'stretch' : 'center',
            }}>
              <div style={{ flex: 1, minWidth: isMobile ? 'auto' : '200px' }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by SKU, brand, model, or part type..."
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(['all', 'low', 'out'] as const).map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: filter === filterOption ? '#0070f3' : '#f3f4f6',
                      color: filter === filterOption ? 'white' : '#111827',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: filter === filterOption ? '600' : '500',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      flex: isMobile ? '1' : 'auto',
                      minWidth: isMobile ? '80px' : 'auto',
                    }}
                  >
                    {filterOption === 'all' ? 'All' : filterOption === 'low' ? 'Low Stock' : 'Out of Stock'}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock Items Table */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: '#6b7280' }}>Loading stock...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '3rem',
                textAlign: 'center',
                border: '1px solid #e5e7eb',
              }}>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  {searchTerm ? 'No stock items found matching your search.' : 'No stock items yet. Switch to Bulk Entry to add stock.'}
                </p>
              </div>
            ) : (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>SKU</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Part Type</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Quantity</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Threshold</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Tracking</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Last Updated</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => {
                        const skuName = item.sku?.sku_code || 
                          (item.sku?.brand && item.sku?.model 
                            ? `${item.sku.brand} ${item.sku.model}` 
                            : `SKU ${item.sku_id}`)
                        const statusColor = item.quantity === 0 
                          ? '#dc2626' 
                          : item.is_low_stock 
                            ? '#f59e0b' 
                            : '#10b981'
                        const statusText = item.quantity === 0 
                          ? 'Out of Stock' 
                          : item.is_low_stock 
                            ? 'Low Stock' 
                            : 'In Stock'

                        return (
                          <tr 
                            key={item.id}
                            style={{ 
                              borderBottom: '1px solid #f3f4f6',
                              backgroundColor: item.is_low_stock || item.quantity === 0 ? '#fff7ed' : 'white',
                            }}
                          >
                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                              <div style={{ fontWeight: '500', color: '#111827' }}>{skuName}</div>
                              {item.sku?.brand && item.sku?.model && item.sku?.sku_code && (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                  {item.sku.brand} {item.sku.model}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#e5e7eb',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                              }}>
                                {item.part_type_display || item.part_type}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                              {item.quantity}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#6b7280' }}>
                              {item.low_stock_threshold}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: statusColor + '20',
                                color: statusColor,
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                              }}>
                                {statusText}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                              {item.tracking_number ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.8rem',
                                    color: '#0070f3',
                                    fontWeight: '500',
                                  }}>
                                    📦 {item.tracking_number}
                                  </span>
                                  <button
                                    onClick={() => handleUpdateTracking(item)}
                                    style={{
                                      padding: '0.25rem 0.5rem',
                                      backgroundColor: 'transparent',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      color: '#6b7280',
                                      cursor: 'pointer',
                                    }}
                                    title="Edit tracking number"
                                  >
                                    ✏️
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleUpdateTracking(item)}
                                  style={{
                                    padding: '0.5rem 0.75rem',
                                    backgroundColor: '#f3f4f6',
                                    border: '1px dashed #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                  }}
                                >
                                  <span>📦</span>
                                  <span>Add Tracking</span>
                                </button>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                              {new Date(item.last_updated).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => handleUpdateNotes(item)}
                                  style={{
                                    padding: '0.5rem 0.75rem',
                                    backgroundColor: '#f3f4f6',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                  }}
                                  title={item.notes ? 'Edit notes' : 'Add notes'}
                                >
                                  <span>📝</span>
                                  <span>{item.notes ? 'Notes' : 'Add Notes'}</span>
                                </button>
                                <button
                                  onClick={() => handleUpdateStock(item)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#0070f3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Update
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Bulk Entry Tab */}
        {activeTab === 'entry' && (
          <div>
            {(bulkError || bulkSuccess) && (
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: bulkSuccess ? '#e6ffed' : '#fee',
                  color: bulkSuccess ? '#008000' : '#c00',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  border: `1px solid ${bulkSuccess ? '#b3e6cc' : '#fcc'}`,
                }}
              >
                {bulkSuccess || bulkError}
              </div>
            )}

            {/* CSV Import */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              border: '2px dashed #d1d5db',
            }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem' }}>
                📄 Import from CSV (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleBulkFileUpload}
                disabled={bulkSubmitting}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={bulkSubmitting}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: bulkSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  opacity: bulkSubmitting ? 0.6 : 1,
                }}
              >
                Choose CSV File
              </button>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.75rem', margin: 0 }}>
                Format: SKU Code, Part Type, Quantity, Threshold (optional). After import, search and select each SKU.
              </p>
            </div>

            {/* Bulk Entry Form */}
            <form onSubmit={handleBulkSubmit}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                overflow: 'visible',
                marginBottom: '1.5rem',
              }}>
                <div style={{ overflowX: 'auto', overflowY: 'visible', position: 'relative' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '800px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151', borderRight: '1px solid #e5e7eb' }}>
                          SKU Code
                        </th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151', borderRight: '1px solid #e5e7eb' }}>
                          Part Type
                        </th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151', borderRight: '1px solid #e5e7eb' }}>
                          Quantity
                        </th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                          Threshold
                        </th>
                        <th style={{ padding: '0.75rem', width: '60px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkRows.map((row, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '1rem', borderRight: '1px solid #e5e7eb', position: 'relative', minHeight: '70px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <SKUAutocomplete
                                  value={row.skuCode}
                                  onChange={(value) => updateBulkRow(index, 'skuCode', value)}
                                  onSelect={(sku) => updateBulkRow(index, 'selectedSKU', sku)}
                                  selectedSKU={row.selectedSKU}
                                  placeholder="Search SKU..."
                                  disabled={bulkSubmitting}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSkuToAddAfter(index)
                                  setShowAddSKUModal(true)
                                }}
                                disabled={bulkSubmitting}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  backgroundColor: '#f3f4f6',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: bulkSubmitting ? 'not-allowed' : 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  opacity: bulkSubmitting ? 0.6 : 1,
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                }}
                                title="Add New SKU"
                              >
                                + New
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', borderRight: '1px solid #e5e7eb' }}>
                            <select
                              value={row.partType}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === '__ADD_NEW__') {
                                  setShowAddPartTypeModal(true)
                                  // Reset to empty to keep dropdown in "Select..." state
                                  updateBulkRow(index, 'partType', '')
                                } else {
                                  updateBulkRow(index, 'partType', value)
                                }
                              }}
                              disabled={bulkSubmitting || !row.selectedSKU}
                              style={{
                                width: '100%',
                                padding: '0.625rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                backgroundColor: row.selectedSKU ? 'white' : '#f3f4f6',
                              }}
                            >
                              <option value="">Select Part Type...</option>
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
                          </td>
                          <td style={{ padding: '1rem', borderRight: '1px solid #e5e7eb' }}>
                            <input
                              type="number"
                              value={row.quantity}
                              onChange={(e) => updateBulkRow(index, 'quantity', e.target.value)}
                              placeholder="0"
                              min="0"
                              disabled={bulkSubmitting || !row.selectedSKU}
                              style={{
                                width: '100%',
                                padding: '0.625rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                backgroundColor: row.selectedSKU ? 'white' : '#f3f4f6',
                              }}
                            />
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <input
                              type="number"
                              value={row.threshold}
                              onChange={(e) => updateBulkRow(index, 'threshold', e.target.value)}
                              placeholder="5"
                              min="0"
                              disabled={bulkSubmitting || !row.selectedSKU}
                              style={{
                                width: '100%',
                                padding: '0.625rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                backgroundColor: row.selectedSKU ? 'white' : '#f3f4f6',
                              }}
                            />
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            {bulkRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBulkRow(index)}
                                disabled={bulkSubmitting}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc2626',
                                  cursor: bulkSubmitting ? 'not-allowed' : 'pointer',
                                  fontSize: '1.25rem',
                                  padding: '0.25rem',
                                  opacity: bulkSubmitting ? 0.5 : 1,
                                }}
                              >
                                ×
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  onClick={addBulkRow}
                  disabled={bulkSubmitting}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: bulkSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    opacity: bulkSubmitting ? 0.6 : 1,
                  }}
                >
                  + Add Row
                </button>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {bulkRows.filter(r => r.selectedSKU && r.partType && r.quantity).length} valid row(s) ready to submit
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('view')
                    setBulkError(null)
                    setBulkSuccess(null)
                  }}
                  disabled={bulkSubmitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: bulkSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                    opacity: bulkSubmitting ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkSubmitting || bulkRows.filter(r => r.selectedSKU && r.partType && r.quantity).length === 0}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: bulkSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    opacity: bulkSubmitting ? 0.6 : 1,
                  }}
                >
                  {bulkSubmitting ? 'Processing...' : `Update Stock (${bulkRows.filter(r => r.selectedSKU && r.partType && r.quantity).length} items)`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Update Stock Modal */}
        {showUpdateModal && selectedStockItem && (
          <UpdateStockModal
            isOpen={showUpdateModal}
            onClose={() => {
              setShowUpdateModal(false)
              setSelectedStockItem(null)
            }}
            stockItem={selectedStockItem}
            onStockUpdated={handleStockUpdated}
          />
        )}

        {/* Update Tracking Modal */}
        {showTrackingModal && selectedTrackingItem && (
          <UpdateTrackingModal
            isOpen={showTrackingModal}
            onClose={() => {
              setShowTrackingModal(false)
              setSelectedTrackingItem(null)
            }}
            stockItem={selectedTrackingItem}
            onTrackingUpdated={() => {
              loadStock()
              setShowTrackingModal(false)
              setSelectedTrackingItem(null)
            }}
          />
        )}

        {/* Update Notes Modal */}
        {showNotesModal && selectedNotesItem && (
          <UpdateNotesModal
            isOpen={showNotesModal}
            onClose={() => {
              setShowNotesModal(false)
              setSelectedNotesItem(null)
            }}
            stockItem={selectedNotesItem}
            onNotesUpdated={() => {
              loadStock()
              setShowNotesModal(false)
              setSelectedNotesItem(null)
            }}
          />
        )}

        {/* Add SKU Modal */}
        {showAddSKUModal && (
          <AddSKUModal
            isOpen={showAddSKUModal}
            onClose={() => {
              setShowAddSKUModal(false)
              setSkuToAddAfter(null)
            }}
            onSKUAdded={handleSKUAdded}
          />
        )}

        {/* Add Part Type Modal */}
        {showAddPartTypeModal && (
          <AddPartTypeModal
            isOpen={showAddPartTypeModal}
            onClose={() => setShowAddPartTypeModal(false)}
            onPartTypeAdded={handlePartTypeAdded}
          />
        )}
      </main>
    </>
  )
}
