-- PR identity is (user, catalog exercise, record type). The display-name key only identifies legacy rows without a
-- catalog id; keeping it global would reject a PR whenever two different exercises share a user-chosen label.
CREATE UNIQUE INDEX IF NOT EXISTS personal_records_user_legacy_name_record_unique
  ON public.personal_records (user_id, exercise_name, record_type)
  WHERE exercise_id IS NULL;

ALTER TABLE public.personal_records DROP CONSTRAINT IF EXISTS personal_records_user_exercise_record_unique;
