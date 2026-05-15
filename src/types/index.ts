export type DayType = 'push_a' | 'pull_a' | 'legs_a' | 'push_b' | 'pull_b' | 'legs_b'
export type SessionStatus = 'in_progress' | 'completed' | 'skipped'
export type RecordType = 'max_weight' | 'max_reps' | 'max_duration_secs'
export type Side = 'left' | 'right' | null

export interface Exercise {
  name: string
  sets: number
  reps: string            // e.g. "6–8", "10–12", "AMRAP", "45–60s"
  restSecs: number
  isTimed: boolean
  durationSecs?: number   // for timed exercises (planks, kegels)
  isUnilateral: boolean
  isMandatory: boolean    // kegels — cannot be skipped
  hasKneeWarning: boolean // leg extension permanent red warning
  notes: string
  alternatives: string[]
  muscleGroups: string[]
}

export interface WarmupExercise {
  name: string
  duration: string        // human-readable e.g. "90s", "2 × 20s"
  durationSecs: number    // for timer
  joints: string
  how: string
  tip: string
}

export interface StretchExercise {
  name: string
  duration: string
  durationSecs: number
}

export interface DaySession {
  dayType: DayType
  label: string
  focus: string
  warmupProtocol: 'push' | 'pull' | 'legs'
  warmupDurationMins: number
  exercises: Exercise[]
  warmup: WarmupExercise[]
  stretch: StretchExercise[]
}

export interface WorkoutSession {
  id: string
  date: string
  day_type: DayType
  status: SessionStatus
  duration_min?: number
  readiness_sleep?: number
  readiness_energy?: number
  readiness_soreness?: number
  readiness_protein?: number
  wellness_score?: number
  total_volume_kg?: number
  notes?: string
  completed_at?: string
  created_at: string
}

export interface SetLog {
  id: string
  session_id: string
  exercise_name: string
  set_number: number
  reps?: number
  weight_kg?: number
  is_timed: boolean
  duration_secs?: number
  rpe?: 1 | 2 | 3
  is_pr: boolean
  side?: Side
  logged_at: string
}

export interface PersonalRecord {
  id: string
  exercise_name: string
  record_type: RecordType
  value: number
  set_on: string
  session_id?: string
}

export interface Streak {
  id: string
  current_streak: number
  longest_streak: number
  last_workout_date?: string
  total_sessions: number
  updated_at: string
}

export interface UserProfile {
  id: string
  name: string
  age: number
  height_cm: number
  starting_weight_kg: number
  goal: string
  created_at: string
}

export interface BodyMetric {
  id: string
  date: string
  weight_kg: number
  notes?: string
  created_at: string
}

export interface ReadinessCheckIn {
  sleep: 1 | 2 | 3
  energy: 1 | 2 | 3
  soreness: 1 | 2 | 3
  protein: 1 | 2 | 3
}

export interface Quote {
  text: string
  author: string
}
