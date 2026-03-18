-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. RLS policy: only admins can read user_roles
CREATE POLICY "Admins can read user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Drop all existing quiz_results policies
DROP POLICY IF EXISTS "Anyone can delete quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Anyone can insert quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Anyone can read quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Anyone can update quiz results" ON public.quiz_results;

-- 7. New quiz_results policies
CREATE POLICY "Public can read quiz results"
ON public.quiz_results
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public can insert quiz results"
ON public.quiz_results
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update quiz results"
ON public.quiz_results
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete quiz results"
ON public.quiz_results
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))