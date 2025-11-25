'use client'

import { useState, useEffect } from 'react'
import { OrderListService } from '@/lib/services'
import type { OrderListItem } from '@/lib/types/supply'
import { OrderListItem as OrderListItemComponent } from '@/components/OrderListItem'
import { AddItemModal } from '@/components/AddItemModal'
import { AddStockFromOrderModal } from '@/components/AddStockFromOrderModal'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { useMobile } from '@/lib/hooks/useMobile'

/**
 * Main Order List page - Checklist view for items to order
 */
export default function OrderListPage() {
  const isMobile = useMobile()
  const [items, setItems] = useState<OrderListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAddStockModal, setShowAddStockModal] = useState(false)
  const [selectedOrderItemForStock, setSelectedOrderItemForStock] = useState<OrderListItem | null>(null)
  const [weekCycleId, setWeekCycleId] = useState<string>('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)

  const loadOrderList = async () => {
    setLoading(true)
    setError(null)
    try {
      const [listItems, weekCycle] = await Promise.all([
        OrderListService.getCurrentOrderList(),
        OrderListService.getCurrentWeekCycle(),
      ])
      setItems(listItems)
      setWeekCycleId(weekCycle?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order list')
      console.error('Error loading order list:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrderList()
  }, [])

  const handleToggleOrdered = async (itemId: string, isOrdered: boolean) => {
    try {
      if (isOrdered) {
        await OrderListService.markAsOrdered(itemId)
      } else {
        await OrderListService.unmarkAsOrdered(itemId)
      }
      await loadOrderList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item')
    }
  }

  const handleRemove = async (itemId: string) => {
    try {
      await OrderListService.removeItem(itemId)
      await loadOrderList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item')
    }
  }

  const handleAddItem = async (skuId: string | number, partType: string, quantity?: number) => {
    try {
      setError(null) // Clear any previous errors
      await OrderListService.addItem(skuId, partType, quantity)
      await loadOrderList()
      // Success - modal will close automatically
    } catch (err) {
      // Re-throw to let modal handle error display
      throw err
    }
  }

  const handleResetWeek = async () => {
    if (!confirm('Are you sure you want to reset this week\'s order list? This will delete all items in the current week. This cannot be undone.')) {
      return
    }

    setError(null)
    try {
      await OrderListService.resetCurrentWeek()
      await loadOrderList()
      // Clear error on success
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset week'
      setError(errorMessage)
      console.error('Reset week error:', err)
    }
  }

  const handleAddStock = (item: OrderListItem) => {
    setSelectedOrderItemForStock(item)
    setShowAddStockModal(true)
  }

  const handleStockAdded = async () => {
    await loadOrderList() // Refresh to show any updates
  }

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleSelectAll = (itemIds: string[]) => {
    if (selectedItems.size === itemIds.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(itemIds))
    }
  }

  const handleBulkMarkAsOrdered = async () => {
    if (selectedItems.size === 0) return
    
    if (!confirm(`Mark ${selectedItems.size} item(s) as ordered?`)) return

    setBulkUpdating(true)
    try {
      await Promise.all(
        Array.from(selectedItems).map(id => OrderListService.markAsOrdered(id))
      )
      setSelectedItems(new Set())
      await loadOrderList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update items')
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleBulkRemove = async () => {
    if (selectedItems.size === 0) return
    
    if (!confirm(`Remove ${selectedItems.size} item(s) from the order list?`)) return

    setBulkUpdating(true)
    try {
      await Promise.all(
        Array.from(selectedItems).map(id => OrderListService.removeItem(id))
      )
      setSelectedItems(new Set())
      await loadOrderList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove items')
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleMarkAllPendingAsOrdered = async () => {
    if (pendingItems.length === 0) return
    
    if (!confirm(`Mark all ${pendingItems.length} pending item(s) as ordered?`)) return

    setBulkUpdating(true)
    try {
      await Promise.all(
        pendingItems.map(item => OrderListService.markAsOrdered(item.id))
      )
      await loadOrderList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update items')
    } finally {
      setBulkUpdating(false)
    }
  }

  const pendingItems = items.filter(item => !item.ordered)
  const orderedItems = items.filter(item => item.ordered)

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: '700', color: '#111827' }}>Items to Order</h1>
          {weekCycleId && (
            <p style={{ color: '#6b7280', marginTop: '0.5rem', margin: 0 }}>
              Week Cycle: {weekCycleId}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0051cc'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0070f3'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            + Add Item
          </button>
          <button
            onClick={loadOrderList}
            disabled={loading}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: loading ? '#9ca3af' : '#f3f4f6',
              color: loading ? '#fff' : '#111827',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '⟳' : '↻'} Update
          </button>
          <button
            onClick={handleResetWeek}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626'
            }}
          >
            Reset Week
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#0070f3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#6b7280' }}>Loading order list...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}>
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Items</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>{items.length}</div>
            </div>
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#fffbeb',
              borderRadius: '8px',
              border: '1px solid #fde68a',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}>
              <div style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '0.25rem' }}>Pending</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>{pendingItems.length}</div>
            </div>
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#ecfdf5',
              borderRadius: '8px',
              border: '1px solid #b3e6cc',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}>
              <div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '0.25rem' }}>Ordered</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>{orderedItems.length}</div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {pendingItems.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <input
                  type="checkbox"
                  checked={selectedItems.size > 0 && selectedItems.size === pendingItems.length}
                  onChange={() => handleSelectAll(pendingItems.map(i => i.id))}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  {selectedItems.size > 0 
                    ? `${selectedItems.size} item(s) selected`
                    : 'Select items for bulk actions'
                  }
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {selectedItems.size > 0 && (
                  <>
                    <button
                      onClick={handleBulkMarkAsOrdered}
                      disabled={bulkUpdating}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: bulkUpdating ? '#9ca3af' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: bulkUpdating ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        opacity: bulkUpdating ? 0.6 : 1,
                      }}
                    >
                      ✓ Mark Selected as Ordered
                    </button>
                    <button
                      onClick={handleBulkRemove}
                      disabled={bulkUpdating}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: bulkUpdating ? '#9ca3af' : '#fee',
                        color: '#c00',
                        border: '1px solid #fcc',
                        borderRadius: '6px',
                        cursor: bulkUpdating ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        opacity: bulkUpdating ? 0.6 : 1,
                      }}
                    >
                      🗑️ Remove Selected
                    </button>
                  </>
                )}
                <button
                  onClick={handleMarkAllPendingAsOrdered}
                  disabled={bulkUpdating || pendingItems.length === 0}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: (bulkUpdating || pendingItems.length === 0) ? '#9ca3af' : '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (bulkUpdating || pendingItems.length === 0) ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    opacity: (bulkUpdating || pendingItems.length === 0) ? 0.6 : 1,
                  }}
                >
                  ✓ Mark All Pending as Ordered
                </button>
              </div>
            </div>
          )}

          {pendingItems.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                marginBottom: '1rem', 
                fontSize: '1.125rem',
                fontWeight: '700',
                color: '#111827',
              }}>
                ⏳ Pending Items ({pendingItems.length})
              </h2>
              {pendingItems.map((item) => (
                <OrderListItemComponent
                  key={item.id}
                  item={item}
                  onToggleOrdered={handleToggleOrdered}
                  onRemove={handleRemove}
                  onAddStock={handleAddStock}
                  isSelected={selectedItems.has(item.id)}
                  onSelect={handleSelectItem}
                />
              ))}
            </div>
          )}

          {orderedItems.length > 0 && (
            <div>
              <h2 style={{ 
                marginBottom: '1rem',
                fontSize: '1.125rem',
                fontWeight: '700',
                color: '#111827',
              }}>
                ✅ Ordered Items ({orderedItems.length})
              </h2>
              {orderedItems.map((item) => (
                <OrderListItemComponent
                  key={item.id}
                  item={item}
                  onToggleOrdered={handleToggleOrdered}
                  onRemove={handleRemove}
                  onAddStock={handleAddStock}
                />
              ))}
            </div>
          )}

          {items.length === 0 && (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#666',
                border: '2px dashed #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
              }}
            >
              <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No items in the order list yet.</p>
              <p style={{ color: '#9ca3af' }}>Click "Add Item" to get started.</p>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <AddItemModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setError(null) // Clear errors when closing modal
        }}
        onAdd={handleAddItem}
      />

      {showAddStockModal && selectedOrderItemForStock && (
        <AddStockFromOrderModal
          isOpen={showAddStockModal}
          onClose={() => {
            setShowAddStockModal(false)
            setSelectedOrderItemForStock(null)
          }}
          orderItem={selectedOrderItemForStock}
          onStockAdded={handleStockAdded}
        />
      )}
      </main>
    </>
  )
}

