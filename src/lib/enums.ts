import type {
  BlockType, ConstraintAction, ConstraintType, ExperienceLevel, MovementPattern, Protocol, RecordType, SubscriptionPlan, VolumeType,
} from '@/types'

export const PROTOCOLS = ['push', 'pull', 'legs', 'recovery', 'full_body'] as const satisfies readonly Protocol[]
export const VOLUME_TYPES = ['weighted', 'bodyweight_full', 'reps_only', 'timed'] as const satisfies readonly VolumeType[]
export const RECORD_TYPES = ['max_weight', 'max_reps', 'max_duration_secs'] as const satisfies readonly RecordType[]
export const BLOCK_TYPES = ['working', 'warmup', 'stretch'] as const satisfies readonly BlockType[]
export const CONSTRAINT_TYPES = [
  'patellar_tendon', 'flat_foot', 'lr_imbalance', 'pelvic_floor',
  'lower_back', 'shoulder_impingement', 'wrist_pain', 'hypertension',
] as const satisfies readonly ConstraintType[]
export const CONSTRAINT_ACTIONS = ['substitute', 'cap_rom', 'warn'] as const satisfies readonly ConstraintAction[]
export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const satisfies readonly ExperienceLevel[]
export const MOVEMENT_PATTERNS = [
  'squat', 'hinge', 'lunge', 'glute_bridge', 'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull',
  'carry', 'core', 'biceps', 'triceps', 'shoulder_iso', 'rear_delt', 'chest_iso', 'leg_iso', 'calf', 'forearm',
  'power', 'conditioning', 'mobility',
] as const satisfies readonly MovementPattern[]
export const SUBSCRIPTION_PLANS = ['FREE', 'MONTHLY', 'ANNUAL'] as const satisfies readonly SubscriptionPlan[]

/** Narrows a DB text value to a whitelisted literal. @throws Error when the value is outside the whitelist. */
export function toEnumValue<T extends string>(whitelist: readonly T[], value: string | null, field: string): T {
  const match = whitelist.find(allowed => allowed === value)
  if (match === undefined) throw new Error(`Unexpected ${field}: ${value}`)
  return match
}
