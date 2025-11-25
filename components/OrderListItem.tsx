'use client'

import type { OrderListItem as OrderListItemType } from '@/lib/types/supply'

interface OrderListItemProps {
  item: OrderListItemType
  onToggleOrdered: (itemId: string, isOrdered: boolean) => void
  onRemove: (itemId: string) => void
  onAddStock?: (item: OrderListItemType) => void // Optional callback when order arrives
  userId?: string
}

export function OrderListItem({ 
  item, 
  onToggleOrdered, 
  onRemove,
  onAddStock,
  userId 
}: OrderListItemProps) {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToggleOrdered(item.id, e.target.checked)
  }

  const handleRemove = () => {
    if (confirm('Remove this item from the order list?')) {
      onRemove(item.id)
    }
  }

  const skuName = item.sku?.sku_code || 
    (item.sku?.brand && item.sku?.model ? `${item.sku.brand} ${item.sku.model}` : null) ||
    `SKU ${item.sku_id}`
  const partTypeDisplay = item.part_type_display || item.part_type
  const addedByDisplay = item.added_by_name || item.added_by || 'Unknown'
  const orderedByDisplay = item.ordered_by_name || item.ordered_by || ''

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '1rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        marginBottom: '0.5rem',
        backgroundColor: item.ordered ? '#f0f9ff' : '#fff',
        opacity: item.ordered ? 0.7 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={item.ordered}
        onChange={handleCheckboxChange}
        style={{
          width: '20px',
          height: '20px',
          marginRight: '1rem',
          cursor: 'pointer',
        }}
      />

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <strong>{skuName}</strong>
          <span
            style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: '#e5e7eb',
              borderRadius: '12px',
              fontSize: '0.875rem',
            }}
          >
            {partTypeDisplay}
          </span>
          {item.quantity && (
            <span style={{ color: '#666' }}>Qty: {item.quantity}</span>
          )}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
          Added by {addedByDisplay} • {new Date(item.added_at).toLocaleDateString()}
          {item.ordered && item.ordered_at && (
            <> • Ordered {new Date(item.ordered_at).toLocaleDateString()}</>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {item.ordered && onAddStock && (
          <button
            onClick={() => onAddStock(item)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            📦 Add Stock
          </button>
        )}
        <button
          onClick={handleRemove}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#fee',
            color: '#c00',
            border: '1px solid #fcc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Remove
        </button>
      </div>
    </div>
  )
}

