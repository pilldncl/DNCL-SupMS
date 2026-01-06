'use client'

import { useState, useEffect } from 'react'
import { StockService } from '@/lib/services'
import type { StockTransaction } from '@/lib/types/supply'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { useMobile } from '@/lib/hooks/useMobile'

/**
 * Centralized Transaction History Page
 * Shows all stock transactions across all SKUs, regardless of source
 */
export default function TransactionsPage() {
  const isMobile = useMobile()
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    source: '' as '' | 'QUICK_ADD' | 'UPDATE_MODAL' | 'BULK_ENTRY' | 'ORDER_RECEIVED' | 'MANUAL',
    transactionType: '' as '' | 'SET' | 'ADD' | 'SUBTRACT',
    searchTerm: '',
  })

  useEffect(() => {
    loadAllTransactions()
  }, [])

  const loadAllTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const allTransactions = await StockService.getAllTransactionHistory()
      setTransactions(allTransactions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transaction history')
      console.error('Error loading all transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter transactions based on current filters
  const filteredTransactions = transactions.filter(t => {
    if (filters.source && t.source !== filters.source) return false
    if (filters.transactionType && t.transaction_type !== filters.transactionType) return false
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      const skuCode = t.sku?.sku_code?.toLowerCase() || ''
      const skuName = `${t.sku?.brand || ''} ${t.sku?.model || ''}`.toLowerCase()
      const tracking = t.tracking_number?.toLowerCase() || ''
      const notes = t.notes?.toLowerCase() || ''
      const partType = t.part_type_display?.toLowerCase() || t.part_type?.toLowerCase() || ''
      
      if (!skuCode.includes(searchLower) && 
          !skuName.includes(searchLower) && 
          !tracking.includes(searchLower) && 
          !notes.includes(searchLower) &&
          !partType.includes(searchLower)) {
        return false
      }
    }
    return true
  })

  const getSourceDisplay = (source: string | null | undefined) => {
    if (!source) return 'Manual'
    const sourceMap: Record<string, string> = {
      'QUICK_ADD': 'Quick Add',
      'UPDATE_MODAL': 'Update Modal',
      'BULK_ENTRY': 'Bulk Entry',
      'ORDER_RECEIVED': 'Order Received',
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
          padding: isMobile ? '1rem' : '2rem',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          {/* Header */}
          <div style={{
            marginBottom: '2rem',
          }}>
            <h1 style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '0.5rem',
            }}>
              All Stock Transactions
            </h1>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              margin: 0,
            }}>
              Complete audit trail of all stock changes across the system
            </p>
          </div>

          {/* Filters */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr',
              gap: '1rem',
              alignItems: 'end',
            }}>
              {/* Search */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by SKU, tracking, notes, part type..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              {/* Source Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  Source
                </label>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    source: e.target.value as typeof filters.source 
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    backgroundColor: 'white',
                  }}
                >
                  <option value="">All Sources</option>
                  <option value="QUICK_ADD">Quick Add</option>
                  <option value="UPDATE_MODAL">Update Modal</option>
                  <option value="BULK_ENTRY">Bulk Entry</option>
                  <option value="ORDER_RECEIVED">Order Received</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>

              {/* Transaction Type Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  Type
                </label>
                <select
                  value={filters.transactionType}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    transactionType: e.target.value as typeof filters.transactionType 
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    backgroundColor: 'white',
                  }}
                >
                  <option value="">All Types</option>
                  <option value="ADD">Add</option>
                  <option value="SUBTRACT">Subtract</option>
                  <option value="SET">Set</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb',
              fontSize: '0.875rem',
              color: '#6b7280',
            }}>
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fee',
              color: '#c00',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid #fcc',
            }}>
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}>
              <p style={{ color: '#6b7280' }}>Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}>
              <p style={{ color: '#6b7280', margin: 0 }}>
                {transactions.length === 0 
                  ? 'No transactions found.' 
                  : 'No transactions match your filters.'}
              </p>
            </div>
          ) : (
            /* Transactions List */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              {filteredTransactions.map((transaction) => {
                const typeColor = transactionTypeColors[transaction.transaction_type] || transactionTypeColors.SET
                const sourceColor = getSourceColor(transaction.source)
                const skuName = transaction.sku?.sku_code || 
                  (transaction.sku?.brand && transaction.sku?.model 
                    ? `${transaction.sku.brand} ${transaction.sku.model}` 
                    : `SKU ${transaction.sku_id}`)

                return (
                  <div
                    key={transaction.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    {/* Header Row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#111827',
                          marginBottom: '0.25rem',
                        }}>
                          {skuName}
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                        }}>
                          {transaction.part_type_display || transaction.part_type}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}>
                        <span style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: typeColor.bg,
                          color: typeColor.color,
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                        }}>
                          {transaction.transaction_type}
                        </span>
                        <span style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: sourceColor.bg,
                          color: sourceColor.color,
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                        }}>
                          {getSourceDisplay(transaction.source)}
                        </span>
                        {transaction.tracking_number && (
                          <span style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            color: '#0070f3',
                            fontWeight: '500',
                          }}>
                            📦 {transaction.tracking_number}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Info */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                      gap: '1rem',
                      marginBottom: '1rem',
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                    }}>
                      {transaction.quantity_before !== null && transaction.quantity_before !== undefined && (
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            Before
                          </div>
                          <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                            {transaction.quantity_before}
                          </div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          {transaction.transaction_type === 'SET' ? 'Set To' : 'Change'}
                        </div>
                        <div style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '600', 
                          color: typeColor.color 
                        }}>
                          {transaction.transaction_type === 'SUBTRACT' ? '-' : transaction.transaction_type === 'SET' ? '' : '+'}
                          {transaction.quantity}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          After
                        </div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                          {transaction.quantity_after}
                        </div>
                      </div>
                    </div>

                    {/* Notes and Metadata */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}>
                      {transaction.notes && (
                        <div style={{
                          flex: 1,
                          minWidth: '200px',
                          padding: '0.75rem',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          color: '#374151',
                        }}>
                          <strong>Notes:</strong> {transaction.notes}
                        </div>
                      )}
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        textAlign: 'right',
                      }}>
                        {new Date(transaction.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

