
-- Create function to get user profile
CREATE OR REPLACE FUNCTION public.get_profile(user_id UUID)
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.phone,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to upsert user profile
CREATE OR REPLACE FUNCTION public.upsert_profile(
  user_id UUID,
  full_name TEXT,
  phone TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, updated_at)
  VALUES (user_id, full_name, phone, NOW())
  ON CONFLICT (id) 
  DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_profile(UUID, TEXT, TEXT) TO authenticated;
