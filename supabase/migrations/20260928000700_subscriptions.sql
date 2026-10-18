CREATE TABLE public.subscriptions (
  user_id            uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  plan               text NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'MONTHLY', 'ANNUAL')),
  status             text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'expired')),
  current_period_end timestamptz,
  provider_ref       text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX subscriptions_status_idx ON public.subscriptions (user_id, status);

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Read-only to clients: plan changes come from the payment provider via the service role.
CREATE POLICY subscriptions_select_own ON public.subscriptions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user_provisioning()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.streaks (user_id, current_streak, longest_streak, total_sessions, updated_at)
  VALUES (NEW.id, 0, 0, 0, now());

  INSERT INTO public.user_profile (user_id, name, age, height_cm, starting_weight_kg, goal)
  VALUES (NEW.id, NULL, NULL, NULL, NULL, NULL);

  INSERT INTO public.subscriptions (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$;

INSERT INTO public.subscriptions (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
