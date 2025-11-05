-- Migration: Add order_id to rider_locations table
-- This allows tracking which delivery the location update is for

-- Add order_id column
ALTER TABLE rider_locations 
ADD COLUMN IF NOT EXISTS order_id VARCHAR REFERENCES orders(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rider_locations_order_id ON rider_locations(order_id);
CREATE INDEX IF NOT EXISTS idx_rider_locations_timestamp ON rider_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_rider_locations_rider_order ON rider_locations(rider_id, order_id, timestamp DESC);

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rider_locations' 
AND column_name = 'order_id';
