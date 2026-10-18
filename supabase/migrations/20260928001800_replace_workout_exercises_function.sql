-- Replaces a workout's exercise list in one transaction (builder save). SECURITY INVOKER: RLS still applies.
CREATE OR REPLACE FUNCTION public.replace_workout_exercises(p_workout_id uuid, p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = p_workout_id AND w.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'workout_not_found' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.workout_exercises WHERE workout_id = p_workout_id;

  INSERT INTO public.workout_exercises
    (workout_id, user_id, order_index, exercise_id, display_name, sets, reps, rest_secs, default_weight_kg,
     is_unilateral, is_mandatory, is_timed, duration_secs, is_assistance, volume_type, notes, alternative_exercise_ids)
  SELECT p_workout_id, auth.uid(), i.order_index, i.exercise_id, i.display_name, i.sets, i.reps, i.rest_secs,
         i.default_weight_kg, i.is_unilateral, i.is_mandatory, i.is_timed, i.duration_secs, i.is_assistance,
         i.volume_type, i.notes, i.alternative_exercise_ids
  FROM jsonb_to_recordset(p_items) AS i(
    order_index int, exercise_id text, display_name text, sets int, reps text, rest_secs int,
    default_weight_kg double precision, is_unilateral boolean, is_mandatory boolean, is_timed boolean,
    duration_secs int, is_assistance boolean, volume_type text, notes text, alternative_exercise_ids text[]);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.replace_workout_exercises(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_workout_exercises(uuid, jsonb) TO authenticated;
