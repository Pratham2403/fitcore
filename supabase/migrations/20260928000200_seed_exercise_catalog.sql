CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Pinned upstream commit keeps the seed reproducible; images stay relative to the repo's exercises/ folder.
INSERT INTO public.exercises
  (id, name, force, level, mechanic, equipment, primary_muscles, secondary_muscles, instructions, category, images, source)
SELECT id, name, force, level, mechanic, equipment,
       "primaryMuscles", "secondaryMuscles", instructions, category, images, 'free-exercise-db'
FROM jsonb_to_recordset(
  (SELECT content::jsonb
   FROM extensions.http_get('https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/dist/exercises.json'))
) AS catalog(
  id text, name text, force text, level text, mechanic text, equipment text,
  "primaryMuscles" text[], "secondaryMuscles" text[], instructions text[], category text, images text[]
)
ON CONFLICT (id) DO NOTHING;
