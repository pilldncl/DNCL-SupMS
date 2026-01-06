-- Migration: Daily Report Summary Table
-- Creates a pre-aggregated table for daily reports that auto-populates as transactions occur
-- This makes daily reports instant and data is "ready to go" from the start

-- Create daily report summary table
CREATE TABLE IF NOT EXISTS supply_order_daily_report_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL UNIQUE, -- One row per day
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_added INTEGER NOT NULL DEFAULT 0,
  total_subtracted INTEGER NOT NULL DEFAULT 0,
  total_set_operations INTEGER NOT NULL DEFAULT 0,
  unique_skus INTEGER NOT NULL DEFAULT 0,
  unique_part_types INTEGER NOT NULL DEFAULT 0,
  -- Breakdown by source (stored as JSONB for flexibility)
  by_source JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Breakdown by type (stored as JSONB for flexibility)
  by_type JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on report_date for fast lookups
CREATE INDEX IF NOT EXISTS idx_daily_report_summary_date 
  ON supply_order_daily_report_summary(report_date DESC);

-- Create index on last_updated for refresh tracking
CREATE INDEX IF NOT EXISTS idx_daily_report_summary_updated 
  ON supply_order_daily_report_summary(last_updated DESC);

-- Enable Row Level Security
ALTER TABLE supply_order_daily_report_summary ENABLE ROW LEVEL SECURITY;

-- RLS policy - Allow all operations (can be restricted later if needed)
CREATE POLICY "supply_order_allow_all_daily_reports" ON supply_order_daily_report_summary
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Function to update daily report summary for a specific date
CREATE OR REPLACE FUNCTION update_daily_report_summary(target_date DATE)
RETURNS VOID AS $$
DECLARE
  v_date DATE;
  v_total_transactions INTEGER;
  v_total_added INTEGER;
  v_total_subtracted INTEGER;
  v_total_set INTEGER;
  v_unique_skus INTEGER;
  v_unique_part_types INTEGER;
  v_by_source JSONB;
  v_by_type JSONB;
BEGIN
  -- Use provided date or today
  v_date := COALESCE(target_date, CURRENT_DATE);
  
  -- Calculate summary statistics for the date
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(SUM(CASE WHEN transaction_type = 'ADD' THEN quantity ELSE 0 END), 0)::INTEGER,
    COALESCE(SUM(CASE WHEN transaction_type = 'SUBTRACT' THEN quantity ELSE 0 END), 0)::INTEGER,
    COUNT(CASE WHEN transaction_type = 'SET' THEN 1 END)::INTEGER,
    COUNT(DISTINCT sku_id)::INTEGER,
    COUNT(DISTINCT part_type)::INTEGER
  INTO 
    v_total_transactions,
    v_total_added,
    v_total_subtracted,
    v_total_set,
    v_unique_skus,
    v_unique_part_types
  FROM supply_order_stock_transactions
  WHERE DATE(created_at AT TIME ZONE 'UTC') = v_date;
  
  -- Handle case where no transactions exist
  IF v_total_transactions IS NULL OR v_total_transactions = 0 THEN
    v_total_transactions := 0;
    v_total_added := 0;
    v_total_subtracted := 0;
    v_total_set := 0;
    v_unique_skus := 0;
    v_unique_part_types := 0;
    v_by_source := '{}'::jsonb;
    v_by_type := '{}'::jsonb;
  ELSE
    -- Build source breakdown
    SELECT COALESCE(jsonb_object_agg(
      COALESCE(source, 'MANUAL'),
      count
    ), '{}'::jsonb)
    INTO v_by_source
    FROM (
      SELECT COALESCE(source, 'MANUAL') as source, COUNT(*)::INTEGER as count
      FROM supply_order_stock_transactions
      WHERE DATE(created_at AT TIME ZONE 'UTC') = v_date
      GROUP BY source
    ) source_counts;
    
    -- Build type breakdown
    SELECT COALESCE(jsonb_object_agg(
      transaction_type,
      count
    ), '{}'::jsonb)
    INTO v_by_type
    FROM (
      SELECT transaction_type, COUNT(*)::INTEGER as count
      FROM supply_order_stock_transactions
      WHERE DATE(created_at AT TIME ZONE 'UTC') = v_date
      GROUP BY transaction_type
    ) type_counts;
  END IF;
  
  -- Insert or update the summary
  INSERT INTO supply_order_daily_report_summary (
    report_date,
    total_transactions,
    total_added,
    total_subtracted,
    total_set_operations,
    unique_skus,
    unique_part_types,
    by_source,
    by_type,
    last_updated
  ) VALUES (
    v_date,
    v_total_transactions,
    v_total_added,
    v_total_subtracted,
    v_total_set,
    v_unique_skus,
    v_unique_part_types,
    v_by_source,
    v_by_type,
    NOW()
  )
  ON CONFLICT (report_date) 
  DO UPDATE SET
    total_transactions = EXCLUDED.total_transactions,
    total_added = EXCLUDED.total_added,
    total_subtracted = EXCLUDED.total_subtracted,
    total_set_operations = EXCLUDED.total_set_operations,
    unique_skus = EXCLUDED.unique_skus,
    unique_part_types = EXCLUDED.unique_part_types,
    by_source = EXCLUDED.by_source,
    by_type = EXCLUDED.by_type,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-update daily report when transaction is inserted
CREATE OR REPLACE FUNCTION trigger_update_daily_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the daily report for the transaction's date
  PERFORM update_daily_report_summary(DATE(NEW.created_at AT TIME ZONE 'UTC'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on transactions table
DROP TRIGGER IF EXISTS trg_update_daily_report ON supply_order_stock_transactions;
CREATE TRIGGER trg_update_daily_report
  AFTER INSERT ON supply_order_stock_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_daily_report();

-- Function to backfill daily reports for existing transactions
CREATE OR REPLACE FUNCTION backfill_daily_reports(start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  v_date DATE;
  v_count INTEGER := 0;
  v_start DATE;
  v_end DATE;
BEGIN
  -- Determine date range
  IF start_date IS NULL THEN
    SELECT MIN(DATE(created_at AT TIME ZONE 'UTC')) INTO v_start
    FROM supply_order_stock_transactions;
  ELSE
    v_start := start_date;
  END IF;
  
  IF end_date IS NULL THEN
    v_end := CURRENT_DATE;
  ELSE
    v_end := end_date;
  END IF;
  
  -- Process each date in range
  v_date := v_start;
  WHILE v_date <= v_end LOOP
    PERFORM update_daily_report_summary(v_date);
    v_count := v_count + 1;
    v_date := v_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE supply_order_daily_report_summary IS 
  'Pre-aggregated daily report summaries that auto-update as transactions occur';

COMMENT ON FUNCTION update_daily_report_summary IS 
  'Updates or creates daily report summary for a specific date';

COMMENT ON FUNCTION trigger_update_daily_report IS 
  'Trigger function that auto-updates daily report when transaction is inserted';

COMMENT ON FUNCTION backfill_daily_reports IS 
  'Backfills daily report summaries for a date range (or all dates if none specified)';

