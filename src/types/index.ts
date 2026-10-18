export type SessionStatus = 'in_progress' | 'completed' | 'skipped'
export type RecordType = 'max_weight' | 'max_reps' | 'max_duration_secs'
export type Side = 'left' | 'right' | null
export type Protocol = 'push' | 'pull' | 'legs' | 'recovery' | 'full_body'
export type VolumeType = 'weighted' | 'bodyweight_full' | 'reps_only' | 'timed'
export type BlockType = 'working' | 'warmup' | 'stretch'
/** JS `Date#getDay()` index: 0 = Sunday. */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type ConstraintType =
  | 'patellar_tendon' | 'flat_foot' | 'lr_imbalance' | 'pelvic_floor'
  | 'lower_back' | 'shoulder_impingement' | 'wrist_pain' | 'hypertension'
export type ConstraintAction = 'substitute' | 'cap_rom' | 'warn'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
/** The movement an exercise trains; exercises sharing a pattern are variants of each other. */
export type MovementPattern =
  | 'squat' | 'hinge' | 'lunge' | 'glute_bridge' | 'horizontal_push' | 'vertical_push' | 'horizontal_pull' | 'vertical_pull'
  | 'carry' | 'core' | 'biceps' | 'triceps' | 'shoulder_iso' | 'rear_delt' | 'chest_iso' | 'leg_iso' | 'calf' | 'forearm'
  | 'power' | 'conditioning' | 'mobility'
export type SubscriptionPlan = 'FREE' | 'MONTHLY' | 'ANNUAL'

export type DomainErrorCode =
  | 'VALIDATION' | 'UNAUTHENTICATED' | 'WORKOUT_LIMIT_REACHED' | 'WORKOUT_REPLACE_REQUIRED' | 'RATE_LIMITED' | 'AI_UNAVAILABLE'
  | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT'

/** Result envelope for user-facing server actions; expected failures are values, not throws. */
export type ActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: DomainErrorCode; message: string } }

export interface ExerciseRef {
  id: string
  name: string
}

/** How an exercise's sets are logged and which personal record they count towards. */
export interface LoggingMode {
  /** Logged as a hold duration instead of reps. */
  isTimed: boolean
  volumeType: VolumeType
}

/** A catalog exercise that can stand in for a plan exercise, logged in its own mode. */
export type ExerciseAlternative = ExerciseRef & LoggingMode

export interface ConstraintWarning {
  constraintType: ConstraintType
  action: ConstraintAction
  /** Short UI line, e.g. "Stop at 90° — Knee Protocol". */
  warning: string
  /** Training guidance (never medical advice). */
  rationale: string
  /** Present for `substitute` rules. */
  safeAlternative?: ExerciseRef
}

export interface Exercise {
  /** workout_exercises row id. */
  id: string
  /** Catalog exercise id. */
  exerciseId: string
  /** Display label: the user's override, else the catalog name. */
  name: string
  sets: number
  /** e.g. "6–8", "10–12", "AMRAP", "45–60s". */
  reps: string
  restSecs: number
  isTimed: boolean
  durationSecs?: number
  isUnilateral: boolean
  /** Cannot be skipped (e.g. Kegels). */
  isMandatory: boolean
  /** Starting weight in kg (0 = bodyweight). */
  defaultWeightKg: number
  /** Assisted movements — weight should trend DOWN. */
  isAssistance: boolean
  /** How this exercise contributes to total volume and which PR type is tracked. */
  volumeType: VolumeType
  notes: string
  /** Catalog alternatives (e.g. when the machine is busy): the saved ones, else ones derived from the catalog. */
  alternatives: ExerciseAlternative[]
  /** Alternatives saved with the workout; empty when `alternatives` are derived. */
  savedAlternativeIds: string[]
  /** UI muscle groups (primary + secondary) derived from the catalog. */
  muscleGroups: string[]
  warnings: ConstraintWarning[]
  imageUrls: string[]
}

export interface WarmupExercise {
  name: string
  /** Human-readable, e.g. "90s", "2 × 20s". */
  duration: string
  durationSecs: number
  joints: string
  how: string
  tip: string
  /** Muscles activated (for LiveMuscleMap). */
  muscleGroups?: string[]
}

export interface StretchExercise {
  name: string
  duration: string
  durationSecs: number
  /** Muscles stretched (for LiveMuscleMap). */
  muscleGroups?: string[]
}

export interface WorkoutPlan {
  id: string
  name: string
  focus: string
  protocol: Protocol
  exercises: Exercise[]
  warmup: WarmupExercise[]
  stretch: StretchExercise[]
}

export interface WorkoutSummary {
  id: string
  name: string
  focus: string
  protocol: Protocol
  exerciseCount: number
}

export interface WeeklyProgram {
  schedule: Record<DayOfWeek, WorkoutSummary | null>
  workouts: WorkoutSummary[]
  /** Max workouts on the current plan; null = unlimited. */
  workoutLimit: number | null
}

export interface CatalogExercise {
  id: string
  name: string
  force: string | null
  level: string
  mechanic: string | null
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  category: string
  imageUrls: string[]
  source: 'free-exercise-db' | 'fitcore'
}

export interface CatalogFacets {
  muscles: readonly string[]
  equipment: readonly string[]
  levels: readonly string[]
  mechanics: readonly string[]
  categories: readonly string[]
}

export interface UserConstraint {
  constraintType: ConstraintType
  detail: string | null
  romCapDegrees: number | null
  contraindications: string[]
  priorityArea: boolean
}

export interface ProfileView {
  name: string | null
  age: number | null
  sex: string | null
  heightCm: number | null
  startingWeightKg: number | null
  goal: string | null
  experienceLevel: ExperienceLevel | null
  trainingDaysPerWeek: number | null
  sessionMinutes: number | null
  equipment: string[]
  constraints: UserConstraint[]
  onboardedAt: string | null
  /** Body-weight logs, oldest first. */
  weightHistory: Array<{ date: string; weightKg: number }>
}

export interface Entitlements {
  plan: SubscriptionPlan
  isPaid: boolean
  /** null = unlimited. */
  workoutLimit: number | null
  aiBuildsRemaining: number
}

export interface WorkoutSession {
  id: string
  date: string
  day_type: string | null
  workout_id: string | null
  workout_name: string | null
  status: SessionStatus
  duration_min?: number
  readiness_sleep?: number
  readiness_energy?: number
  readiness_soreness?: number
  readiness_protein?: number
  wellness_score?: number
  total_volume_kg?: number
  post_mood_workout?: 1 | 2 | 3
  post_mood_energy?: 1 | 2 | 3
  completed_at?: string
  created_at: string
}

export interface SetLog {
  id: string
  session_id: string
  /** Display-name snapshot at log time. */
  exercise_name: string
  /** Catalog id; null only on legacy rows. */
  exercise_id: string | null
  block_type: BlockType
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
  exercise_id: string | null
  record_type: RecordType
  value: number
  set_on: string
  session_id?: string
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

/** Per-exercise last-session data passed from the workout page to ExerciseCard. */
export interface LastSessionData {
  avgWeight: number
  avgReps: number
  /** AMRAP exercises only. */
  perSetReps?: Array<{ setNum: number; reps: number }>
  /** Same weight across the last 3+ sessions. */
  isPlateaued?: boolean
}

/** Persisted draft for session continuation across app restarts. */
export interface SessionDraft {
  sessionId: string
  workoutId: string
  workoutName: string
  phase: 'warmup' | 'workout' | 'stretch'
  readiness: ReadinessCheckIn | null
  startTime: number
  /** ISO date string. */
  savedAt: string
}
