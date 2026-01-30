-- Add CPF/CNPJ (tax_id) column to tables

-- 1. Add to Profiles (to save for future purchases)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- 2. Add to Orders (to record the tax ID used for a specific order)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- 3. Update RLS policies (just in case, though existing ones usually cover full row updates)
-- No specific policy needed if "Users can update own profile" is already active for all columns.
