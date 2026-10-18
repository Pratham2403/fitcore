CREATE TABLE public.ai_builds (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  anon_fingerprint text,
  status           text NOT NULL DEFAULT 'drafting' CHECK (status IN ('drafting', 'finalized', 'abandoned')),
  request          jsonb NOT NULL,
  plan             jsonb,
  turn_count       int NOT NULL DEFAULT 0 CHECK (turn_count >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR anon_fingerprint IS NOT NULL)
);

CREATE INDEX ai_builds_user_created_idx ON public.ai_builds (user_id, created_at DESC);
CREATE INDEX ai_builds_fingerprint_created_idx ON public.ai_builds (anon_fingerprint, created_at DESC);

CREATE TRIGGER ai_builds_set_updated_at BEFORE UPDATE ON public.ai_builds
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TABLE public.ai_usage (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  anon_fingerprint text,
  build_session_id uuid,
  turn_number      int CHECK (turn_number >= 0),
  model_tier       text CHECK (model_tier IN ('haiku', 'sonnet')),
  provider         text NOT NULL CHECK (provider IN ('CLAUDE', 'GEMINI', 'GROQ')),
  model            text NOT NULL,
  step             text NOT NULL,
  input_tokens     int CHECK (input_tokens >= 0),
  output_tokens    int CHECK (output_tokens >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR anon_fingerprint IS NOT NULL)
);

CREATE INDEX ai_usage_user_created_idx ON public.ai_usage (user_id, created_at DESC);
CREATE INDEX ai_usage_fingerprint_created_idx ON public.ai_usage (anon_fingerprint, created_at DESC);
CREATE INDEX ai_usage_build_session_idx ON public.ai_usage (build_session_id);

CREATE TABLE public.waitlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE
               CHECK (email = lower(email) AND char_length(email) <= 254 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  user_id    uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  source     text CHECK (char_length(source) <= 40),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX waitlist_user_id_idx ON public.waitlist (user_id);

ALTER TABLE public.ai_builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- ai_builds / ai_usage are written only by the service role; clients may read their own builds.
CREATE POLICY ai_builds_select_own ON public.ai_builds
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Write-only for clients (no SELECT policy), and a signed-in user can only attach their own id.
CREATE POLICY waitlist_insert ON public.waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = (SELECT auth.uid()));
