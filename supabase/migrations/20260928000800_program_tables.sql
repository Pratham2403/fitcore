CREATE TABLE public.workouts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
  focus      text NOT NULL DEFAULT '' CHECK (char_length(focus) <= 120),
  protocol   text NOT NULL CHECK (protocol IN ('push', 'pull', 'legs', 'recovery', 'full_body')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- composite key lets children prove they belong to the same user as the workout
  UNIQUE (id, user_id)
);

CREATE INDEX workouts_user_id_idx ON public.workouts (user_id);

CREATE TABLE public.weekly_schedule (
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  workout_id  uuid,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day_of_week),
  FOREIGN KEY (workout_id, user_id) REFERENCES public.workouts (id, user_id) ON DELETE SET NULL (workout_id)
);

CREATE INDEX weekly_schedule_workout_idx ON public.weekly_schedule (workout_id, user_id);

CREATE TABLE public.workout_exercises (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id               uuid NOT NULL,
  user_id                  uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  exercise_id              text NOT NULL REFERENCES public.exercises (id),
  order_index              int  NOT NULL CHECK (order_index >= 0),
  sets                     int  NOT NULL CHECK (sets BETWEEN 1 AND 20),
  reps                     text NOT NULL CHECK (char_length(btrim(reps)) BETWEEN 1 AND 60),
  rest_secs                int  NOT NULL DEFAULT 90 CHECK (rest_secs BETWEEN 0 AND 900),
  default_weight_kg        double precision NOT NULL DEFAULT 0 CHECK (default_weight_kg BETWEEN 0 AND 1000),
  is_unilateral            boolean NOT NULL DEFAULT false,
  is_mandatory             boolean NOT NULL DEFAULT false,
  is_timed                 boolean NOT NULL DEFAULT false,
  duration_secs            int CHECK (duration_secs > 0),
  is_assistance            boolean NOT NULL DEFAULT false,
  volume_type              text NOT NULL DEFAULT 'weighted'
                             CHECK (volume_type IN ('weighted', 'bodyweight_full', 'reps_only', 'timed')),
  notes                    text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 2000),
  alternative_exercise_ids text[] NOT NULL DEFAULT '{}',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (workout_id, user_id) REFERENCES public.workouts (id, user_id) ON DELETE CASCADE,
  -- deferrable so a reorder can swap positions inside one transaction
  CONSTRAINT workout_exercises_order_unique UNIQUE (workout_id, order_index) DEFERRABLE INITIALLY IMMEDIATE,
  CHECK (NOT is_timed OR duration_secs IS NOT NULL)
);

CREATE INDEX workout_exercises_user_id_idx ON public.workout_exercises (user_id);
CREATE INDEX workout_exercises_exercise_id_idx ON public.workout_exercises (exercise_id);
CREATE INDEX workout_exercises_workout_user_idx ON public.workout_exercises (workout_id, user_id);

CREATE TRIGGER workouts_set_updated_at BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);
CREATE TRIGGER weekly_schedule_set_updated_at BEFORE UPDATE ON public.weekly_schedule
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);
CREATE TRIGGER workout_exercises_set_updated_at BEFORE UPDATE ON public.workout_exercises
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_rows ON public.workouts FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY own_rows ON public.weekly_schedule FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY own_rows ON public.workout_exercises FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.enforce_workout_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  free_workout_limit CONSTANT int := 7;
BEGIN
  -- serialise concurrent inserts for the same user so the count below cannot race
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));

  IF EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = NEW.user_id
      AND s.plan <> 'FREE'
      AND s.status = 'active'
      AND s.current_period_end > now()
  ) THEN
    RETURN NEW;
  END IF;

  IF (SELECT count(*) FROM public.workouts w WHERE w.user_id = NEW.user_id) >= free_workout_limit THEN
    RAISE EXCEPTION 'workout_limit_reached'
      USING ERRCODE = 'P0001',
            DETAIL = format('Free plan allows at most %s workouts.', free_workout_limit);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_workout_limit() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER workouts_enforce_limit
  BEFORE INSERT ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_workout_limit();
