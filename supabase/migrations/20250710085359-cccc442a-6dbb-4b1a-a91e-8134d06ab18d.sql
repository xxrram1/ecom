
-- Create products table to store product information
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- Price in cents
  original_price INTEGER,
  category TEXT NOT NULL,
  image_url TEXT,
  is_new BOOLEAN DEFAULT false,
  rating DECIMAL(2,1) DEFAULT 0,
  colors TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create cart table to store user's cart items
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  selected_size TEXT,
  selected_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, selected_size, selected_color)
);

-- Create orders table to track purchases
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount INTEGER NOT NULL, -- Total in cents
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
  shipping_address JSONB,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order_items table to store items in each order
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL, -- Price at time of purchase in cents
  selected_size TEXT,
  selected_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for products (public read access)
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

-- Create policies for cart_items (users can only see their own cart)
CREATE POLICY "Users can view their own cart items" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for orders (users can only see their own orders)
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for order_items (users can only see items from their own orders)
CREATE POLICY "Users can view their own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert order items for their own orders" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Insert sample products
INSERT INTO public.products (name, description, price, original_price, category, image_url, is_new, rating, colors, sizes, stock_quantity) VALUES
('Essential Cotton Tee', 'Soft, comfortable essential tee made from 100% organic cotton', 89000, 120000, 'T-Shirts', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', true, 4.8, '{"White","Black","Gray"}', '{"S","M","L","XL"}', 50),
('Minimalist Hoodie', 'Clean, modern hoodie perfect for layering', 189000, null, 'Hoodies', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', false, 4.9, '{"Gray","Black","Navy"}', '{"S","M","L","XL"}', 30),
('Urban Denim Jacket', 'Classic denim jacket with modern fit and details', 249000, 289000, 'Jackets', 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', false, 4.7, '{"Blue","Black"}', '{"S","M","L","XL"}', 25),
('Classic White Shirt', 'Timeless white shirt perfect for any occasion', 159000, null, 'Shirts', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', true, 4.6, '{"White","Light Blue"}', '{"S","M","L","XL"}', 40),
('Oversized T-Shirt', 'Relaxed fit oversized tee for casual comfort', 79000, null, 'T-Shirts', 'https://images.unsplash.com/photo-1583743814966-8936f37f4ec9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', true, 4.5, '{"White","Black","Beige"}', '{"S","M","L","XL"}', 60),
('Structured Blazer', 'Professional blazer with clean lines and perfect tailoring', 329000, null, 'Jackets', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', false, 4.8, '{"Navy","Black","Gray"}', '{"S","M","L","XL"}', 20);

-- Create functions for cart management
CREATE OR REPLACE FUNCTION add_to_cart(
  p_product_id UUID,
  p_quantity INTEGER DEFAULT 1,
  p_size TEXT DEFAULT NULL,
  p_color TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.cart_items (user_id, product_id, quantity, selected_size, selected_color)
  VALUES (auth.uid(), p_product_id, p_quantity, p_size, p_color)
  ON CONFLICT (user_id, product_id, selected_size, selected_color)
  DO UPDATE SET 
    quantity = cart_items.quantity + p_quantity,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION update_cart_item_quantity(
  p_cart_item_id UUID,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_quantity <= 0 THEN
    DELETE FROM public.cart_items 
    WHERE id = p_cart_item_id AND user_id = auth.uid();
  ELSE
    UPDATE public.cart_items 
    SET quantity = p_quantity, updated_at = now()
    WHERE id = p_cart_item_id AND user_id = auth.uid();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_cart_total()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(ci.quantity * p.price), 0) INTO total
  FROM public.cart_items ci
  JOIN public.products p ON ci.product_id = p.id
  WHERE ci.user_id = auth.uid();
  
  RETURN total;
END;
$$;
