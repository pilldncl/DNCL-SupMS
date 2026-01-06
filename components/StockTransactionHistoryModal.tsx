'use client'

import { useState, useEffect } from 'react'
import { StockService } from '@/lib/services'
import type { StockTransaction, StockItem } from '@/lib/types/supply'

interface StockTransactionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  stockItem: StockItem
}

/**
 * Modal to display transaction history for a stock item
 */
export function StockTransactionHistoryModal({
  isOpen,
  onClose,
  stockItem
}: StockTransactionHistoryModalProps) {
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && stockItem) {
      loadTransactionHistory()
    }
  }, [isOpen, stockItem])

  const loadTransactionHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const history = await StockService.getStockTransactionHistory(
        stockItem.sku_id,
        stockItem.part_type
      )
      setTransactions(history)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transaction history')
      console.error('Error loading transaction history:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const skuName = stockItem.sku?.sku_code || 
    (stockItem.sku?.brand && stockItem.sku?.model 
      ? `${stockItem.sku.brand} ${stockItem.sku.model}` 
      : `SKU ${stockItem.sku_id}`)

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
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '900px',
          width: '90%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600' }}>
              Transaction History
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
              {skuName} • {stockItem.part_type_display || stockItem.part_type}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1.5rem',
              color: '#6b7280',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          flex: 1,
        }}>
          {error && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: '#fee',
                color: '#c00',
                borderRadius: '6px',
                marginBottom: '1rem',
                border: '1px solid #fcc',
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#6b7280' }}>Loading transaction history...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6b7280',
            }}>
              <p style={{ margin: 0 }}>No transaction history found for this item.</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              {transactions.map((transaction, index) => {
                const transactionTypeColors = {
                  SET: { bg: '#dbeafe', color: '#1e40af' },
                  ADD: { bg: '#dcfce7', color: '#166534' },
                  SUBTRACT: { bg: '#fee2e2', color: '#991b1b' },
                }
                const typeColor = transactionTypeColors[transaction.transaction_type] || transactionTypeColors.SET

                return (
                  <div
                    key={transaction.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '1rem',
                      backgroundColor: index === 0 ? '#f9fafb' : 'white',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.75rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: typeColor.bg,
                          color: typeColor.color,
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                        }}>
                          {transaction.transaction_type}
                        </span>
                        {transaction.tracking_number && (
                          <span style={{
                            padding: '0.25rem 0.75rem',
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
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
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

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '1rem',
                      marginBottom: '0.75rem',
                    }}>
                      {transaction.quantity_before !== null && transaction.quantity_before !== undefined && (
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            Quantity Before
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
                            {transaction.quantity_before}
                          </div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          {transaction.transaction_type === 'SET' ? 'Quantity Set' : 'Quantity Change'}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: typeColor.color }}>
                          {transaction.transaction_type === 'SUBTRACT' ? '-' : '+'}{transaction.quantity}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          Quantity After
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
                          {transaction.quantity_after}
                        </div>
                      </div>
                    </div>

                    {transaction.notes && (
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        color: '#374151',
                        marginTop: '0.75rem',
                      }}>
                        <strong>Notes:</strong> {transaction.notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

