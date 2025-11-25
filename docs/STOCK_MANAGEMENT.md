# Stock Management Feature

## Overview

A complete stock/inventory management system that tracks parts and components for SKU + Part Type combinations. This allows teams to monitor stock levels, receive alerts when stock is low, and update stock when orders arrive.

## Features

### 1. Stock Tracking
- Track stock levels for each SKU + Part Type combination
- Set custom low stock thresholds per item
- Monitor stock levels in real-time

### 2. Stock Updates
- **Add/Subtract Mode**: Increment or decrement stock quantities
- **Set Quantity Mode**: Set absolute stock values
- Update low stock thresholds
- Add notes for audit trail

### 3. Low Stock Alerts
- Dashboard shows items with stock below threshold
- Color-coded alerts (yellow for low, red for out of stock)
- Quick access to stock management from alerts

### 4. Order Integration
- When orders arrive, use "Add Stock" button on ordered items
- Automatically increments stock for that SKU + Part combination
- Links orders to stock updates

## Database Schema

### Table: `supply_order_stock`

```sql
CREATE TABLE supply_order_stock (
  id UUID PRIMARY KEY,
  sku_id INTEGER REFERENCES sku_master(id),
  part_type TEXT REFERENCES supply_order_part_types(name),
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  last_updated TIMESTAMP WITH TIME ZONE,
  updated_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(sku_id, part_type)
);
```

**Key Features:**
- One stock entry per SKU + Part combination (enforced by UNIQUE constraint)
- Default low stock threshold of 5
- Tracks who updated and when
- Notes field for audit trail

## User Flow

### Updating Stock When Order Arrives

1. Navigate to **Order List** page
2. Find an item marked as "Ordered"
3. Click the **"📦 Add Stock"** button
4. Enter quantity received
5. Stock is automatically updated

### Manual Stock Management

1. Navigate to **Stock** page (from sidebar)
2. View all stock items with status indicators
3. Click **"Update"** on any item
4. Choose mode:
   - **Add/Subtract**: Adjust quantity relative to current
   - **Set Quantity**: Set absolute value
5. Optionally update low stock threshold
6. Add notes if needed
7. Save changes

### Monitoring Low Stock

1. View **Dashboard** to see low stock alerts
2. Click on alert to go to Stock page
3. Filter by "Low Stock" or "Out of Stock"
4. Update stock levels as needed

## Components

### `StockService` (`lib/services/stock-service.ts`)
- `getAllStock()` - Get all stock items
- `getStockItem(skuId, partType)` - Get specific stock item
- `getLowStockItems()` - Get items below threshold
- `updateStock()` - Add/subtract quantity
- `setStock()` - Set absolute quantity
- `getStockSummary()` - Get statistics

### `StockPage` (`app/stock/page.tsx`)
- Main stock management interface
- Filter by status (all, low, out)
- Search by SKU, brand, model, part type
- Summary cards showing totals

### `UpdateStockModal` (`components/UpdateStockModal.tsx`)
- Modal for updating stock quantities
- Supports add/subtract and set quantity modes
- Update threshold and notes

### `AddStockFromOrderModal` (`components/AddStockFromOrderModal.tsx`)
- Quick stock update when order arrives
- Pre-filled with order quantity
- One-click stock addition

## Integration Points

### Dashboard
- Shows low stock alerts
- Links to stock management
- Quick actions include "Manage Stock"

### Order List
- "Add Stock" button on ordered items
- Seamless workflow from order to stock update

### Sidebar Navigation
- New "Stock" menu item for quick access

## Future Enhancements

Potential improvements:
- Stock history/audit log
- Bulk stock updates
- Stock movement tracking
- Integration with external inventory systems
- Stock reports and analytics
- Automatic reorder suggestions based on stock levels and order history

