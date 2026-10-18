CREATE OR REPLACE FUNCTION public.search_exercises(
  p_query     text DEFAULT NULL,
  p_muscle    text DEFAULT NULL,
  p_equipment text DEFAULT NULL,
  p_level     text DEFAULT NULL,
  p_mechanic  text DEFAULT NULL,
  p_category  text DEFAULT NULL,
  p_limit     int  DEFAULT 30,
  p_offset    int  DEFAULT 0
)
RETURNS SETOF public.exercises
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH search AS (
    SELECT nullif(btrim(p_query), '') AS term
  )
  SELECT e.*
  FROM public.exercises e, search s
  WHERE (
          s.term IS NULL
          OR e.search_vector @@ websearch_to_tsquery('english', s.term)
          -- word-level trigram match makes misspellings ("gobblet") still find the exercise
          OR s.term <% e.name
        )
    AND (p_muscle    IS NULL OR e.primary_muscles @> ARRAY[p_muscle])
    AND (p_equipment IS NULL OR e.equipment = p_equipment)
    AND (p_level     IS NULL OR e.level     = p_level)
    AND (p_mechanic  IS NULL OR e.mechanic  = p_mechanic)
    AND (p_category  IS NULL OR e.category  = p_category)
  ORDER BY
    CASE WHEN s.term IS NULL THEN 0
         -- whole-name similarity breaks ties so the plain exercise outranks its longer variants
         ELSE ts_rank(e.search_vector, websearch_to_tsquery('english', s.term))
              + word_similarity(s.term, e.name)
              + similarity(s.term, e.name)
    END DESC,
    e.name
  -- page size capped at 100 so a caller cannot pull the whole catalog in one request
  LIMIT least(greatest(p_limit, 1), 100)
  OFFSET greatest(p_offset, 0);
$$;

