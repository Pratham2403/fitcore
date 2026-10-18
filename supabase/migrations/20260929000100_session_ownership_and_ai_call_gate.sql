-- Children must reference a session owned by the same user (RLS only checks the child's own user_id).
ALTER TABLE public.workout_sessions ADD CONSTRAINT workout_sessions_id_user_unique UNIQUE (id, user_id);

ALTER TABLE public.set_logs
  ADD CONSTRAINT set_logs_session_owner_fkey FOREIGN KEY (session_id, user_id)
  REFERENCES public.workout_sessions (id, user_id) ON DELETE CASCADE;

ALTER TABLE public.personal_records
  ADD CONSTRAINT personal_records_session_owner_fkey FOREIGN KEY (session_id, user_id)
  REFERENCES public.workout_sessions (id, user_id) ON DELETE SET NULL (session_id);

-- One row per coach requester; the conditional upsert below is the atomic cooldown that serialises LLM calls,
-- so concurrent requests cannot all pass the count-based limits before any of them is recorded.
CREATE TABLE public.ai_call_gate (
  requester_key text PRIMARY KEY CHECK (char_length(requester_key) <= 100),
  last_call_at  timestamptz NOT NULL
);

ALTER TABLE public.ai_call_gate ENABLE ROW LEVEL SECURITY;

/* Returns 0 when the caller acquired the slot, otherwise the seconds until the next call is allowed. */
CREATE OR REPLACE FUNCTION public.acquire_ai_call_slot(p_requester_key text, p_cooldown_secs int)
RETURNS int
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  retry_at timestamptz;
BEGIN
  INSERT INTO public.ai_call_gate AS gate (requester_key, last_call_at) VALUES (p_requester_key, now())
  ON CONFLICT (requester_key) DO UPDATE SET last_call_at = now()
    WHERE gate.last_call_at <= now() - make_interval(secs => p_cooldown_secs);
  IF FOUND THEN
    RETURN 0;
  END IF;

  SELECT gate.last_call_at + make_interval(secs => p_cooldown_secs) INTO retry_at
  FROM public.ai_call_gate gate WHERE gate.requester_key = p_requester_key;
  RETURN greatest(1, ceil(extract(epoch FROM retry_at - now())))::int;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.acquire_ai_call_slot(text, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_ai_call_slot(text, int) TO service_role;
