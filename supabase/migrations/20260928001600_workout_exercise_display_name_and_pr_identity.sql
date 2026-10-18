-- Label override so program exercises keep the user's name when the catalog row is named differently.
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS display_name text NULL
  CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 80);

-- PRs are identified by catalog exercise; NULL exercise_id (legacy rows) stays distinct, so the old name key keeps working for them.
CREATE UNIQUE INDEX IF NOT EXISTS personal_records_user_exercise_id_record_unique
  ON public.personal_records (user_id, exercise_id, record_type);

-- Backfill Pratham's original labels (retired workoutData.ts) where they differ from the catalog name.
UPDATE public.workout_exercises we
SET display_name = legacy.name
FROM (VALUES
('Push A',0,'DB Flat Bench Press'),
('Push A',1,'Incline DB Press (30°)'),
('Push A',2,'Pec Deck Fly'),
('Push A',3,'Dip — Assisted Machine'),
('Push A',4,'Tricep Pushdown — Rope'),
('Push A',5,'DB Lateral Raises'),
('Pull A',0,'Assisted Pull-up — Overhand Wide'),
('Pull A',1,'Lat Pulldown — Wide Grip'),
('Pull A',2,'Seated Cable Row — Close Grip'),
('Pull A',3,'Single-Arm DB Row'),
('Pull A',4,'Rear Delt Fly Machine'),
('Pull A',5,'DB Bicep Curl'),
('Pull A',6,'Wrist Curls — Both Directions'),
('Legs A',0,'Sumo Goblet Squat'),
('Legs A',1,'Leg Press'),
('Legs A',2,'DB Romanian Deadlift'),
('Legs A',3,'Hip Abduction Machine'),
('Legs A',4,'Hip Adduction Machine'),
('Legs A',5,'Seated Calf Raises'),
('Legs A',6,'Kegels'),
('Legs A',7,'Weighted Ab Crunch Machine'),
('Push B',0,'Incline DB Press (45°)'),
('Push B',1,'Cable Fly — Low Cable Cross'),
('Push B',2,'Dip — Assisted Machine'),
('Push B',3,'Shoulder Press Machine'),
('Push B',4,'DB Lateral Raises'),
('Push B',5,'Tricep Pushdown Machine'),
('Pull B',0,'Assisted Chin-up — Underhand'),
('Pull B',1,'Lat Pulldown — Underhand'),
('Pull B',2,'Single-Arm DB Row'),
('Pull B',3,'Seated Cable Row — Wide Grip'),
('Pull B',4,'Cable Face Pulls'),
('Pull B',5,'DB Hammer Curl'),
('Pull B',6,'EZ Bar Reverse Curl'),
('Pull B',7,'Wrist Curls — Both Directions'),
('Legs B',0,'DB Romanian Deadlift'),
('Legs B',1,'Smith Machine Hip Thrust'),
('Legs B',2,'Leg Press — Wide Stance'),
('Legs B',3,'Leg Extension — PARTIAL 0 to 90° ONLY'),
('Legs B',4,'Lateral Lunge (DB)'),
('Legs B',5,'Hip Abduction Machine'),
('Legs B',6,'Hip Adduction Machine'),
('Legs B',7,'Smith Machine Calf Raises'),
('Legs B',8,'Seated Calf Raises'),
('Legs B',9,'Kegels'),
('Legs B',10,'Decline Leg Raises'),
('Recovery',0,'Stationary Bike — Cardio'),
('Recovery',1,'Hip Abduction Machine'),
('Recovery',2,'Hip Adduction Machine'),
('Recovery',3,'Hyperextension — Bodyweight'),
('Recovery',4,'Weighted Ab Crunch Machine')
) AS legacy(workout_name, order_index, name)
JOIN public.workouts w ON w.name = legacy.workout_name AND w.user_id = 'a6322bc5-f2df-48bf-ad50-08151f2aab44',
  public.exercises e
WHERE we.workout_id = w.id AND we.order_index = legacy.order_index
  AND e.id = we.exercise_id AND e.name <> legacy.name AND we.display_name IS NULL;
