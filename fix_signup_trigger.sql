-- Fix signup issue by creating the missing trigger
-- Run this in your Supabase SQL Editor

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    new.email,
    'user',
    COALESCE(new.raw_user_meta_data->>'phone', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.developers TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.projects TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.leads TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.lead_batches TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.orders TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.partners TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.support_cases TO postgres, anon, authenticated, service_role;

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_cases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create basic RLS policies for other tables
DROP POLICY IF EXISTS "Users can view leads" ON public.leads;
CREATE POLICY "Users can view leads" ON public.leads
  FOR SELECT USING (auth.uid() = buyer_user_id);

DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
CREATE POLICY "Users can update own leads" ON public.leads
  FOR UPDATE USING (auth.uid() = buyer_user_id);

DROP POLICY IF EXISTS "Users can view projects" ON public.projects;
CREATE POLICY "Users can view projects" ON public.projects
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view orders" ON public.orders;
CREATE POLICY "Users can view orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert orders" ON public.orders;
CREATE POLICY "Users can insert orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Test the trigger by creating a test user (optional)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
-- VALUES (
--   gen_random_uuid(),
--   'test@example.com',
--   crypt('password123', gen_salt('bf')),
--   NOW(),
--   '{"name": "Test User", "phone": "+1234567890"}'
-- );

SELECT 'Signup trigger and RLS policies created successfully!' as status;
