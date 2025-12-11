# Order List Workflow Redesign

## Current Issues
- Too many buttons/clicks needed to get items into stock
- No clear status progression
- Separate modals for each action
- No tracking information
- Unclear workflow

## Proposed Solution: Sequential Status-Based Workflow

### Status Flow (Sequential - Cannot Skip States)
```
PENDING (Need to Order) → ORDERED → SHIPPING → RECEIVED → STOCK_ADDED
```

### Status Definitions

1. **PENDING** - "Need to Order" (Initial/Default)
   - Item is registered in the order list
   - Waiting to be ordered
   - Action: "Mark as Ordered" (forward only)
   - Can remove item

2. **ORDERED** (First Stage)
   - Order has been placed
   - Optional: Add tracking number when marking as ordered
   - Action: "Mark as Shipping" (forward)
   - Action: "Back to Pending" (backward)
   - Can remove item

3. **SHIPPING** (Second Stage)
   - Order is in transit
   - Tracking number visible (if provided)
   - Action: "Mark as Received" (forward)
   - Action: "Back to Ordered" (backward)
   - Can remove item

4. **RECEIVED** (Third Stage)
   - Order has arrived
   - Ready to add to stock
   - Action: "Add to Stock" (forward - opens quick quantity input)
   - Action: "Back to Shipping" (backward)
   - Can remove item

5. **STOCK_ADDED** (Last Stage)
   - Item has been added to inventory
   - Final state
   - Action: "Back to Received" (backward only)
   - Can remove item

## UI Design

### Order List Item Component
Each item shows:
- **Status Badge**: Color-coded status indicator
- **Single Action Button**: Advances to next status
- **Quick Info**: SKU, Part Type, Quantity
- **Timeline**: Shows status progression visually

### Action Buttons by Status

- **PENDING** → "✓ Mark as Ordered" (forward, with optional tracking input)
- **ORDERED** → "✓ Mark as Shipping" (forward) | "← Back to Pending" (backward)
- **SHIPPING** → "✓ Mark as Received" (forward) | "← Back to Ordered" (backward)
- **RECEIVED** → "✓ Add to Stock" (forward, quick inline quantity input) | "← Back to Shipping" (backward)
- **STOCK_ADDED** → "← Back to Received" (backward only) | "✓ Complete" (visual indicator)

### Key Rules

1. **Sequential Progression**: Users can only move forward one step at a time (cannot skip states)
2. **Backward Navigation**: Users can go back to previous states at any time
3. **Remove Available**: Remove button available at all states
4. **State Clearing**: When going backward, later stage fields are cleared appropriately

### Quick Actions
- Click status badge to see full timeline
- Hover over action button for tooltip
- Bulk actions: "Mark all PENDING as ORDERED"

## Database Schema Changes

### New Fields in `supply_order_items`
```sql
-- Status field (replaces/extends 'ordered' boolean)
status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ORDERED', 'SHIPPING', 'RECEIVED', 'STOCK_ADDED'))

-- Tracking information
tracking_number TEXT NULL
tracking_url TEXT NULL

-- Status timestamps
ordered_at TIMESTAMP WITH TIME ZONE NULL
shipping_at TIMESTAMP WITH TIME ZONE NULL
received_at TIMESTAMP WITH TIME ZONE NULL
stock_added_at TIMESTAMP WITH TIME ZONE NULL

-- Stock addition info
stock_added_by UUID NULL REFERENCES auth.users(id)
stock_quantity_added INTEGER NULL
```

### Migration Strategy
- Keep `ordered` boolean for backward compatibility
- Set `status = 'ORDERED'` when `ordered = true`
- Gradually migrate to status-based system

## Benefits

1. **Single Action Button**: One click to advance status
2. **Clear Progression**: Visual status indicators
3. **Optional Tracking**: Add tracking when marking as ordered
4. **Quick Stock Addition**: Inline quantity input for received items
5. **Better UX**: Less clicks, clearer workflow
6. **Audit Trail**: Timestamps for each status change

## Implementation Plan

1. Create database migration for new fields
2. Update TypeScript types
3. Update OrderListService with status transition methods
4. Redesign OrderListItem component with status workflow
5. Update Order List page UI
6. Add bulk status transition actions

