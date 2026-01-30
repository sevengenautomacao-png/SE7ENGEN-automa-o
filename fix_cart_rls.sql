-- Enable RLS on cart table
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- 1. Policies for Cart
-- Allow users to view their own cart items
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart;
CREATE POLICY "Users can view their own cart items" ON public.cart FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert items into their own cart
DROP POLICY IF EXISTS "Users can add items to their own cart" ON public.cart;
CREATE POLICY "Users can add items to their own cart" ON public.cart FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update items in their own cart
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart;
CREATE POLICY "Users can update their own cart items" ON public.cart FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete items from their own cart
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart;
CREATE POLICY "Users can delete their own cart items" ON public.cart FOR DELETE USING (auth.uid() = user_id);
