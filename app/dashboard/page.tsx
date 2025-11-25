'use client'

import { useState, useEffect } from 'react'
import { OrderListService, StockService } from '@/lib/services'
import type { OrderListSummary, OrderListItem, WeekCycle, StockItem } from '@/lib/types/supply'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { QuickAddOrderListForm } from '@/components/QuickAddOrderListForm'
import { EditOrderItemModal } from '@/components/EditOrderItemModal'
import { useMobile } from '@/lib/hooks/useMobile'

/**
 * Professional Dashboard - Simplified, Less Cluttered
 */
export default function DashboardPage() {
  const isMobile = useMobile()
  const [summary, setSummary] = useState<OrderListSummary | null>(null)
  const [weekCycle, setWeekCycle] = useState<WeekCycle | null>(null)
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])
  const [latestArrivals, setLatestArrivals] = useState<StockItem[]>([])
  const [recentOrderItems, setRecentOrderItems] = useState<OrderListItem[]>([])
  const [stockSummary, setStockSummary] = useState<{
    total_items: number
    low_stock_count: number
    out_of_stock_count: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddOrderForm, setShowAddOrderForm] = useState(false)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<OrderListItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryData, cycle, lowStock, stockStats, latest, orderItems] = await Promise.all([
        OrderListService.getOrderListSummary(),
        OrderListService.getCurrentWeekCycle(),
        StockService.getLowStockItems().catch(() => []), // Don't fail dashboard if stock fails
        StockService.getStockSummary().catch(() => null), // Don't fail dashboard if stock fails
        StockService.getLatestArrivals(5).catch(() => []), // Don't fail dashboard if stock fails
        OrderListService.getCurrentOrderList().catch(() => []), // Don't fail dashboard if order list fails
      ])
      setSummary(summaryData)
      setWeekCycle(cycle)
      setLowStockItems(lowStock)
      setStockSummary(stockStats)
      setLatestArrivals(latest)
      // Get most recent 10 items
      setRecentOrderItems(orderItems.slice(0, 10))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOrderItemAdded = () => {
    loadDashboardData() // Refresh dashboard data
  }

  const handleMarkAsOrdered = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      await OrderListService.markAsOrdered(itemId)
      await loadDashboardData() // Refresh to show updated status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark item as ordered')
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleEditItem = (item: OrderListItem) => {
    setEditingItem(item)
    setShowEditModal(true)
  }

  const handleUpdateItem = async (itemId: string, quantity?: number, ordered?: boolean) => {
    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      await OrderListService.updateItemQuantity(itemId, quantity)
      // Handle status change separately if needed
      if (ordered !== undefined) {
        const currentItem = recentOrderItems.find(item => item.id === itemId)
        if (currentItem && currentItem.ordered !== ordered) {
          if (ordered) {
            await OrderListService.markAsOrdered(itemId)
          } else {
            await OrderListService.unmarkAsOrdered(itemId)
          }
        }
      }
      await loadDashboardData() // Refresh to show updated quantity and status
    } catch (err) {
      throw err // Let modal handle error display
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        marginLeft: '240px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#0070f3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <>
        <Sidebar />
        <TopBar />
        <main style={{ 
          marginLeft: '240px', 
          marginTop: '64px',
          padding: '2rem',
        }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fee',
              color: '#c00',
              borderRadius: '8px',
              border: '1px solid #fcc',
            }}
          >
            {error}
          </div>
        </main>
      </>
    )
  }

  if (!summary) {
    return null
  }

  const weekStartDate = weekCycle?.start_date 
    ? new Date(weekCycle.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''
  const weekEndDate = weekCycle?.end_date
    ? new Date(weekCycle.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''

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
        {/* Welcome Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '2rem' 
        }}>
          <div>
            <h1 style={{ 
              margin: '0 0 0.5rem 0',
              fontSize: '1.875rem',
              fontWeight: '700',
              color: '#111827',
            }}>
              Welcome back! 👋
            </h1>
            {weekCycle && (
              <p style={{ 
                margin: 0,
                color: '#6b7280', 
                fontSize: '0.95rem',
              }}>
                Week {weekCycle.id} • {weekStartDate} - {weekEndDate}
              </p>
            )}
          </div>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              backgroundColor: loading ? '#9ca3af' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#0051cc'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#0070f3'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            <span>{loading ? '⟳' : '↻'}</span>
            <span>{loading ? 'Updating...' : 'Update'}</span>
          </button>
        </div>

        {/* Two Column Layout: Order List & Stock */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
          gap: '2rem', 
          marginBottom: '2rem' 
        }}>
          {/* Order List Overview Section */}
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.125rem', 
                fontWeight: '700', 
                color: '#111827' 
              }}>
                📋 Order List
              </h2>
              <Link
                href="/order-list"
                style={{
                  fontSize: '0.875rem',
                  color: '#0070f3',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none'
                }}
              >
                View All →
              </Link>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1rem'
            }}>
              <MetricCard
                title="Pending"
                value={summary.pending_items}
                icon="⏳"
                color="#f59e0b"
                bgColor="#fffbeb"
              />
              <MetricCard
                title="Completed"
                value={summary.ordered_items}
                icon="✅"
                color="#10b981"
                bgColor="#ecfdf5"
              />
            </div>
          </div>

          {/* Stock Overview Section */}
          {stockSummary && (
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '1.125rem', 
                  fontWeight: '700', 
                  color: '#111827' 
                }}>
                  📊 Stock Inventory
                </h2>
                <Link
                  href="/stock"
                  style={{
                    fontSize: '0.875rem',
                    color: '#0070f3',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none'
                  }}
                >
                  Manage →
                </Link>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem', 
                marginBottom: '1rem' 
              }}>
                <MetricCard
                  title="Low Stock"
                  value={stockSummary.low_stock_count}
                  icon="⚠️"
                  color={stockSummary.low_stock_count > 0 ? '#f59e0b' : '#6b7280'}
                  bgColor={stockSummary.low_stock_count > 0 ? '#fffbeb' : '#f3f4f6'}
                />
                <MetricCard
                  title="Out of Stock"
                  value={stockSummary.out_of_stock_count}
                  icon="🔴"
                  color={stockSummary.out_of_stock_count > 0 ? '#dc2626' : '#6b7280'}
                  bgColor={stockSummary.out_of_stock_count > 0 ? '#fee' : '#f3f4f6'}
                />
              </div>

              {/* Stock Status Summary - Clickable */}
              <Link
                href="/stock"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                }}
              >
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = '#0070f3'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                }}
                >
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#0070f3', fontWeight: '500' }}>View All →</span>
                  </div>
                  
                  {/* Latest Arrivals */}
                  {latestArrivals.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '600', 
                        color: '#374151',
                        marginBottom: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        📦 Latest Arrivals
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {latestArrivals.slice(0, 3).map((item) => {
                          const skuName = item.sku?.sku_code || 
                            (item.sku?.brand && item.sku?.model 
                              ? `${item.sku.brand} ${item.sku.model}` 
                              : `SKU ${item.sku_id}`)
                          const dateStr = item.last_updated 
                            ? new Date(item.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : ''
                          
                          return (
                            <div
                              key={`${item.sku_id}-${item.part_type}`}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                padding: '0.75rem',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f3f4f6'
                                e.currentTarget.style.borderColor = '#d1d5db'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#f9fafb'
                                e.currentTarget.style.borderColor = '#e5e7eb'
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0, marginRight: '0.75rem' }}>
                                <div style={{ 
                                  fontWeight: '600', 
                                  color: '#111827',
                                  fontSize: '0.8rem',
                                  marginBottom: '0.25rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {skuName}
                                </div>
                                <div style={{ 
                                  color: '#6b7280',
                                  fontSize: '0.7rem',
                                  fontWeight: '500',
                                }}>
                                  {item.part_type_display || item.part_type}
                                </div>
                              </div>
                              <div style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: '0.25rem',
                              }}>
                                <div style={{ 
                                  fontSize: '0.8rem',
                                  fontWeight: '700',
                                  color: '#16a34a',
                                  backgroundColor: '#dcfce7',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  whiteSpace: 'nowrap',
                                }}>
                                  Qty: {item.quantity}
                                </div>
                                <div style={{ 
                                  fontSize: '0.7rem',
                                  color: '#6b7280',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {dateStr}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Low Stock Items */}
                  {lowStockItems.length > 0 && (
                    <div>
                      <Link
                        href="/stock?filter=low"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: '0.75rem', 
                          fontWeight: '600', 
                          color: '#f59e0b',
                          marginBottom: '0.5rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          textDecoration: 'none',
                          display: 'block',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none'
                        }}
                      >
                        ⚠️ Low Stock ({lowStockItems.length})
                      </Link>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {lowStockItems.slice(0, 3).map((item) => {
                          const skuName = item.sku?.sku_code || 
                            (item.sku?.brand && item.sku?.model 
                              ? `${item.sku.brand} ${item.sku.model}` 
                              : `SKU ${item.sku_id}`)
                          const isOutOfStock = item.quantity === 0
                          
                          return (
                            <div
                              key={`${item.sku_id}-${item.part_type}`}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.5rem',
                                backgroundColor: isOutOfStock ? '#fee' : '#fffbeb',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                border: `1px solid ${isOutOfStock ? '#fcc' : '#fde68a'}`,
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                  fontWeight: '500', 
                                  color: '#111827',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {skuName}
                                </div>
                                <div style={{ 
                                  color: '#6b7280',
                                  fontSize: '0.7rem',
                                }}>
                                  {item.part_type_display || item.part_type}
                                </div>
                              </div>
                              <div style={{ 
                                fontSize: '0.7rem',
                                fontWeight: '600',
                                color: isOutOfStock ? '#dc2626' : '#f59e0b',
                                marginLeft: '0.5rem',
                                whiteSpace: 'nowrap',
                              }}>
                                {isOutOfStock ? 'Out' : `Qty: ${item.quantity}`}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {lowStockItems.length > 3 && (
                        <div style={{ 
                          marginTop: '0.5rem',
                          fontSize: '0.7rem',
                          color: '#0070f3',
                          textAlign: 'center',
                          fontWeight: '500',
                        }}>
                          + {lowStockItems.length - 3} more items need attention
                        </div>
                      )}
                    </div>
                  )}
                  
                  {latestArrivals.length === 0 && lowStockItems.length === 0 && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      marginTop: '0.5rem',
                    }}>
                      {stockSummary.total_items - stockSummary.low_stock_count - stockSummary.out_of_stock_count} in good standing
                    </div>
                  )}
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Stock Alert Widget - Only show if there are issues */}
        {stockSummary && (lowStockItems.length > 0 || stockSummary.out_of_stock_count > 0) && (
          <div style={{
            backgroundColor: stockSummary.out_of_stock_count > 0 ? '#fee' : '#fffbeb',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: `2px solid ${stockSummary.out_of_stock_count > 0 ? '#fcc' : '#fde68a'}`,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ 
                  margin: '0 0 0.5rem 0', 
                  fontSize: '1.125rem', 
                  fontWeight: '700',
                  color: stockSummary.out_of_stock_count > 0 ? '#dc2626' : '#f59e0b',
                }}>
                  {stockSummary.out_of_stock_count > 0 ? '🚨 Stock Alert' : '⚠️ Low Stock Alert'}
                </h2>
                <p style={{ 
                  margin: 0,
                  color: '#6b7280', 
                  fontSize: '0.875rem',
                }}>
                  {stockSummary.out_of_stock_count > 0 
                    ? `${stockSummary.out_of_stock_count} item(s) are out of stock and need immediate attention`
                    : `${lowStockItems.length} item(s) are running low on stock`
                  }
                </p>
              </div>
              <Link
                href="/stock"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: stockSummary.out_of_stock_count > 0 ? '#dc2626' : '#f59e0b',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = stockSummary.out_of_stock_count > 0 ? '#b91c1c' : '#d97706'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = stockSummary.out_of_stock_count > 0 ? '#dc2626' : '#f59e0b'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              >
                <span>📊</span>
                <span>View Stock</span>
              </Link>
            </div>

            {/* Show top 5 low stock items */}
            {lowStockItems.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '0.75rem',
                }}>
                  Critical Items ({Math.min(lowStockItems.length, 5)} of {lowStockItems.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {lowStockItems.slice(0, 5).map((item) => {
                    const skuName = item.sku?.sku_code || 
                      (item.sku?.brand && item.sku?.model 
                        ? `${item.sku.brand} ${item.sku.model}` 
                        : `SKU ${item.sku_id}`)
                    const isOutOfStock = item.quantity === 0
                    
                    return (
                      <div
                        key={`${item.sku_id}-${item.part_type}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          backgroundColor: isOutOfStock ? '#fee' : 'white',
                          borderRadius: '6px',
                          border: `1px solid ${isOutOfStock ? '#fcc' : '#e5e7eb'}`,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '500', 
                            color: '#111827',
                            marginBottom: '0.25rem',
                          }}>
                            {skuName}
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#6b7280',
                          }}>
                            {item.part_type_display || item.part_type}
                          </div>
                        </div>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '700',
                          color: isOutOfStock ? '#dc2626' : '#f59e0b',
                          marginLeft: '1rem',
                        }}>
                          {isOutOfStock ? 'Out of Stock' : `Qty: ${item.quantity}`}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {lowStockItems.length > 5 && (
                  <div style={{ 
                    marginTop: '0.75rem',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    textAlign: 'center',
                  }}>
                    + {lowStockItems.length - 5} more item(s) need attention
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Add to Order List Form (shown when button clicked) */}
        {showAddOrderForm && (
          <div style={{ marginBottom: '2rem', position: 'relative' }}>
            <QuickAddOrderListForm 
              onItemAdded={() => {
                handleOrderItemAdded()
                setShowAddOrderForm(false) // Hide form after successful add
              }} 
            />
            <button
              onClick={() => setShowAddOrderForm(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#666',
                padding: '0.25rem 0.5rem',
                lineHeight: 1,
                borderRadius: '4px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.color = '#111827'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#666'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Recent Order List Additions */}
        {recentOrderItems.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem',
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.125rem', 
                fontWeight: '700', 
                color: '#111827' 
              }}>
                📋 Recent Order List Additions
              </h2>
              <Link
                href="/order-list"
                style={{
                  fontSize: '0.875rem',
                  color: '#0070f3',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none'
                }}
              >
                View All →
              </Link>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '0.75rem', 
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                    }}>
                      SKU
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '0.75rem', 
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                    }}>
                      Part Type
                    </th>
                    <th style={{ 
                      textAlign: 'center', 
                      padding: '0.75rem', 
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                    }}>
                      Quantity
                    </th>
                    <th style={{ 
                      textAlign: 'center', 
                      padding: '0.75rem', 
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                    }}>
                      Status
                    </th>
                    <th style={{ 
                      textAlign: 'right', 
                      padding: '0.75rem', 
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                    }}>
                      Added
                    </th>
                    <th style={{ 
                      textAlign: 'center', 
                      padding: '0.75rem', 
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrderItems.map((item) => {
                    const skuName = item.sku?.sku_code || 
                      (item.sku?.brand && item.sku?.model 
                        ? `${item.sku.brand} ${item.sku.model}` 
                        : `SKU ${item.sku_id}`)
                    const addedDate = new Date(item.added_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    
                    return (
                      <tr 
                        key={item.id}
                        style={{ 
                          borderBottom: '1px solid #f3f4f6',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <td style={{ 
                          padding: '0.75rem', 
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#111827',
                        }}>
                          {skuName}
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          fontSize: '0.875rem',
                          color: '#6b7280',
                        }}>
                          {item.part_type_display || item.part_type}
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          fontSize: '0.875rem',
                          textAlign: 'center',
                          color: '#6b7280',
                        }}>
                          {item.quantity || '-'}
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          fontSize: '0.875rem',
                          textAlign: 'center',
                        }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: item.ordered ? '#dcfce7' : '#fef3c7',
                            color: item.ordered ? '#166534' : '#92400e',
                          }}>
                            {item.ordered ? '✅ Ordered' : '⏳ Pending'}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          fontSize: '0.75rem',
                          textAlign: 'right',
                          color: '#6b7280',
                        }}>
                          {addedDate}
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          fontSize: '0.875rem',
                          textAlign: 'center',
                        }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleEditItem(item)}
                              disabled={updatingItems.has(item.id)}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: updatingItems.has(item.id) ? '#9ca3af' : '#0070f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: updatingItems.has(item.id) ? 'not-allowed' : 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                opacity: updatingItems.has(item.id) ? 0.6 : 1,
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                if (!updatingItems.has(item.id)) {
                                  e.currentTarget.style.backgroundColor = '#0051cc'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!updatingItems.has(item.id)) {
                                  e.currentTarget.style.backgroundColor = '#0070f3'
                                }
                              }}
                            >
                              ✏️ Modify
                            </button>
                            {!item.ordered && (
                              <button
                                onClick={() => handleMarkAsOrdered(item.id)}
                                disabled={updatingItems.has(item.id)}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: updatingItems.has(item.id) ? '#9ca3af' : '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: updatingItems.has(item.id) ? 'not-allowed' : 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  opacity: updatingItems.has(item.id) ? 0.6 : 1,
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  if (!updatingItems.has(item.id)) {
                                    e.currentTarget.style.backgroundColor = '#059669'
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!updatingItems.has(item.id)) {
                                    e.currentTarget.style.backgroundColor = '#10b981'
                                  }
                                }}
                              >
                                {updatingItems.has(item.id) ? '...' : '✓ Mark Ordered'}
                              </button>
                            )}
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

        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}>
          <h2 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1rem', 
            fontWeight: '600',
            color: '#111827',
          }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAddOrderForm(!showAddOrderForm)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: showAddOrderForm ? '#0051cc' : '#0070f3',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!showAddOrderForm) {
                  e.currentTarget.style.backgroundColor = '#0051cc'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (!showAddOrderForm) {
                  e.currentTarget.style.backgroundColor = '#0070f3'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }
              }}
            >
              <span>+</span>
              <span>Add Item to Order</span>
            </button>
            <Link
              href="/order-list"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f3f4f6',
                color: '#111827',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
            >
              <span>📋</span>
              <span>View Order List</span>
            </Link>
            <Link
              href="/skus"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f3f4f6',
                color: '#111827',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
            >
              <span>📦</span>
              <span>Manage SKUs</span>
            </Link>
          </div>
        </div>

        {/* Edit Order Item Modal */}
        {showEditModal && editingItem && (
          <EditOrderItemModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setEditingItem(null)
            }}
            orderItem={editingItem}
            onUpdate={handleUpdateItem}
          />
        )}

        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    </>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  icon: string
  color: string
  bgColor: string
}

function MetricCard({ title, value, icon, color, bgColor }: MetricCardProps) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      e.currentTarget.style.transform = 'translateY(-2px)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      e.currentTarget.style.transform = 'translateY(0)'
    }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        marginBottom: '1rem',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '10px',
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', lineHeight: 1 }}>
            {value}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500', marginTop: '0.25rem' }}>
            {title}
          </div>
        </div>
      </div>
    </div>
  )
}
