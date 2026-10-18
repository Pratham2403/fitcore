-- Lets ADMIN users append exercises to the catalog through their own session (no service-role key in the request path).

-- Nullable without a backfill: existing rows were seeded by migrations, not by a user.
ALTER TABLE public.exercises
  ADD COLUMN created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN created_at timestamptz;
ALTER TABLE public.exercises
  ALTER COLUMN created_by SET DEFAULT auth.uid(),
  ALTER COLUMN created_at SET DEFAULT now();

CREATE UNIQUE INDEX exercises_name_lower_key ON public.exercises (lower(name));

-- SECURITY INVOKER is enough: the own_rows policy already lets a user read their own profile row.
CREATE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profile WHERE user_id = (SELECT auth.uid()) AND role = 'ADMIN'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE POLICY exercises_admin_insert ON public.exercises
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()) AND created_by = (SELECT auth.uid()) AND source = 'fitcore');

-- The catalog is read-only for clients apart from the admin insert above.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.exercises FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.exercises FROM authenticated;
