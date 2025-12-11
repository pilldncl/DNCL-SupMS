-- Migration: Order Status Workflow System
-- Adds status-based workflow to replace simple ordered boolean
-- Status flow: PENDING → ORDERED → SHIPPING → RECEIVED → STOCK_ADDED

-- Add status field (replaces/extends 'ordered' boolean)
ALTER TABLE supply_order_items 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING' 
  CHECK (status IN ('PENDING', 'ORDERED', 'SHIPPING', 'RECEIVED', 'STOCK_ADDED'));

-- Add tracking information fields
ALTER TABLE supply_order_items 
  ADD COLUMN IF NOT EXISTS tracking_number TEXT NULL;

ALTER TABLE supply_order_items 
  ADD COLUMN IF NOT EXISTS tracking_url TEXT NULL;

-- Add status timestamps
ALTER TABLE supply_order_items 
  ADD COLUMN IF NOT EXISTS shipping_at TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE supply_order_items 
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE supply_order_items 
  ADD COLUMN IF NOT EXISTS stock_added_at TIMESTAMP WITH TIME ZONE NULL;

-- Add stock addition info
ALTER TABLE supply_order_items 
  ADD COLUMN IF NOT EXISTS stock_added_by UUID NULL REFERENCES auth.users(id);

ALTER TABLE supply_order_items 
  ADD COLUMN IF NOT EXISTS stock_quantity_added INTEGER NULL;

-- Migrate existing data: set status based on 'ordered' field
UPDATE supply_order_items 
SET status = CASE 
  WHEN ordered = true THEN 'ORDERED'
  ELSE 'PENDING'
END
WHERE status IS NULL OR status = 'PENDING';

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_supply_order_items_status 
  ON supply_order_items(status);

-- Create index for tracking number searches
CREATE INDEX IF NOT EXISTS idx_supply_order_items_tracking 
  ON supply_order_items(tracking_number) 
  WHERE tracking_number IS NOT NULL;

-- Add comment to status field
COMMENT ON COLUMN supply_order_items.status IS 
  'Order status: PENDING (default), ORDERED, SHIPPING, RECEIVED, STOCK_ADDED';

COMMENT ON COLUMN supply_order_items.tracking_number IS 
  'Optional tracking number for the order';

COMMENT ON COLUMN supply_order_items.tracking_url IS 
  'Optional tracking URL for the order';

