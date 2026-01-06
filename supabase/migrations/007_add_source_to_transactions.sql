-- Migration: Add Source Tracking to Stock Transactions
-- Adds source column to track where each transaction came from (for audit trail)

-- Add source column to supply_order_stock_transactions table
ALTER TABLE supply_order_stock_transactions 
  ADD COLUMN IF NOT EXISTS source TEXT NULL;

-- Update existing records to have default source
UPDATE supply_order_stock_transactions 
SET source = 'MANUAL' 
WHERE source IS NULL;

-- Add constraint to ensure valid source values
ALTER TABLE supply_order_stock_transactions
  ADD CONSTRAINT valid_transaction_source CHECK (
    source IS NULL OR source IN ('QUICK_ADD', 'UPDATE_MODAL', 'BULK_ENTRY', 'ORDER_RECEIVED', 'MANUAL')
  );

-- Create index for source queries
CREATE INDEX IF NOT EXISTS idx_stock_transactions_source 
  ON supply_order_stock_transactions(source) 
  WHERE source IS NOT NULL;

-- Add comment
COMMENT ON COLUMN supply_order_stock_transactions.source IS 
  'Source of transaction: QUICK_ADD, UPDATE_MODAL, BULK_ENTRY, ORDER_RECEIVED, or MANUAL';

