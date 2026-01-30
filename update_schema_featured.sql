-- Add Featured flag to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Optional: Create an index for faster filtering if table gets large
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
