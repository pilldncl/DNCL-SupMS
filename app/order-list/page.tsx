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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Items to Order</h1>
          {weekCycleId && (
            <p style={{ color: '#666', marginTop: '0.5rem' }}>
              Week Cycle: {weekCycleId}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            + Add Item
          </button>
          <button
            onClick={handleResetWeek}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
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
        <p>Loading order list...</p>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Total Items:</strong> {items.length} • 
            <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>
              Pending: {pendingItems.length}
            </span>
            <span style={{ color: '#16a34a', marginLeft: '0.5rem' }}>
              Ordered: {orderedItems.length}
            </span>
          </div>

          {pendingItems.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>Pending Items ({pendingItems.length})</h2>
              {pendingItems.map((item) => (
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

          {orderedItems.length > 0 && (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Ordered Items ({orderedItems.length})</h2>
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
                borderRadius: '4px',
              }}
            >
              <p>No items in the order list yet.</p>
              <p>Click "Add Item" to get started.</p>
            </div>
          )}
        </>
      )}

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

