CREATE DOMAIN public.physical_constraint AS text
  CHECK (VALUE IN ('patellar_tendon', 'flat_foot', 'lr_imbalance', 'pelvic_floor',
                   'lower_back', 'shoulder_impingement', 'wrist_pain', 'hypertension'));

CREATE TABLE public.constraint_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  constraint_type   public.physical_constraint NOT NULL,
  detail            text CHECK (char_length(detail) <= 500),
  rom_cap_degrees   int CHECK (rom_cap_degrees BETWEEN 0 AND 180),
  contraindications text[] NOT NULL DEFAULT '{}',
  priority_area     boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, constraint_type)
);

CREATE TABLE public.substitution_rules (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  constraint_type     public.physical_constraint NOT NULL,
  exercise_id         text NOT NULL REFERENCES public.exercises (id),
  action              text NOT NULL CHECK (action IN ('substitute', 'cap_rom', 'warn')),
  safe_alternative_id text REFERENCES public.exercises (id),
  warning             text NOT NULL CHECK (char_length(warning) BETWEEN 1 AND 80),
  rationale           text NOT NULL CHECK (char_length(rationale) > 0),
  source              text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (constraint_type, exercise_id),
  CHECK (action <> 'substitute' OR safe_alternative_id IS NOT NULL),
  CHECK (safe_alternative_id IS DISTINCT FROM exercise_id)
);

CREATE INDEX substitution_rules_constraint_type_idx ON public.substitution_rules (constraint_type);
CREATE INDEX substitution_rules_exercise_id_idx ON public.substitution_rules (exercise_id);
CREATE INDEX substitution_rules_safe_alternative_id_idx ON public.substitution_rules (safe_alternative_id);

CREATE TRIGGER substitution_rules_set_updated_at BEFORE UPDATE ON public.substitution_rules
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TABLE public.constraint_requirements (
  constraint_type public.physical_constraint NOT NULL,
  exercise_id     text NOT NULL REFERENCES public.exercises (id),
  rationale       text NOT NULL CHECK (char_length(rationale) > 0),
  PRIMARY KEY (constraint_type, exercise_id)
);

CREATE INDEX constraint_requirements_exercise_id_idx ON public.constraint_requirements (exercise_id);

ALTER TABLE public.constraint_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitution_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constraint_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_rows ON public.constraint_profiles FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Global read-only knowledge base: writes happen only through migrations / service role.
CREATE POLICY substitution_rules_public_read ON public.substitution_rules
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY constraint_requirements_public_read ON public.constraint_requirements
  FOR SELECT TO anon, authenticated USING (true);
