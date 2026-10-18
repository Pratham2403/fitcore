CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

ALTER TABLE public.exercises
  ADD COLUMN source text NOT NULL DEFAULT 'free-exercise-db'
  CHECK (source IN ('free-exercise-db', 'fitcore'));

CREATE INDEX IF NOT EXISTS exercises_category_idx ON public.exercises (category);
CREATE INDEX IF NOT EXISTS exercises_mechanic_idx ON public.exercises (mechanic);
