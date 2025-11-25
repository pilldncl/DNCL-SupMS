-- Migration: Stock Inventory Management
-- Tracks stock levels for SKU + Part Type combinations

-- Create supply_order_stock table (prefixed for isolation)
CREATE TABLE IF NOT EXISTS supply_order_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_id INTEGER NOT NULL REFERENCES sku_master(id) ON DELETE RESTRICT,
  part_type TEXT NOT NULL REFERENCES supply_order_part_types(name),
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5, -- Alert when stock falls below this
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID, -- References auth.users(id) if using Supabase Auth (optional)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sku_id, part_type) -- One stock entry per SKU+Part combination
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_supply_order_stock_sku ON supply_order_stock(sku_id);
CREATE INDEX IF NOT EXISTS idx_supply_order_stock_part_type ON supply_order_stock(part_type);
CREATE INDEX IF NOT EXISTS idx_supply_order_stock_low ON supply_order_stock(quantity, low_stock_threshold) WHERE quantity <= low_stock_threshold;

-- Enable Row Level Security
ALTER TABLE supply_order_stock ENABLE ROW LEVEL SECURITY;

-- RLS policy - Allow all operations (can be restricted later if needed)
CREATE POLICY "supply_order_allow_all_stock" ON supply_order_stock
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

