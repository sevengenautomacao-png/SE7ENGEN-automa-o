-- Enable RLS on products table (if not already)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 1. Policies for Products
DROP POLICY IF EXISTS "Public products are viewable by everyone." ON public.products;
CREATE POLICY "Public products are viewable by everyone." ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert products." ON public.products;
CREATE POLICY "Authenticated users can insert products." ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update products." ON public.products;
CREATE POLICY "Authenticated users can update products." ON public.products FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete products." ON public.products;
CREATE POLICY "Authenticated users can delete products." ON public.products FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Policies for Product Variations (just in case)
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public variations are viewable by everyone." ON public.product_variations;
CREATE POLICY "Public variations are viewable by everyone." ON public.product_variations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage variations." ON public.product_variations;
CREATE POLICY "Authenticated users can manage variations." ON public.product_variations FOR ALL USING (auth.role() = 'authenticated');
