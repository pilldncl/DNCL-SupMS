'use client'

import { useState, useEffect } from 'react'
import { StockService } from '@/lib/services'
import type { DailyTransactionReport, StockTransaction } from '@/lib/types/supply'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { useMobile } from '@/lib/hooks/useMobile'
import { SystemNotification } from '@/components/SystemNotification'

/**
 * Daily Operations Report Page - Compact Design
 * Shows what was added/changed each day without needing to recount
 */
export default function DailyReportPage() {
  const isMobile = useMobile()
  const [report, setReport] = useState<DailyTransactionReport | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSKUs, setExpandedSKUs] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadAvailableDates()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      const [year, month, day] = selectedDate.split('-').map(Number)
      const dateObj = new Date(year, month - 1, day)
      loadDailyReport(dateObj)
    }
  }, [selectedDate])

  const loadAvailableDates = async () => {
    try {
      const dates = await StockService.getAvailableReportDates(30)
      setAvailableDates(dates)
    } catch (err) {
      console.error('[DailyReport] Error loading available dates:', err)
    }
  }

  const loadDailyReport = async (date: Date) => {
    setLoading(true)
    setError(null)
    try {
      const dailyReport = await StockService.getDailyTransactionReport(date)
      setReport(dailyReport)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load daily report'
      setError(errorMessage)
      console.error('[DailyReport] Error loading daily report:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSourceDisplay = (source: string | null | undefined) => {
    if (!source) return 'Manual'
    const sourceMap: Record<string, string> = {
      'QUICK_ADD': 'Quick Add',
      'UPDATE_MODAL': 'Update',
      'BULK_ENTRY': 'Bulk',
      'ORDER_RECEIVED': 'Order',
      'MANUAL': 'Manual',
    }
    return sourceMap[source] || source
  }

  const getSourceColor = (source: string | null | undefined) => {
    if (!source) return { bg: '#f3f4f6', color: '#6b7280' }
    const colorMap: Record<string, { bg: string; color: string }> = {
      'QUICK_ADD': { bg: '#dbeafe', color: '#1e40af' },
      'UPDATE_MODAL': { bg: '#fef3c7', color: '#92400e' },
      'BULK_ENTRY': { bg: '#e0e7ff', color: '#3730a3' },
      'ORDER_RECEIVED': { bg: '#dcfce7', color: '#166534' },
      'MANUAL': { bg: '#f3f4f6', color: '#6b7280' },
    }
    return colorMap[source] || { bg: '#f3f4f6', color: '#6b7280' }
  }

  const transactionTypeColors = {
    SET: { bg: '#dbeafe', color: '#1e40af' },
    ADD: { bg: '#dcfce7', color: '#166534' },
    SUBTRACT: { bg: '#fee2e2', color: '#991b1b' },
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    if (!selectedDate) return
    
    const currentDate = new Date(selectedDate)
    currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
    
    const newDateStr = currentDate.toISOString().split('T')[0]
    setSelectedDate(newDateStr)
  }

  // Group transactions by SKU
  const groupTransactionsBySKU = (transactions: StockTransaction[]) => {
    const grouped = new Map<number, {
      sku: StockTransaction['sku']
      skuId: number
      transactions: StockTransaction[]
      totalAdded: number
      totalSubtracted: number
      totalSet: number
      netChange: number
      partTypes: Set<string>
      sources: Set<string>
    }>()

    transactions.forEach(transaction => {
      const skuId = transaction.sku_id
      if (!grouped.has(skuId)) {
        grouped.set(skuId, {
          sku: transaction.sku,
          skuId,
          transactions: [],
          totalAdded: 0,
          totalSubtracted: 0,
          totalSet: 0,
          netChange: 0,
          partTypes: new Set(),
          sources: new Set(),
        })
      }

      const group = grouped.get(skuId)!
      group.transactions.push(transaction)
      group.partTypes.add(transaction.part_type_display || transaction.part_type)
      if (transaction.source) {
        group.sources.add(transaction.source)
      }

      if (transaction.transaction_type === 'ADD') {
        group.totalAdded += transaction.quantity
        group.netChange += transaction.quantity
      } else if (transaction.transaction_type === 'SUBTRACT') {
        group.totalSubtracted += transaction.quantity
        group.netChange -= transaction.quantity
      } else if (transaction.transaction_type === 'SET') {
        group.totalSet += 1
        // For SET, net change is calculated from quantity_after - quantity_before
        if (transaction.quantity_before != null && transaction.quantity_after != null) {
          group.netChange += (transaction.quantity_after - transaction.quantity_before)
        }
      }
    })

    return Array.from(grouped.values())
  }

  const toggleSKU = (skuId: number) => {
    setExpandedSKUs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(skuId)) {
        newSet.delete(skuId)
      } else {
        newSet.add(skuId)
      }
      return newSet
    })
  }

  const getSKUDisplayName = (transaction: StockTransaction) => {
    if (transaction.sku?.sku_code) return transaction.sku.sku_code
    if (transaction.sku?.brand && transaction.sku?.model) {
      return `${transaction.sku.brand} ${transaction.sku.model}`
    }
    return `SKU ${transaction.sku_id}`
  }

  return (
    <>
      <Sidebar />
      <main style={{
        marginLeft: isMobile ? 0 : '250px',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        transition: 'margin-left 0.3s ease',
      }}>
        <TopBar />
        
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          {/* Integrated System Notification */}
          <SystemNotification />
          
          {/* Enhanced Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            color: 'white',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}>
              <div>
                <h1 style={{
                  fontSize: isMobile ? '1.75rem' : '2rem',
                  fontWeight: '700',
                  color: 'white',
                  margin: 0,
                  marginBottom: '0.25rem',
                }}>
                  📊 Daily Operations Report
                </h1>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  margin: 0,
                }}>
                  {report ? formatDate(report.date) : 'Select a date'} • Track your inventory changes at a glance
                </p>
              </div>

              {/* Compact Date Controls */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => navigateDate('prev')}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#374151',
                  }}
                  title="Previous Day"
                >
                  ←
                </button>
                
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    width: '140px',
                    backgroundColor: 'white',
                  }}
                />

                <button
                  onClick={() => navigateDate('next')}
                  disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    cursor: selectedDate >= new Date().toISOString().split('T')[0] ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    color: selectedDate >= new Date().toISOString().split('T')[0] ? '#9ca3af' : '#374151',
                    opacity: selectedDate >= new Date().toISOString().split('T')[0] ? 0.5 : 1,
                  }}
                  title="Next Day"
                >
                  →
                </button>

                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  Today
                </button>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fee',
              color: '#c00',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}>
              <p style={{ color: '#6b7280' }}>Loading...</p>
            </div>
          ) : !report ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}>
              <p style={{ color: '#6b7280', margin: 0 }}>No transactions found for this date</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              {/* Enhanced Summary Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)',
                  color: 'white',
                }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: '500' }}>
                    📦 SKUs Changed
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: 'white' }}>
                    {report.summary.uniqueSKUs}
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                    {report.summary.uniquePartTypes} part types
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  boxShadow: '0 4px 6px rgba(245, 87, 108, 0.3)',
                  color: 'white',
                }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: '500' }}>
                    🔄 Total Transactions
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: 'white' }}>
                    {report.summary.totalTransactions}
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                    Across all SKUs
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  boxShadow: '0 4px 6px rgba(79, 172, 254, 0.3)',
                  color: 'white',
                }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: '500' }}>
                    ➕ Items Added
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: 'white' }}>
                    +{report.summary.totalAdded}
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: '0.8', marginTop: '0.25rem' }}>
                    New inventory
                  </div>
                </div>

                {report.summary.totalSubtracted > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: '0 4px 6px rgba(250, 112, 154, 0.3)',
                    color: 'white',
                  }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: '500' }}>
                      ➖ Items Removed
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'white' }}>
                      -{report.summary.totalSubtracted}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                      Inventory out
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced SKU-Grouped View */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
              }}>
                <div style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '2px solid #e5e7eb',
                  background: 'linear-gradient(to right, #f8fafc, #ffffff)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>📋</span>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: '#111827',
                      margin: 0,
                    }}>
                      SKU Activity Summary
                    </h3>
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      backgroundColor: '#f3f4f6',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontWeight: '500',
                    }}>
                      {report.summary.uniqueSKUs} SKUs • {report.transactions.length} transactions
                    </span>
                  </div>
                </div>
                
                {(() => {
                  const skuGroups = groupTransactionsBySKU(report.transactions)
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {skuGroups.map((skuGroup, groupIdx) => {
                        const isExpanded = expandedSKUs.has(skuGroup.skuId)
                        const skuName = getSKUDisplayName(skuGroup.transactions[0])
                        const netChangeColor = skuGroup.netChange > 0 ? '#166534' : skuGroup.netChange < 0 ? '#991b1b' : '#6b7280'
                        
                        return (
                          <div key={skuGroup.skuId} style={{
                            borderBottom: groupIdx < skuGroups.length - 1 ? '1px solid #e5e7eb' : 'none',
                            backgroundColor: groupIdx % 2 === 0 ? 'white' : '#f9fafb',
                          }}>
                            {/* Enhanced SKU Summary Row */}
                            <div
                              onClick={() => toggleSKU(skuGroup.skuId)}
                              style={{
                                padding: '1rem 1.25rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'all 0.2s ease',
                                backgroundColor: groupIdx % 2 === 0 ? 'white' : '#fafbfc',
                                borderLeft: isExpanded ? '4px solid #667eea' : '4px solid transparent',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f0f4ff'
                                e.currentTarget.style.transform = 'translateX(2px)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = groupIdx % 2 === 0 ? 'white' : '#fafbfc'
                                e.currentTarget.style.transform = 'translateX(0)'
                              }}
                            >
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: isExpanded 
                                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                  : 'linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.875rem',
                                color: isExpanded ? 'white' : '#667eea',
                                fontWeight: '600',
                                transition: 'all 0.2s ease',
                              }}>
                                {isExpanded ? '▼' : '▶'}
                              </div>
                              
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: '0.95rem',
                                  fontWeight: '700',
                                  color: '#111827',
                                  marginBottom: '0.375rem',
                                  letterSpacing: '-0.01em',
                                }}>
                                  {skuName}
                                </div>
                                <div style={{
                                  fontSize: '0.8rem',
                                  color: '#6b7280',
                                  display: 'flex',
                                  gap: '0.75rem',
                                  flexWrap: 'wrap',
                                  alignItems: 'center',
                                }}>
                                  <span style={{
                                    backgroundColor: '#f0f4ff',
                                    color: '#667eea',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '6px',
                                    fontWeight: '500',
                                    fontSize: '0.75rem',
                                  }}>
                                    {skuGroup.transactions.length} {skuGroup.transactions.length === 1 ? 'transaction' : 'transactions'}
                                  </span>
                                  <span style={{ color: '#d1d5db' }}>•</span>
                                  <span style={{ fontWeight: '500' }}>{Array.from(skuGroup.partTypes).join(', ')}</span>
                                </div>
                              </div>
                              
                              <div style={{
                                display: 'flex',
                                gap: '1.5rem',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                              }}>
                                {skuGroup.totalAdded > 0 && (
                                  <div style={{
                                    textAlign: 'right',
                                    padding: '0.5rem 0.75rem',
                                    backgroundColor: '#dcfce7',
                                    borderRadius: '8px',
                                    minWidth: '70px',
                                  }}>
                                    <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: '500', marginBottom: '0.125rem' }}>Added</div>
                                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#166534' }}>
                                      +{skuGroup.totalAdded}
                                    </div>
                                  </div>
                                )}
                                {skuGroup.totalSubtracted > 0 && (
                                  <div style={{
                                    textAlign: 'right',
                                    padding: '0.5rem 0.75rem',
                                    backgroundColor: '#fee2e2',
                                    borderRadius: '8px',
                                    minWidth: '70px',
                                  }}>
                                    <div style={{ fontSize: '0.7rem', color: '#991b1b', fontWeight: '500', marginBottom: '0.125rem' }}>Removed</div>
                                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#991b1b' }}>
                                      -{skuGroup.totalSubtracted}
                                    </div>
                                  </div>
                                )}
                                <div style={{
                                  textAlign: 'right',
                                  padding: '0.5rem 0.75rem',
                                  background: netChangeColor === '#166534' 
                                    ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                                    : netChangeColor === '#991b1b'
                                    ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                                    : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                                  borderRadius: '8px',
                                  minWidth: '90px',
                                  border: `2px solid ${netChangeColor === '#166534' ? '#86efac' : netChangeColor === '#991b1b' ? '#fca5a5' : '#d1d5db'}`,
                                }}>
                                  <div style={{ fontSize: '0.7rem', color: netChangeColor, fontWeight: '600', marginBottom: '0.125rem' }}>Net Change</div>
                                  <div style={{
                                    fontSize: '1.125rem',
                                    fontWeight: '700',
                                    color: netChangeColor,
                                  }}>
                                    {skuGroup.netChange > 0 ? '+' : ''}{skuGroup.netChange}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Expanded Transactions */}
                            {isExpanded && (
                              <div style={{
                                backgroundColor: '#ffffff',
                                borderTop: '1px solid #e5e7eb',
                                padding: '0.5rem 0',
                              }}>
                                {isMobile ? (
                                  // Mobile: Compact transaction list
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {skuGroup.transactions.map((transaction, txIdx) => {
                                      const typeColor = transactionTypeColors[transaction.transaction_type] || transactionTypeColors.SET
                                      const sourceColor = getSourceColor(transaction.source)
                                      
                                      return (
                                        <div
                                          key={transaction.id}
                                          style={{
                                            padding: '0.5rem 1rem 0.5rem 3rem',
                                            borderBottom: txIdx < skuGroup.transactions.length - 1 ? '1px solid #f3f4f6' : 'none',
                                            backgroundColor: txIdx % 2 === 0 ? '#ffffff' : '#fafafa',
                                          }}
                                        >
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                            <div style={{ flex: 1 }}>
                                              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.125rem' }}>
                                                {transaction.part_type_display || transaction.part_type}
                                              </div>
                                              <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                                                {new Date(transaction.created_at).toLocaleTimeString('en-US', {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                })}
                                              </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                              <span style={{
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: typeColor.bg,
                                                color: typeColor.color,
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: '600',
                                              }}>
                                                {transaction.transaction_type === 'SUBTRACT' ? '-' : transaction.transaction_type === 'SET' ? '' : '+'}
                                                {transaction.quantity}
                                              </span>
                                              <span style={{
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: sourceColor.bg,
                                                color: sourceColor.color,
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                              }}>
                                                {getSourceDisplay(transaction.source)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  // Desktop: Table view for transactions
                                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
                                        <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: '600', color: '#6b7280' }}>Time</th>
                                        <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: '600', color: '#6b7280' }}>Part Type</th>
                                        <th style={{ padding: '0.5rem 1rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: '600', color: '#6b7280' }}>Type</th>
                                        <th style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.7rem', fontWeight: '600', color: '#6b7280' }}>Quantity</th>
                                        <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: '600', color: '#6b7280' }}>Source</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {skuGroup.transactions.map((transaction, txIdx) => {
                                        const typeColor = transactionTypeColors[transaction.transaction_type] || transactionTypeColors.SET
                                        const sourceColor = getSourceColor(transaction.source)
                                        
                                        return (
                                          <tr
                                            key={transaction.id}
                                            style={{
                                              borderBottom: txIdx < skuGroup.transactions.length - 1 ? '1px solid #f3f4f6' : 'none',
                                              backgroundColor: txIdx % 2 === 0 ? '#ffffff' : '#fafafa',
                                            }}
                                          >
                                            <td style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                                              {new Date(transaction.created_at).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })}
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                                              {transaction.part_type_display || transaction.part_type}
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>
                                              <span style={{
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: typeColor.bg,
                                                color: typeColor.color,
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: '600',
                                              }}>
                                                {transaction.transaction_type}
                                              </span>
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: typeColor.color }}>
                                              {transaction.transaction_type === 'SUBTRACT' ? '-' : transaction.transaction_type === 'SET' ? '' : '+'}
                                              {transaction.quantity}
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem' }}>
                                              <span style={{
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: sourceColor.bg,
                                                color: sourceColor.color,
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: '500',
                                              }}>
                                                {getSourceDisplay(transaction.source)}
                                              </span>
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
