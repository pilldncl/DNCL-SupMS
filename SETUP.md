# Setup Guide

## Quick Start Checklist

### 1. Database Setup

**Run the migration SQL** in your Supabase SQL Editor:

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. **IMPORTANT**: Update the `sku_id` reference:
   - Change the foreign key reference if your SKU table has a different name
   - Adjust the data type if your SKU IDs are not UUID

Example update needed in migration:
```sql
-- Change this line:
sku_id UUID NOT NULL, -- References your SKU table

-- To match your actual SKU table structure, e.g.:
sku_id UUID NOT NULL REFERENCES products(id),
-- or
sku_id TEXT NOT NULL REFERENCES skus(sku_code),
```

### 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: Supabase Dashboard → Settings → API

### 3. Update SKU Table Name

If your SKU table is not named `skus`, update these files:

**File: `lib/services/sku-service.ts`**
```typescript
// Change default parameter:
static async getAllSKUs(tableName: string = 'your_actual_table_name')
```

**File: `components/AddItemModal.tsx`**
```typescript
// Update the prop default:
skuTableName = 'your_actual_table_name'
```

### 4. Install and Run

```bash
npm install
npm run dev
```

### 5. Test the Setup

1. Visit http://localhost:3000
2. Navigate to "Items to Order"
3. Try adding an item (should show your SKUs)

## Troubleshooting

### "Error fetching SKUs"
- Check that your SKU table name is correct
- Verify your Supabase connection credentials
- Check browser console for detailed error

### "No active week cycle found"
- The app will auto-create a week cycle on first use
- Or manually insert one in Supabase:
```sql
INSERT INTO week_cycles (id, start_date, end_date, is_active)
VALUES ('2024-W01', CURRENT_DATE, CURRENT_DATE + 6, true);
```

### Part types not showing
- Default part types are inserted by the migration
- Check `part_types` table exists and has data
- Verify RLS policies allow reads

## Data Flow

1. **SKUs** → Read from your existing Supabase table
2. **Parts** → Stored in new `part_types` table (SCREEN, COVER, etc.)
3. **Order Items** → Stored in new `order_list_items` table
4. **Week Cycles** → Auto-created weekly, tracks order list cycles

