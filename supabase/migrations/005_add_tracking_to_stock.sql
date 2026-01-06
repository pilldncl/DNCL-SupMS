-- Migration: Add Tracking Number to Stock
-- Adds optional tracking_number field to supply_order_stock table

-- Add tracking_number field
ALTER TABLE supply_order_stock 
  ADD COLUMN IF NOT EXISTS tracking_number TEXT NULL;

-- Create index for tracking number searches
CREATE INDEX IF NOT EXISTS idx_supply_order_stock_tracking 
  ON supply_order_stock(tracking_number) 
  WHERE tracking_number IS NOT NULL;

-- Add comment
COMMENT ON COLUMN supply_order_stock.tracking_number IS 
  'Optional tracking number for the stock entry';



