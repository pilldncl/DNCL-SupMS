# Daily Report Setup Guide

## Overview
The Daily Report now uses a **pre-aggregated table architecture** that automatically updates as transactions occur. This makes reports instant and data is "ready to go" from the start.

## Architecture

### Pre-Aggregated Table
- **Table**: `supply_order_daily_report_summary`
- **Purpose**: Stores pre-calculated daily statistics
- **Auto-Update**: Database trigger automatically updates when transactions are inserted
- **Performance**: Instant queries (no calculation needed)

### How It Works

1. **Automatic Updates**: When a transaction is inserted into `supply_order_stock_transactions`, a database trigger automatically updates the daily report summary for that date.

2. **Ready to Go**: Data is pre-aggregated, so queries are instant - no waiting for calculations.

3. **Fallback**: If summary doesn't exist, the system calculates on-the-fly (for historical data before migration).

## Setup Steps

### 1. Run Migration
Apply the migration to create the table and triggers:

```sql
-- Run migration 008_daily_report_summary.sql in Supabase SQL Editor
```

### 2. Backfill Historical Data
After migration, backfill existing transactions:

**Option A: Via Supabase SQL Editor**
```sql
-- Backfill all dates
SELECT backfill_daily_reports();

-- Or backfill specific date range
SELECT backfill_daily_reports('2026-01-01'::DATE, '2026-01-31'::DATE);
```

**Option B: Via Application Code**
```typescript
// In browser console or API route
await StockService.backfillDailyReports();
```

### 3. Verify Setup
1. Navigate to `/daily-report`
2. Check that today's report loads instantly
3. Verify summary statistics match transaction details

## How Data Flows

```
Transaction Inserted
    ↓
Database Trigger Fires
    ↓
update_daily_report_summary() Function Called
    ↓
Summary Table Updated/Inserted
    ↓
Report Query Returns Instant Results
```

## Benefits

1. **Performance**: Instant queries (no calculation delay)
2. **Scalability**: Works efficiently even with thousands of transactions
3. **Automatic**: No manual updates needed - data is always current
4. **Reliable**: Database-level consistency (ACID guarantees)

## Maintenance

### Manual Refresh (if needed)
If you need to manually refresh a specific date:

```sql
SELECT update_daily_report_summary('2026-01-06'::DATE);
```

### Check Summary Status
```sql
SELECT 
  report_date,
  total_transactions,
  last_updated
FROM supply_order_daily_report_summary
ORDER BY report_date DESC
LIMIT 10;
```

## Troubleshooting

### Reports Not Showing
1. **Check if summary exists**:
   ```sql
   SELECT * FROM supply_order_daily_report_summary 
   WHERE report_date = CURRENT_DATE;
   ```

2. **If missing, trigger update**:
   ```sql
   SELECT update_daily_report_summary(CURRENT_DATE);
   ```

3. **Check trigger is active**:
   ```sql
   SELECT * FROM pg_trigger 
   WHERE tgname = 'trg_update_daily_report';
   ```

### Performance Issues
- Summary table is indexed on `report_date` for fast lookups
- If queries are slow, check index usage:
  ```sql
   EXPLAIN ANALYZE 
   SELECT * FROM supply_order_daily_report_summary 
   WHERE report_date = CURRENT_DATE;
   ```

## Migration Notes

- **Existing Data**: Use `backfill_daily_reports()` to populate historical data
- **New Data**: Automatically handled by trigger
- **No Code Changes**: Service layer automatically uses summary table when available

