-- Add isTest column to advertisements table
ALTER TABLE advertisements ADD COLUMN is_test BOOLEAN DEFAULT FALSE;