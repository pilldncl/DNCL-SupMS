# Supply Order Management App - Design Document

## Overview
Dashboard/checklist app for monitoring supply and managing ordering workflow.

## Data Model

### Existing (in Supabase)
- **SKUs** - Product SKU records

### New Tables Needed
1. **order_list_items**
   - id (uuid)
   - sku_id (uuid, references SKU)
   - part_type (text: SCREEN, COVER, RING, BAND, etc.)
   - quantity (integer, optional)
   - added_by (uuid, references user)
   - added_at (timestamp)
   - ordered (boolean, default false)
   - ordered_by (uuid, references user, nullable)
   - ordered_at (timestamp, nullable)
   - week_cycle_id (text, e.g., "2024-W01")

2. **part_types**
   - id (uuid)
   - name (text: SCREEN, COVER, RING, BAND)
   - display_name (text)
   - created_at (timestamp)
   - is_active (boolean)

3. **week_cycles**
   - id (text, primary key, e.g., "2024-W01")
   - start_date (date)
   - end_date (date)
   - is_active (boolean)

## User Flow

1. **Login** → Authenticate via Supabase Auth
2. **Dashboard** → Overview of current order list status
3. **Items to Order** → Checklist view
   - Shows SKU + Part combinations
   - Checkbox to mark as ordered
   - Add button to add new items
4. **Add Item** → Modal/form to:
   - Select SKU
   - Select Part Type
   - Enter quantity (optional)
5. **Reset** → Clear current week's list, start new cycle

## Key Components

- `OrderListPage` - Main checklist view
- `AddItemModal` - Add items to order list
- `DashboardPage` - Overview/dashboard
- `AuthProvider` - Handle authentication
- `WeekCycleManager` - Manage weekly resets

## Data Transformation

Transform raw SKU data from DB into structured format:
- SKU details
- Available parts per SKU
- Current order list status
- Aggregated counts per part type

