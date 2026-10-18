import type { ExperienceLevel, ProfileView } from '@/types'
import type { ConstraintInput } from '@/lib/profile/schema'
import { COACH_GOALS, type CoachBuildInput } from '@/lib/coach/schema'
import {
  SESSION_MINUTE_CHOICES, TRAINING_DAY_CHOICES, toEquipmentList, type Equipment,
} from '@/components/profile/trainingOptions'

export type CoachGoal = typeof COACH_GOALS[number]

// Mirror the limits in coachBuildInputSchema so the form can stop the user before the server does.
export const MAX_PREFERRED_EXERCISES = 10
export const MAX_FREE_TEXT_LENGTH = 500

const DEFAULT_DAYS_PER_WEEK = 3
const DEFAULT_SESSION_MINUTES = 60

/** A catalog exercise the user wants the coach to include. */
export interface PreferredExercise {
  id: string
  name: string
}

/** Everything the questionnaire collects; `goal` stays null until the user picks one. */
export interface CoachFormValues {
  goal: CoachGoal | null
  experience: ExperienceLevel
  daysPerWeek: number
  sessionMinutes: number
  equipment: Equipment[]
  constraints: ConstraintInput[]
  preferredExercises: PreferredExercise[]
  freeText: string
}

/** Validation messages keyed by the questionnaire section they belong to. */
export interface CoachFormErrors {
  goal?: string
  equipment?: string
  freeText?: string
}

export const DEFAULT_COACH_FORM_VALUES: CoachFormValues = {
  goal: null,
  experience: 'beginner',
  daysPerWeek: DEFAULT_DAYS_PER_WEEK,
  sessionMinutes: DEFAULT_SESSION_MINUTES,
  equipment: [],
  constraints: [],
  preferredExercises: [],
  freeText: '',
}

/** Prefills the questionnaire from a signed-in user's profile; values outside the form's choices fall back to defaults. */
export function coachFormValuesFromProfile(profile: ProfileView | null): CoachFormValues {
  if (!profile) return DEFAULT_COACH_FORM_VALUES
  return {
    ...DEFAULT_COACH_FORM_VALUES,
    goal: COACH_GOALS.find(goal => goal === profile.goal) ?? null,
    experience: profile.experienceLevel ?? DEFAULT_COACH_FORM_VALUES.experience,
    daysPerWeek: TRAINING_DAY_CHOICES.find(days => days === profile.trainingDaysPerWeek) ?? DEFAULT_DAYS_PER_WEEK,
    sessionMinutes: SESSION_MINUTE_CHOICES.find(minutes => minutes === profile.sessionMinutes) ?? DEFAULT_SESSION_MINUTES,
    equipment: toEquipmentList(profile.equipment),
    constraints: profile.constraints.map(({ constraintType, detail, romCapDegrees }) => ({ constraintType, detail, romCapDegrees })),
  }
}

export type CoachFormParseResult =
  | { ok: true; input: CoachBuildInput }
  | { ok: false; errors: CoachFormErrors }

/** Checks the questionnaire and converts it to the coach action's input. */
export function parseCoachForm(values: CoachFormValues): CoachFormParseResult {
  const errors: CoachFormErrors = {
    goal: values.goal === null ? 'Pick the goal that fits you best.' : undefined,
    equipment: values.equipment.length === 0 ? 'Pick at least one option — “Bodyweight” counts.' : undefined,
    freeText: values.freeText.length > MAX_FREE_TEXT_LENGTH ? `Keep it under ${MAX_FREE_TEXT_LENGTH} characters.` : undefined,
  }
  if (values.goal === null || errors.equipment || errors.freeText) return { ok: false, errors }
  return {
    ok: true,
    input: {
      goal: values.goal,
      experience: values.experience,
      daysPerWeek: values.daysPerWeek,
      sessionMinutes: values.sessionMinutes,
      equipment: values.equipment,
      constraints: values.constraints.map(({ constraintType }) => ({ constraintType })),
      preferredExerciseIds: values.preferredExercises.map(exercise => exercise.id),
      freeText: values.freeText,
    },
  }
}
