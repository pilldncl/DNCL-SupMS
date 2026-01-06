# Stock Transaction Logic Analysis & Fix Plan

## Current Issues Identified

### Issue 1: Math Doesn't Update (Overwriting Instead of Adding)

**Problem:**
- Day 1: Add 200 pieces → Stock = 200 ✅
- Day 2: Add 200 more pieces → Stock = 200 ❌ (should be 400)

**Root Cause:**
- `QuickAddStockForm` uses `StockService.setStock()` which **SETS** absolute quantity
- `setStock(200)` replaces existing stock instead of adding to it
- User expects "Quick Add" to **ADD** to existing stock

**Current Flow:**
```
QuickAddStockForm → StockService.setStock(200) → Updates stock to 200 (overwrites)
```

**Expected Flow:**
```
QuickAddStockForm → StockService.updateStock(+200) → Adds 200 to existing (200 + 200 = 400)
```

### Issue 2: No Centralized Transaction View

**Problem:**
- Transactions are only viewable per stock item (via History button)
- No unified view of ALL transactions from all sources:
  - Quick Add Stock
  - Update Stock Modal
  - Bulk Entry
  - Add Stock from Order

**Current State:**
- Each stock item has its own history modal
- No global transaction log/audit trail

**Expected State:**
- Centralized transaction history page
- Shows all transactions across all SKUs
- Filterable by SKU, date, transaction type, source

## Current Logic Flow

### Entry Points & Their Methods:

1. **QuickAddStockForm** → `setStock()` ❌ (should be `updateStock()`)
2. **UpdateStockModal (Add mode)** → `updateStock()` ✅ (correct)
3. **UpdateStockModal (Set mode)** → `setStock()` ✅ (correct - intentional absolute set)
4. **Bulk Entry** → `setStock()` ❌ (should be `updateStock()` or have option)
5. **AddStockFromOrderModal** → `updateStock()` ✅ (correct)

### Service Methods:

1. **`updateStock(skuId, partType, quantityChange, ...)`**
   - ✅ Adds/subtracts relative quantity
   - ✅ Creates transaction history with type 'ADD' or 'SUBTRACT'
   - ✅ Correct for incremental changes

2. **`setStock(skuId, partType, quantity, ...)`**
   - ❌ Sets absolute quantity (overwrites)
   - ✅ Creates transaction history with type 'SET'
   - ✅ Should only be used when intentionally setting absolute value

## Fix Plan

### Phase 1: Fix Math Logic

**Change QuickAddStockForm:**
- Switch from `setStock()` to `updateStock()`
- This will ADD to existing stock instead of replacing it

**Change Bulk Entry:**
- Option A: Switch to `updateStock()` (always add)
- Option B: Add toggle for "Add to existing" vs "Set absolute" (better UX)

### Phase 2: Create Centralized Transaction View

**New Component:**
- `StockTransactionHistoryPage` or add tab to Stock page
- Shows all transactions in chronological order
- Filters: SKU, Part Type, Date Range, Transaction Type, Source
- Group by SKU+Part or show flat list

**Data Source:**
- Use `StockService.getAllTransactionHistory()`
- Join with SKU and stock data for display

### Phase 3: Enhance Transaction Tracking

**Add Source Field:**
- Track where transaction came from:
  - 'QUICK_ADD' - Quick Add Stock form
  - 'UPDATE_MODAL' - Update Stock modal
  - 'BULK_ENTRY' - Bulk entry
  - 'ORDER_RECEIVED' - Add Stock from Order
  - 'MANUAL' - Direct API call

**Migration:**
- Add `source` column to `supply_order_stock_transactions` table
- Update all service methods to include source

## Implementation Priority

1. **HIGH:** Fix QuickAddStockForm math (switch to updateStock)
2. **HIGH:** Create centralized transaction history view
3. **MEDIUM:** Add source tracking to transactions
4. **MEDIUM:** Improve Bulk Entry to have add/set option
5. **LOW:** Add transaction filtering and search

## Code Changes Required

### Files to Modify:
1. `components/QuickAddStockForm.tsx` - Change setStock to updateStock
2. `app/stock/page.tsx` - Add centralized transaction history tab/view
3. `lib/services/stock-service.ts` - Add source parameter to methods
4. `supabase/migrations/007_add_source_to_transactions.sql` - New migration
5. `components/StockTransactionHistoryModal.tsx` - Enhance or create new centralized view

### New Files:
1. `app/stock/transactions/page.tsx` - Centralized transaction history page (optional)
2. `components/StockTransactionHistoryView.tsx` - Reusable transaction list component

