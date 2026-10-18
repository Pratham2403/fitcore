import type { ConstraintType, ConstraintWarning, DayOfWeek, Protocol } from '@/types'

export type SubstitutionStatus = 'pending' | 'approved' | 'rejected'

/** A constraint-driven swap the post-pass made; shown to the user for approval. */
export interface CoachSubstitution {
  /** The exercise the model picked, which the user's constraints rule out. */
  originalExerciseId: string
  originalName: string
  constraintType: ConstraintType
  /** Why the swap was made (training guidance, not medical advice). */
  rationale: string
  status: SubstitutionStatus
}

export interface CoachExercise {
  exerciseId: string
  name: string
  sets: number
  /** e.g. "8–12", "AMRAP", "30s". */
  reps: string
  restSecs: number
  rationale: string
  /** Added because a constraint requires it (e.g. Kegels for pelvic floor). */
  isMandatory: boolean
  /** cap_rom / warn warnings for this (final) exercise. */
  warnings: ConstraintWarning[]
  substitution?: CoachSubstitution
}

export interface CoachDay {
  dayOfWeek: DayOfWeek
  name: string
  focus: string
  protocol: Protocol
  exercises: CoachExercise[]
}

export interface CoachDraft {
  buildId: string
  /** Revisions still allowed on this build. */
  turnsRemaining: number
  days: CoachDay[]
  summary: string
  disclaimer: string
}
