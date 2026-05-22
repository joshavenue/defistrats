
-- 1. Create user with Supabase Auth API documentation: user will need to sign up.
-- (You will need to send an invite or create via UI/API for password-based auth.)
-- 2. Manually set this user as superadmin in the profiles table:

UPDATE public.profiles
SET is_admin = true,
    is_superadmin = true
WHERE email = 'david@zensite.co';

-- Optionally, you can manually insert the user into the profiles table if not exists:

INSERT INTO public.profiles (id, email, full_name, is_admin, is_superadmin)
SELECT
  (SELECT id FROM auth.users WHERE email = 'david@zensite.co'),
  'david@zensite.co',
  'David (Superadmin)',
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'david@zensite.co'
);

