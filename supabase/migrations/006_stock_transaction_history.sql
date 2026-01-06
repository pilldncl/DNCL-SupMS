-- Migration: Stock Transaction History
-- Creates a table to track all individual stock transactions (additions/updates)
-- This preserves history when the same SKU+Part is added multiple times with different quantities, dates, or tracking numbers

-- Create supply_order_stock_transactions table
CREATE TABLE IF NOT EXISTS supply_order_stock_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_id UUID NOT NULL REFERENCES supply_order_stock(id) ON DELETE CASCADE,
  sku_id INTEGER NOT NULL REFERENCES sku_master(id) ON DELETE RESTRICT,
  part_type TEXT NOT NULL REFERENCES supply_order_part_types(name),
  quantity INTEGER NOT NULL, -- The quantity set/added in this transaction
  quantity_before INTEGER, -- Previous quantity before this transaction (for reference)
  quantity_after INTEGER NOT NULL, -- New quantity after this transaction
  tracking_number TEXT NULL, -- Tracking number for this specific transaction
  notes TEXT NULL, -- Notes for this specific transaction
  transaction_type TEXT NOT NULL DEFAULT 'SET', -- 'SET' (absolute), 'ADD' (increment), 'SUBTRACT' (decrement)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NULL REFERENCES auth.users(id), -- User who created this transaction
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('SET', 'ADD', 'SUBTRACT'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_transactions_stock_id ON supply_order_stock_transactions(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_sku_part ON supply_order_stock_transactions(sku_id, part_type);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_created_at ON supply_order_stock_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_tracking ON supply_order_stock_transactions(tracking_number) WHERE tracking_number IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE supply_order_stock_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policy - Allow all operations (can be restricted later if needed)
CREATE POLICY "supply_order_allow_all_stock_transactions" ON supply_order_stock_transactions
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Add comment
COMMENT ON TABLE supply_order_stock_transactions IS 
  'Tracks all individual stock transactions to preserve history of additions/updates';

COMMENT ON COLUMN supply_order_stock_transactions.transaction_type IS 
  'Type of transaction: SET (absolute quantity), ADD (increment), SUBTRACT (decrement)';

