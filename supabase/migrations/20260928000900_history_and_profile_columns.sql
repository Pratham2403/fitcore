-- workout_sessions: link to the template performed, snapshot its name; day_type is kept only for legacy history.
ALTER TABLE public.workout_sessions
  ADD COLUMN workout_id   uuid,
  ADD COLUMN workout_name text,
  ALTER COLUMN day_type DROP NOT NULL,
  ADD CONSTRAINT workout_sessions_workout_fkey
    FOREIGN KEY (workout_id, user_id) REFERENCES public.workouts (id, user_id) ON DELETE SET NULL (workout_id);

CREATE INDEX workout_sessions_workout_idx ON public.workout_sessions (workout_id, user_id);

-- set_logs: catalog link (exercise_name stays as the display snapshot) and the protocol phase a set belongs to.
ALTER TABLE public.set_logs
  ADD COLUMN exercise_id text REFERENCES public.exercises (id),
  ADD COLUMN block_type  text NOT NULL DEFAULT 'working' CHECK (block_type IN ('working', 'warmup', 'stretch'));

CREATE INDEX set_logs_exercise_id_idx ON public.set_logs (exercise_id);
CREATE INDEX set_logs_session_id_idx ON public.set_logs (session_id);

-- personal_records: catalog link; a PR must survive deletion of the session it was set in.
ALTER TABLE public.personal_records
  ADD COLUMN exercise_id text REFERENCES public.exercises (id),
  DROP CONSTRAINT personal_records_session_id_fkey,
  ADD CONSTRAINT personal_records_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES public.workout_sessions (id) ON DELETE SET NULL;

CREATE INDEX personal_records_exercise_id_idx ON public.personal_records (exercise_id);
CREATE INDEX personal_records_session_id_idx ON public.personal_records (session_id);

ALTER TABLE public.user_profile
  ADD COLUMN sex                    text CHECK (sex IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ADD COLUMN experience_level       text CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN training_days_per_week int  CHECK (training_days_per_week BETWEEN 1 AND 7),
  ADD COLUMN session_minutes        int  CHECK (session_minutes BETWEEN 10 AND 240),
  ADD COLUMN equipment              text[] NOT NULL DEFAULT '{}' CHECK (equipment <@ ARRAY[
    'medicine ball', 'dumbbell', 'body only', 'bands', 'kettlebells', 'foam roll',
    'cable', 'machine', 'barbell', 'exercise ball', 'e-z curl bar', 'other']),
  ADD COLUMN profile_data           jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(profile_data) = 'object'),
  ADD COLUMN onboarded_at           timestamptz,
  ADD COLUMN role                   text NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN'));

-- own_rows lets users write their profile, so role must be guarded separately from RLS.
CREATE OR REPLACE FUNCTION public.protect_user_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.role <> 'USER' THEN
    RAISE EXCEPTION 'role_change_forbidden' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'role_change_forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_user_profile_role() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER user_profile_protect_role
  BEFORE INSERT OR UPDATE ON public.user_profile
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_profile_role();
