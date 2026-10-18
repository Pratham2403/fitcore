-- Review of substitution_rules: fix two over-length warning strings, add gap coverage.
-- Additive only: UPDATE (by id) + INSERT. No deletes, no other tables touched.

-- Fix 1: lr_imbalance / Bent Over Barbell Row — warning exceeded 60 chars (64)
UPDATE substitution_rules
SET warning = 'Stronger side compensates — row one arm at a time',
    updated_at = now()
WHERE id = 'ce7bd4ab-78e9-4784-8e5b-fd2a66db6ad8';

-- Fix 2: shoulder_impingement / Parallel Bar Dip — warning exceeded 60 chars (67)
UPDATE substitution_rules
SET warning = 'Deep dips stress the shoulder — use neutral-grip press',
    updated_at = now()
WHERE id = '57fbe3f1-6cee-4e6d-9ea8-ea0da2409f40';

-- Gap: hypertension — heavy overhead barbell press is a Valsalva/breath-hold risk
-- like the squat, deadlift and leg press rows already covered.
INSERT INTO substitution_rules (constraint_type, exercise_id, action, safe_alternative_id, warning, rationale, source)
VALUES (
  'hypertension', 'Standing_Military_Press', 'warn', NULL,
  'Breathe through reps — no max breath-holds',
  'Heavy overhead pressing with a held breath can spike blood pressure sharply. Keep loads moderate, avoid grinding to failure and breathe out on the way up.',
  'FitCore coaching rules v1 — general'
);

-- Gap: pelvic_floor — Plank is a sustained isometric hold that invites breath-holding,
-- the same mechanism already flagged for hypertension; pelvic_floor was missing it.
INSERT INTO substitution_rules (constraint_type, exercise_id, action, safe_alternative_id, warning, rationale, source)
VALUES (
  'pelvic_floor', 'Plank', 'warn', NULL,
  'Keep breathing — avoid breath-holding',
  'Holding a plank while holding your breath raises pressure inside the abdomen and down onto the pelvic floor. Breathe continuously and prefer several shorter holds over one long one.',
  'FitCore coaching rules v1 — SRS physical flags'
);

-- Gap: wrist_pain — a straight-bar, close-grip lying extension locks the wrist back
-- under load, the same mechanism already flagged for the barbell curl and bench press.
INSERT INTO substitution_rules (constraint_type, exercise_id, action, safe_alternative_id, warning, rationale, source)
VALUES (
  'wrist_pain', 'Lying_Close-Grip_Barbell_Triceps_Extension_Behind_The_Head', 'substitute', 'Cable_Rope_Overhead_Triceps_Extension',
  'Straight bar locks the wrist — use rope extension',
  'A straight barbell close-grip extension keeps the wrist locked back under load. A rope attachment lets the wrist stay in a neutral, more comfortable position.',
  'FitCore coaching rules v1 — general'
);

-- Gap: lr_imbalance — bilateral barbell squat and deadlift let the stronger leg
-- dominate the same way the existing leg-press row already warns about.
INSERT INTO substitution_rules (constraint_type, exercise_id, action, safe_alternative_id, warning, rationale, source)
VALUES (
  'lr_imbalance', 'Barbell_Squat', 'warn', NULL,
  'Push evenly — add single-leg work',
  'The stronger leg can dominate a two-leg squat. Focus on pushing evenly through both feet and add some single-leg work, starting with the weaker side.',
  'FitCore coaching rules v1 — SRS physical flags'
);

INSERT INTO substitution_rules (constraint_type, exercise_id, action, safe_alternative_id, warning, rationale, source)
VALUES (
  'lr_imbalance', 'Barbell_Deadlift', 'warn', NULL,
  'Push evenly — add single-leg work',
  'The stronger leg can dominate a bilateral deadlift. Focus on driving evenly through both feet and add single-leg deadlift work, starting with the weaker side.',
  'FitCore coaching rules v1 — SRS physical flags'
);
