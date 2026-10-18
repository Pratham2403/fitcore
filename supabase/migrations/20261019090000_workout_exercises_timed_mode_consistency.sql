-- A timed exercise logs durations and earns duration PRs; any mismatch makes its PR unreachable.
alter table public.workout_exercises
  add constraint workout_exercises_timed_mode_check check (is_timed = (volume_type = 'timed'));
