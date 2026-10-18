-- Personal records are derived from set_logs. Deleting a session cascades its sets away, so every record those sets
-- could have held is recomputed from the sets that remain; otherwise a discarded session leaves a phantom best.

-- The value a set contributes to a record type, or NULL when it cannot count. Mirrors selectRecordCandidate
-- (src/lib/workout/personalRecords.ts): is_timed separates timed sets from rep sets exactly as volume_type 'timed'
-- does; between weighted and reps-based exercises the existing record's type stands in for the volume type,
-- which set_logs does not store.
CREATE OR REPLACE FUNCTION public.personal_record_value(p_record_type text, p_set public.set_logs)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT CASE
    WHEN p_set.block_type <> 'working' THEN NULL
    WHEN p_record_type = 'max_duration_secs' THEN
      CASE WHEN p_set.is_timed AND p_set.duration_secs > 0 THEN p_set.duration_secs::double precision END
    WHEN p_set.is_timed THEN NULL
    WHEN p_record_type = 'max_weight' THEN CASE WHEN p_set.weight_kg > 0 AND p_set.reps > 0 THEN p_set.weight_kg END
    WHEN p_record_type = 'max_reps' THEN CASE WHEN p_set.reps > 0 THEN p_set.reps::double precision END
  END
$$;

-- Re-derives the user's records for the given exercises: each keeps the best remaining set (the first one logged
-- on a tie, as logging only replaces a record when strictly beaten), and a record no set supports is removed.
CREATE OR REPLACE FUNCTION public.recompute_personal_records(p_user_id uuid, p_exercise_ids text[])
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.personal_records pr
  WHERE pr.user_id = p_user_id AND pr.exercise_id = ANY(p_exercise_ids)
    AND NOT EXISTS (
      SELECT 1 FROM public.set_logs s
      WHERE s.user_id = pr.user_id AND s.exercise_id = pr.exercise_id AND s.session_id IS NOT NULL
        AND public.personal_record_value(pr.record_type, s) IS NOT NULL);

  UPDATE public.personal_records pr
  SET value = best.value, session_id = best.session_id, set_on = best.date
  FROM public.personal_records target
  CROSS JOIN LATERAL (
    SELECT public.personal_record_value(target.record_type, s) AS value, s.session_id, ws.date
    FROM public.set_logs s
    JOIN public.workout_sessions ws ON ws.id = s.session_id
    WHERE s.user_id = target.user_id AND s.exercise_id = target.exercise_id
      AND public.personal_record_value(target.record_type, s) IS NOT NULL
    ORDER BY 1 DESC, s.logged_at
    LIMIT 1
  ) best
  WHERE pr.id = target.id AND target.user_id = p_user_id AND target.exercise_id = ANY(p_exercise_ids);
END;
$$;

-- Deletes one of the caller's sessions (its sets cascade) and recomputes the records those sets touched, atomically.
-- Deleting a session that is already gone is a no-op, so a stale draft can always be discarded.
CREATE OR REPLACE FUNCTION public.delete_workout_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_exercise_ids text[];
BEGIN
  SELECT array_agg(DISTINCT s.exercise_id) INTO v_exercise_ids
  FROM public.set_logs s
  WHERE s.session_id = p_session_id AND s.user_id = auth.uid() AND s.exercise_id IS NOT NULL;

  DELETE FROM public.workout_sessions WHERE id = p_session_id AND user_id = auth.uid();

  PERFORM public.recompute_personal_records(auth.uid(), coalesce(v_exercise_ids, '{}'));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.personal_record_value(text, public.set_logs) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.recompute_personal_records(uuid, text[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_workout_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.personal_record_value(text, public.set_logs) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_personal_records(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_workout_session(uuid) TO authenticated;
