-- Fix addresses table - add missing is_deleted column
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
