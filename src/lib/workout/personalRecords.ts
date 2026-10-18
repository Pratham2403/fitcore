import type { RecordType, VolumeType } from '@/types'

export interface PersonalRecordCandidate {
  recordType: RecordType
  value: number
}

/** The values of one logged set that can count towards a record. */
export interface LoggedSetValues {
  reps?: number
  weight_kg?: number
  duration_secs?: number
}

/**
 * The record a set could set, chosen by how the exercise is tracked; null when the set can't set one.
 * Mirrored by the SQL function public.personal_record_value, which re-derives records when sets are deleted.
 */
export function selectRecordCandidate(volumeType: VolumeType, set: LoggedSetValues): PersonalRecordCandidate | null {
  const reps = set.reps ?? 0
  const weight = set.weight_kg ?? 0
  const duration = set.duration_secs ?? 0
  switch (volumeType) {
    case 'weighted':
      return weight > 0 && reps > 0 ? { recordType: 'max_weight', value: weight } : null
    case 'reps_only':
    case 'bodyweight_full':
      return reps > 0 ? { recordType: 'max_reps', value: reps } : null
    case 'timed':
      return duration > 0 ? { recordType: 'max_duration_secs', value: duration } : null
  }
}
