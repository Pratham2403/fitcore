import type { ConstraintType, ExperienceLevel } from '@/types'
import type { ChipOption } from '@/components/ui/Chip'
import type { Segment } from '@/components/ui/SegmentedControl'
import { CATALOG_EQUIPMENT } from '@/lib/catalog/facets'
import type { GOALS, SEXES } from '@/lib/profile/schema'

export type Goal = typeof GOALS[number]
export type Sex = typeof SEXES[number]
export type Equipment = typeof CATALOG_EQUIPMENT[number]

/** Shown wherever users declare physical constraints. */
export const MEDICAL_DISCLAIMER = 'Not medical advice — consult a physio for real injuries.'

export const GOAL_OPTIONS: readonly { value: Goal; label: string; description: string }[] = [
  { value: 'build_muscle', label: 'Build muscle', description: 'Hypertrophy-focused volume and rep ranges.' },
  { value: 'get_stronger', label: 'Get stronger', description: 'Heavier compounds, lower reps, longer rest.' },
  { value: 'lose_fat', label: 'Lose fat', description: 'Keep strength while you diet, with denser sessions.' },
  { value: 'general_fitness', label: 'General fitness', description: 'Balanced training you can keep up for years.' },
]

export const EXPERIENCE_SEGMENTS: readonly Segment<ExperienceLevel>[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export const SEX_SEGMENTS: readonly Segment<Sex>[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

export const SESSION_MINUTE_CHOICES = [30, 45, 60, 75, 90] as const
export const TRAINING_DAY_CHOICES = [1, 2, 3, 4, 5, 6, 7] as const

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  'body only': 'Bodyweight',
  dumbbell: 'Dumbbells',
  barbell: 'Barbell',
  'e-z curl bar': 'EZ curl bar',
  kettlebells: 'Kettlebells',
  cable: 'Cable machine',
  machine: 'Machines',
  bands: 'Bands',
  'medicine ball': 'Medicine ball',
  'exercise ball': 'Exercise ball',
  'foam roll': 'Foam roller',
  other: 'Other',
}

export const EQUIPMENT_OPTIONS: readonly ChipOption<Equipment>[] =
  CATALOG_EQUIPMENT.map(value => ({ value, label: EQUIPMENT_LABELS[value] }))

export const EQUIPMENT_PRESETS: readonly { label: string; equipment: readonly Equipment[] }[] = [
  { label: 'Full commercial gym', equipment: CATALOG_EQUIPMENT },
  { label: 'Home dumbbells', equipment: ['body only', 'dumbbell', 'bands'] },
  { label: 'Bodyweight only', equipment: ['body only'] },
]

/** Narrows stored equipment strings to the catalog whitelist. */
export function toEquipmentList(values: readonly string[]): Equipment[] {
  return CATALOG_EQUIPMENT.filter(equipment => values.includes(equipment))
}

export const CONSTRAINT_INFO: Record<ConstraintType, { label: string; description: string }> = {
  patellar_tendon: { label: 'Knee (patellar tendon)', description: 'Pain below the kneecap with deep knee bends or jumping.' },
  flat_foot: { label: 'Flat feet', description: 'Low arches; ankles roll in when standing or squatting.' },
  lr_imbalance: { label: 'Left/right imbalance', description: 'One side is noticeably weaker than the other.' },
  pelvic_floor: { label: 'Pelvic floor', description: 'Leaking or pressure when lifting heavy, coughing or jumping.' },
  lower_back: { label: 'Lower back', description: 'Back pain with heavy hinging or loaded spinal flexion.' },
  shoulder_impingement: { label: 'Shoulder impingement', description: 'Pinching at the top of the shoulder when pressing overhead.' },
  wrist_pain: { label: 'Wrist pain', description: 'Pain with bent-back wrists, like push-ups or front racks.' },
  hypertension: { label: 'High blood pressure', description: 'Avoid long breath-holds and maximal straining.' },
}

export function goalLabel(goal: string | null): string {
  return GOAL_OPTIONS.find(option => option.value === goal)?.label ?? 'Not set'
}
