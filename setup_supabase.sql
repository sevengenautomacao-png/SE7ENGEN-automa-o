CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    full_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist (Important for existing databases)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Sync email for existing profiles (One-time update)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Function to handle new user profiles automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create Quotes Table (Linked to User)
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users, -- can be null for guest quotes
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    service TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'Pendente'
);

-- Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    description TEXT
);

-- Ensure e-commerce columns exist in products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Geral';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3) DEFAULT 0; -- kg
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS height DECIMAL(10,2) DEFAULT 0; -- cm
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS width DECIMAL(10,2) DEFAULT 0;  -- cm
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS length DECIMAL(10,2) DEFAULT 0; -- cm

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Structured Product Variations
CREATE TABLE IF NOT EXISTS public.product_variations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "220V", "Modelo Pro"
    price DECIMAL(10,2), -- Individual price for this variation
    stock INTEGER DEFAULT 0, -- Individual stock
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update Products Table to link Categorias
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Allow public read on categories" ON public.categories;
CREATE POLICY "Allow public read on categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on product_variations" ON public.product_variations;
CREATE POLICY "Allow public read on product_variations" ON public.product_variations FOR SELECT USING (true);

-- Admin write access (simplified for this context)
DROP POLICY IF EXISTS "Allow admin all on categories" ON public.categories;
CREATE POLICY "Allow admin all on categories" ON public.categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow admin all on product_variations" ON public.product_variations;
CREATE POLICY "Allow admin all on product_variations" ON public.product_variations FOR ALL USING (true);

-- Create Cart Table
CREATE TABLE IF NOT EXISTS public.cart (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products ON DELETE CASCADE NOT NULL,
    variation_id UUID REFERENCES public.product_variations ON DELETE CASCADE, -- Can be null for simple products
    quantity INTEGER DEFAULT 1 NOT NULL
);

-- Ensure cart columns exist for upgrades
ALTER TABLE public.cart ADD COLUMN IF NOT EXISTS variation_id UUID REFERENCES public.product_variations ON DELETE CASCADE;

-- Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'Processando',
    shipping_address JSONB,
    contact_phone TEXT
);

-- Ensure orders columns exist (Important if table already created)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_details JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT; -- 'pix', 'credit_card'
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_details JSONB;

-- Ensure join relationship for admin panel
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create Order Items Table (Detailed snapshot of products in order)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    variation_id UUID REFERENCES public.product_variations(id),
    product_name TEXT NOT NULL,
    variation_name TEXT,
    quantity INTEGER NOT NULL,
    price_at_purchase DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Free Shipping Rules
CREATE TABLE IF NOT EXISTS public.free_shipping_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cep_pattern TEXT NOT NULL UNIQUE, -- e.g. "83601-120" or "836%"
    label TEXT DEFAULT 'Frete Grátis',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Active RLS for the new table
ALTER TABLE public.free_shipping_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on free shipping rules" ON public.free_shipping_rules;
CREATE POLICY "Allow public read on free shipping rules" ON public.free_shipping_rules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin all on free shipping rules" ON public.free_shipping_rules;
CREATE POLICY "Allow admin all on free shipping rules" ON public.free_shipping_rules FOR ALL USING (true);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Disable RLS for testing as per previous instruction
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Seed Products
TRUNCATE TABLE public.products CASCADE;
INSERT INTO public.products (name, price, image_url, description) 
VALUES 
('CLP Siemens S7-1500', 5490.00, 'public/plc_controller_webp_1769464690191.png', 'Controlador lógico programável de alta performance.'),
('Módulo de Expansão I/O', 1250.00, 'public/electrical_panel_webp_1769464752729.png', 'Módulo digital para expansão de entradas e saídas.'),
('IHM Touch 10" Pro', 3800.00, 'public/industrial_automation_hero_webp_1769464630093.png', 'Interface Homem-Máquina com tela sensível ao toque.');
