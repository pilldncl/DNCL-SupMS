# Sequential Order Workflow System

## Overview

The order workflow is now **strictly sequential** - users must progress through each state in order and cannot skip states. Users can also navigate backward to previous states.

## State Sequence

```
Initial: PENDING (Need to Order)
    ↓
First: ORDERED
    ↓
Second: SHIPPING
    ↓
Third: RECEIVED
    ↓
Last: STOCK_ADDED
```

## State Details

### 1. PENDING - "Need to Order" (Initial)
- **Label**: "Need to Order"
- **Color**: Orange/Amber
- **Forward Action**: "✓ Mark as Ordered"
  - Opens optional tracking input (tracking number & URL)
- **Backward Action**: None (initial state)
- **Remove**: Available

### 2. ORDERED (First Stage)
- **Label**: "Ordered"
- **Color**: Blue
- **Forward Action**: "✓ Mark as Shipping"
- **Backward Action**: "← Back to Pending"
  - Clears: tracking info, shipping, received, and stock fields
- **Remove**: Available
- **Shows**: Tracking number (if provided)

### 3. SHIPPING (Second Stage)
- **Label**: "Shipping"
- **Color**: Purple
- **Forward Action**: "✓ Mark as Received"
- **Backward Action**: "← Back to Ordered"
  - Clears: received and stock fields
- **Remove**: Available
- **Shows**: Tracking number (if provided)

### 4. RECEIVED (Third Stage)
- **Label**: "Received"
- **Color**: Green
- **Forward Action**: "✓ Add to Stock"
  - Opens inline quantity input
  - Automatically adds to stock and marks as complete
- **Backward Action**: "← Back to Shipping"
  - Clears: stock fields
- **Remove**: Available

### 5. STOCK_ADDED (Last Stage)
- **Label**: "Stock Added"
- **Color**: Gray
- **Forward Action**: None (final state)
- **Backward Action**: "← Back to Received"
  - Removes stock from inventory
  - Clears stock fields
- **Remove**: Available

## Key Features

### Sequential Progression
- ✅ Users can only move forward one step at a time
- ✅ Cannot skip states (e.g., cannot go from PENDING directly to SHIPPING)
- ✅ Each state must be visited in order

### Backward Navigation
- ✅ Users can go back to any previous state
- ✅ When going backward, later stage fields are automatically cleared
- ✅ This allows correcting mistakes or reverting changes

### Remove Functionality
- ✅ Remove button available at all states
- ✅ Removes item from order list completely
- ✅ Confirmation dialog before removal

### Field Clearing Logic

When moving backward:
- **PENDING** → Clears all fields (tracking, shipping, received, stock)
- **ORDERED** → Clears shipping, received, stock fields
- **SHIPPING** → Clears received, stock fields
- **RECEIVED** → Clears stock fields
- **STOCK_ADDED** → When going back, removes stock from inventory

## Usage Examples

### Forward Progression
1. Add item → Status: PENDING
2. Click "✓ Mark as Ordered" → Status: ORDERED (optionally add tracking)
3. Click "✓ Mark as Shipping" → Status: SHIPPING
4. Click "✓ Mark as Received" → Status: RECEIVED
5. Click "✓ Add to Stock" → Enter quantity → Status: STOCK_ADDED

### Backward Navigation
- From SHIPPING: Click "← Back to Ordered" → Status: ORDERED
- From RECEIVED: Click "← Back to Shipping" → Status: SHIPPING
- From STOCK_ADDED: Click "← Back to Received" → Status: RECEIVED (stock removed)

### Error Correction
- If marked as SHIPPING by mistake: Click "← Back to Ordered"
- If stock added incorrectly: Click "← Back to Received" (removes stock), then re-add

## Implementation Details

### Status Validation
- Status transitions are validated to ensure sequential progression
- Helper functions: `getNextStatus()` and `getPreviousStatus()`
- Status sequence array defines valid order

### Database Updates
- When moving backward, appropriate timestamp fields are cleared
- Stock removal handled when going back from STOCK_ADDED
- Tracking info preserved when going backward (unless going to PENDING)

### UI Behavior
- Forward button shows next action
- Backward button only shows if not at initial state
- Remove button always visible
- Status badge shows current state with color coding

