-- Migration: Initial schema for Supply Order Management System
-- This is an INDEPENDENT system - tables are prefixed with 'supply_order_' to avoid conflicts
-- Run this in your Supabase SQL editor

-- Create supply_order_part_types table (prefixed for isolation)
CREATE TABLE IF NOT EXISTS supply_order_part_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create supply_order_week_cycles table (prefixed for isolation)
CREATE TABLE IF NOT EXISTS supply_order_week_cycles (
  id TEXT PRIMARY KEY, -- Format: "2024-W01"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supply_order_items table (prefixed for isolation)
-- This table only references sku_master (read-only) and our own tables
CREATE TABLE IF NOT EXISTS supply_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_id INTEGER NOT NULL REFERENCES sku_master(id) ON DELETE RESTRICT, -- Read-only reference to existing table
  part_type TEXT NOT NULL REFERENCES supply_order_part_types(name),
  quantity INTEGER,
  added_by UUID, -- References auth.users(id) if using Supabase Auth (optional)
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ordered BOOLEAN DEFAULT false,
  ordered_by UUID, -- References auth.users(id) if using Supabase Auth (optional)
  ordered_at TIMESTAMP WITH TIME ZONE,
  week_cycle_id TEXT NOT NULL REFERENCES supply_order_week_cycles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance (prefixed names)
CREATE INDEX IF NOT EXISTS idx_supply_order_items_week_cycle ON supply_order_items(week_cycle_id);
CREATE INDEX IF NOT EXISTS idx_supply_order_items_sku ON supply_order_items(sku_id);
CREATE INDEX IF NOT EXISTS idx_supply_order_items_ordered ON supply_order_items(ordered);
CREATE INDEX IF NOT EXISTS idx_supply_order_week_cycles_active ON supply_order_week_cycles(is_active);

-- Insert default part types
INSERT INTO supply_order_part_types (name, display_name) 
VALUES 
  ('SCREEN', 'Screen'),
  ('COVER', 'Cover'),
  ('RING', 'Ring'),
  ('BAND', 'Band')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (only for our tables)
ALTER TABLE supply_order_part_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_order_week_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies - Allow all operations (can be restricted later if needed)
-- These policies ONLY apply to our supply_order_* tables
CREATE POLICY "supply_order_allow_all_part_types" ON supply_order_part_types
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "supply_order_allow_all_week_cycles" ON supply_order_week_cycles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "supply_order_allow_all_items" ON supply_order_items
  FOR ALL USING (true) WITH CHECK (true);

