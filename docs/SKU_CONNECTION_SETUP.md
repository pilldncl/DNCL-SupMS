# SKU Master Table Connection Setup

## ✅ Connection Verified

Successfully connected to Supabase project and verified `sku_master` table structure.

## Table Structure

**Table:** `sku_master`

**Key Columns:**
- `id` - INTEGER (Primary Key) - NOT UUID
- `sku_code` - VARCHAR (Unique)
- `brand` - VARCHAR
- `model` - VARCHAR  
- `capacity` - VARCHAR
- `color` - VARCHAR
- `carrier` - VARCHAR
- `is_active` - BOOLEAN
- And more...

## Changes Made

### 1. Updated SKU Service
- Changed default table name from `'skus'` to `'sku_master'`
- Updated to handle integer IDs instead of UUIDs

**File:** `lib/services/sku-service.ts`

### 2. Updated Type Definitions
- Changed `SKU.id` from `string` to `number` (integer)
- Added proper fields matching `sku_master` table structure:
  - `brand`, `model`, `capacity`, `color`, `carrier`, etc.

**File:** `lib/types/supply.ts`

### 3. Updated Migration SQL
- Changed `sku_id` from `UUID` to `INTEGER` in `order_list_items` table
- Added proper foreign key reference: `REFERENCES sku_master(id)`

**File:** `supabase/migrations/001_initial_schema.sql`

### 4. Updated Components
- `AddItemModal` - Now uses `sku_master` and searches by brand/model/sku_code
- `OrderListItem` - Displays SKU info properly (brand + model or sku_code)
- Updated SKU display logic throughout

### 5. Updated Order List Service
- Handles integer SKU IDs correctly
- Fixed join query to reference `sku_master` table properly

## Testing

A test page has been created at `/test-sku` to verify the connection:

1. Navigate to http://localhost:3000/test-sku
2. Click "Fetch SKUs from sku_master"
3. Should display SKU data in a table

## Sample Data Retrieved

Successfully fetched sample SKUs:
- PIXEL-7-PRO-128-HAZEL-XFINITY-VG (GOOGLE)
- IPAD-PRO-9.7-256-ROSE-4G (APPLE)
- WATCH-6-40-4G-BLK (SAMSUNG)
- And more...

## Next Steps

1. ✅ Run the migration SQL to create `part_types`, `week_cycles`, and `order_list_items` tables
2. ✅ Configure environment variables (if not already done)
3. Test the full order list flow:
   - Add items using SKUs from `sku_master`
   - Select part types (SCREEN, COVER, RING, BAND)
   - Mark items as ordered
   - Test weekly reset

## Notes

- The `sku_master` table uses integer IDs, not UUIDs
- SKUs are referenced by their integer `id` in the order list
- The app now properly displays `sku_code`, `brand`, and `model` from the database

