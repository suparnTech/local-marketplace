-- Add coordinates to shops and addresses for distance calculation
ALTER TABLE shops ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update existing shops with sample coordinates (Meerut area)
UPDATE shops SET 
  latitude = 28.9845 + (RANDOM() * 0.05 - 0.025),
  longitude = 77.7064 + (RANDOM() * 0.05 - 0.025)
WHERE latitude IS NULL;
