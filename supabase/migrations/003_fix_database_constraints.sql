-- Migration: Fix database constraints to match codebase expectations
-- This migration fixes issues where the database had multi-tenant constraints
-- that don't match the current codebase implementation
-- 
-- Date: Applied manually to fix database state
-- 
-- Issues Fixed:
-- 1. RLS policies on supply_order_stock were too restrictive
-- 2. Unique constraints included company_id which isn't used by current codebase
-- 3. Redundant unique constraints on supply_order_week_cycles

-- Fix 1: Update RLS policies on supply_order_stock
-- Drop restrictive company-based policies
DROP POLICY IF EXISTS "supply_order_stock_company_modify" ON supply_order_stock;
DROP POLICY IF EXISTS "supply_order_stock_company_select" ON supply_order_stock;

-- Recreate permissive "allow all" policy (matches original migration 002)
-- Note: This policy already exists from migration 002, but we ensure it's correct
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'supply_order_stock' 
    AND policyname = 'supply_order_allow_all_stock'
  ) THEN
    CREATE POLICY "supply_order_allow_all_stock" ON supply_order_stock
      FOR ALL TO anon, authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Fix 2: Update unique constraints to match original migrations
-- supply_order_stock: should be UNIQUE(sku_id, part_type) not (sku_id, part_type, company_id)
ALTER TABLE supply_order_stock 
  DROP CONSTRAINT IF EXISTS supply_order_stock_sku_part_company_unique;

-- Ensure the correct unique constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'supply_order_stock_sku_part_unique'
  ) THEN
    ALTER TABLE supply_order_stock 
      ADD CONSTRAINT supply_order_stock_sku_part_unique 
      UNIQUE(sku_id, part_type);
  END IF;
END $$;

-- supply_order_part_types: should be UNIQUE(name) not (name, company_id)
ALTER TABLE supply_order_part_types 
  DROP CONSTRAINT IF EXISTS supply_order_part_types_name_company_unique;

-- Ensure the correct unique constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'supply_order_part_types_name_key'
  ) THEN
    ALTER TABLE supply_order_part_types 
      ADD CONSTRAINT supply_order_part_types_name_key 
      UNIQUE(name);
  END IF;
END $$;

-- supply_order_week_cycles: remove redundant unique constraint on (id, company_id)
-- The primary key on id is sufficient
ALTER TABLE supply_order_week_cycles 
  DROP CONSTRAINT IF EXISTS supply_order_week_cycles_id_company_unique;

-- Note: company_id columns remain in the tables (they're nullable)
-- This allows for future multi-tenant support without breaking current functionality

