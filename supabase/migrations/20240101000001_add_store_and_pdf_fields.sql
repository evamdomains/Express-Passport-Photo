-- Add store-selection and PDF fields for Printed & Ready orders

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS store_name TEXT,
  ADD COLUMN IF NOT EXISTS store_address TEXT,
  ADD COLUMN IF NOT EXISTS store_place_id TEXT,
  ADD COLUMN IF NOT EXISTS store_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS pickup_time TEXT;
