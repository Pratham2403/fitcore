-- Saves an AI Coach plan in one transaction: deletes the workouts it replaces, creates one workout per plan day with
-- its exercises, and schedules them. Any failure (e.g. workout_limit_reached) rolls everything back.
-- SECURITY INVOKER: RLS still applies; the explicit user_id guard keeps the delete to the caller's own workouts.
CREATE OR REPLACE FUNCTION public.save_coach_plan(p_days jsonb, p_replace_workout_ids uuid[])
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_day jsonb;
  v_workout_id uuid;
  v_workout_ids uuid[] := '{}';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  DELETE FROM public.workouts WHERE id = ANY (p_replace_workout_ids) AND user_id = v_user_id;

  FOR v_day IN SELECT value FROM jsonb_array_elements(p_days) WITH ORDINALITY ORDER BY ordinality LOOP
    INSERT INTO public.workouts (user_id, name, focus, protocol)
    VALUES (v_user_id, v_day->>'name', v_day->>'focus', v_day->>'protocol')
    RETURNING id INTO v_workout_id;

    INSERT INTO public.workout_exercises
      (workout_id, user_id, order_index, exercise_id, sets, reps, rest_secs, default_weight_kg, is_unilateral,
       is_mandatory, is_timed, duration_secs, is_assistance, volume_type, notes)
    SELECT v_workout_id, v_user_id, e.order_index, e.exercise_id, e.sets, e.reps, e.rest_secs, e.default_weight_kg,
           e.is_unilateral, e.is_mandatory, e.is_timed, e.duration_secs, e.is_assistance, e.volume_type, e.notes
    FROM jsonb_to_recordset(v_day->'exercises') AS e(
      order_index int, exercise_id text, sets int, reps text, rest_secs int, default_weight_kg double precision,
      is_unilateral boolean, is_mandatory boolean, is_timed boolean, duration_secs int, is_assistance boolean,
      volume_type text, notes text);

    INSERT INTO public.weekly_schedule (user_id, day_of_week, workout_id)
    VALUES (v_user_id, (v_day->>'day_of_week')::smallint, v_workout_id)
    ON CONFLICT (user_id, day_of_week) DO UPDATE SET workout_id = EXCLUDED.workout_id;

    v_workout_ids := v_workout_ids || v_workout_id;
  END LOOP;

  RETURN v_workout_ids;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_coach_plan(jsonb, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_coach_plan(jsonb, uuid[]) TO authenticated;
