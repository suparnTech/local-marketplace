-- Add vendor approval columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);

-- Store owners need approval, customers are auto-approved
UPDATE users SET is_approved = true WHERE role = 'CUSTOMER';
UPDATE users SET is_approved = false WHERE role = 'STORE_OWNER' AND is_approved IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_approved ON users(is_approved);
