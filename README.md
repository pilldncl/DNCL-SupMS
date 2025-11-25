# DNCL Supply Internal Tool

Dashboard/checklist application for monitoring supply and managing ordering workflow. Team members can add items to an order list, mark them as ordered, and reset the list weekly.

**✅ Completely Independent** - Uses prefixed tables (`supply_order_*`) to ensure zero conflicts with other projects in the same Supabase instance.

## Features

- **Dashboard**: Overview statistics and order list summary
- **Order List**: Checklist view for items to order (SKU + Part combinations)
- **Add Items**: Select SKU and Part Type to add to order list
- **Mark as Ordered**: Check off items when orders are placed
- **Weekly Reset**: Reset the order list for a new week cycle
- **Part Types Management**: Extensible part types (SCREEN, COVER, RING, BAND, etc.)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

The `.env.local` file should already exist. If not, create it:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yviavhfpvufbgughpwsd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database Schema

Run the migration SQL in your Supabase SQL editor:

**File:** `supabase/migrations/001_initial_schema.sql`

This creates **isolated tables** with `supply_order_` prefix:
- `supply_order_part_types` - Part type definitions
- `supply_order_week_cycles` - Weekly cycle tracking
- `supply_order_items` - Order list items

**Safety:** 
- ✅ Uses prefixed table names to avoid conflicts
- ✅ Read-only reference to existing `sku_master` table
- ✅ Safe to run alongside other projects

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Architecture

### Database Isolation

This system uses **prefixed table names** (`supply_order_*`) to ensure complete independence:

- **Our Tables:** `supply_order_part_types`, `supply_order_week_cycles`, `supply_order_items`
- **External Reference:** `sku_master` (read-only)
- **No Conflicts:** All table/index names are prefixed and isolated

See `docs/ISOLATION_STRATEGY.md` for detailed isolation guarantees.

### Data Model

**Existing Tables** (in your Supabase - read-only):
- `sku_master` - Your product SKU records (we only read from this)

**New Tables** (created by migration - isolated):
- `supply_order_part_types` - Part type definitions (SCREEN, COVER, RING, BAND, etc.)
- `supply_order_week_cycles` - Weekly cycle tracking
- `supply_order_items` - The order list items (SKU + Part combinations)

### Key Components

- **Services** (`lib/services/`):
  - `OrderListService` - Manage order list CRUD operations
  - `SKUService` - Fetch SKU data from your existing `sku_master` table (read-only)
  - `PartTypesService` - Manage part types

- **UI Components** (`components/`):
  - `OrderListItem` - Individual checklist item
  - `AddItemModal` - Modal to add items to the list
  - `DataDisplay` - Reusable data display component

- **Pages**:
  - `/` - Home/Landing page
  - `/dashboard` - Overview statistics
  - `/order-list` - Main checklist view
  - `/test-sku` - Test SKU data fetching

## Usage

### Adding Items to Order List

1. Navigate to "Items to Order" page
2. Click "Add Item" button
3. Search/Select SKU (from `sku_master` table)
4. Select Part Type
5. (Optional) Enter quantity
6. Click "Add Item"

### Marking Items as Ordered

- Check the checkbox next to any item in the order list
- Items marked as ordered will appear in a separate section

### Weekly Reset

- Click "Reset Week" button on the Order List page
- This clears all items for the current week and starts a new cycle

## Safety & Independence

✅ **No conflicts** - All tables prefixed with `supply_order_`  
✅ **Read-only access** - Only reads from `sku_master`, never modifies it  
✅ **Isolated RLS policies** - Only apply to our tables  
✅ **Easy cleanup** - Can drop all our tables if needed  

See `docs/ISOLATION_STRATEGY.md` for complete details.

## Next Steps / Customization

- [ ] Add authentication (Supabase Auth)
- [ ] Add user management
- [ ] Create Part Types management UI
- [ ] Add filtering/searching on Order List
- [ ] Add export functionality
- [ ] Customize styling/branding

## Development

### Project Structure

```
├── app/                    # Next.js pages
│   ├── dashboard/         # Dashboard page
│   ├── order-list/        # Order list checklist page
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/
│   ├── services/          # Business logic services
│   ├── types/             # TypeScript type definitions
│   └── supabase/          # Supabase client configuration
└── supabase/
    └── migrations/        # Database migration SQL
```
