-- Saving a coach plan used to take over every plan day in the schedule, even when the user chose to keep the workouts
-- already there. p_take_over_days now decides it: when false, a plan day is scheduled only if it is empty and the new
-- workout is otherwise saved unscheduled. Returns each new workout with its day and whether it was scheduled.
-- SECURITY INVOKER: RLS still applies; the explicit user_id guard keeps the delete to the caller's own workouts.
DROP FUNCTION public.save_coach_plan(jsonb, uuid[]);

CREATE FUNCTION public.save_coach_plan(p_days jsonb, p_replace_workout_ids uuid[], p_take_over_days boolean)
RETURNS TABLE (workout_id uuid, day_of_week smallint, is_scheduled boolean)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_day jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  DELETE FROM public.workouts w WHERE w.id = ANY (p_replace_workout_ids) AND w.user_id = v_user_id;

  FOR v_day IN SELECT value FROM jsonb_array_elements(p_days) WITH ORDINALITY ORDER BY ordinality LOOP
    day_of_week := (v_day->>'day_of_week')::smallint;

    INSERT INTO public.workouts (user_id, name, focus, protocol)
    VALUES (v_user_id, v_day->>'name', v_day->>'focus', v_day->>'protocol')
    RETURNING id INTO workout_id;

    INSERT INTO public.workout_exercises
      (workout_id, user_id, order_index, exercise_id, sets, reps, rest_secs, default_weight_kg, is_unilateral,
       is_mandatory, is_timed, duration_secs, is_assistance, volume_type, notes)
    SELECT save_coach_plan.workout_id, v_user_id, e.order_index, e.exercise_id, e.sets, e.reps, e.rest_secs,
           e.default_weight_kg, e.is_unilateral, e.is_mandatory, e.is_timed, e.duration_secs, e.is_assistance,
           e.volume_type, e.notes
    FROM jsonb_to_recordset(v_day->'exercises') AS e(
      order_index int, exercise_id text, sets int, reps text, rest_secs int, default_weight_kg double precision,
      is_unilateral boolean, is_mandatory boolean, is_timed boolean, duration_secs int, is_assistance boolean,
      volume_type text, notes text);

    INSERT INTO public.weekly_schedule AS s (user_id, day_of_week, workout_id)
    VALUES (v_user_id, save_coach_plan.day_of_week, save_coach_plan.workout_id)
    ON CONFLICT ON CONSTRAINT weekly_schedule_pkey DO UPDATE SET workout_id = EXCLUDED.workout_id
      WHERE p_take_over_days OR s.workout_id IS NULL;
    is_scheduled := FOUND;

    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_coach_plan(jsonb, uuid[], boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_coach_plan(jsonb, uuid[], boolean) TO authenticated;
