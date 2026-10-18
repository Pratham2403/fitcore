-- Home, history and last-session reads all filter a user's sessions by date range / order by date.
CREATE INDEX IF NOT EXISTS workout_sessions_user_date_idx ON public.workout_sessions (user_id, date DESC);
