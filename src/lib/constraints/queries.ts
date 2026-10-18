import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ConstraintType, UserConstraint } from '@/types'
import { assertNoDbError } from '@/lib/errors'
import { CONSTRAINT_ACTIONS, CONSTRAINT_TYPES, toEnumValue } from '@/lib/enums'
import type { ConstraintRule } from './evaluate'

type Client = SupabaseClient<Database>

export async function loadUserConstraints(supabase: Client, userId: string): Promise<UserConstraint[]> {
  const { data, error } = await supabase.from('constraint_profiles')
    .select('constraint_type, detail, rom_cap_degrees, contraindications, priority_area')
    .eq('user_id', userId)
  assertNoDbError(error, 'load constraints')
  return (data ?? []).map(row => ({
    constraintType: toEnumValue(CONSTRAINT_TYPES, row.constraint_type, 'constraint_type'),
    detail: row.detail,
    romCapDegrees: row.rom_cap_degrees,
    contraindications: row.contraindications,
    priorityArea: row.priority_area,
  }))
}

/** Loads substitution rules for the given constraint types, with safe-alternative names resolved. */
export async function loadConstraintRules(
  supabase: Client,
  constraintTypes: readonly ConstraintType[],
): Promise<ConstraintRule[]> {
  if (constraintTypes.length === 0) return []
  const { data, error } = await supabase.from('substitution_rules')
    .select('constraint_type, exercise_id, action, safe_alternative_id, warning, rationale, safe_alternative:exercises!substitution_rules_safe_alternative_id_fkey(name)')
    .in('constraint_type', [...constraintTypes])
  assertNoDbError(error, 'load substitution rules')
  return (data ?? []).map(row => ({
    constraintType: toEnumValue(CONSTRAINT_TYPES, row.constraint_type, 'constraint_type'),
    exerciseId: row.exercise_id,
    action: toEnumValue(CONSTRAINT_ACTIONS, row.action, 'action'),
    safeAlternativeId: row.safe_alternative_id,
    safeAlternativeName: row.safe_alternative?.name ?? null,
    warning: row.warning,
    rationale: row.rationale,
  }))
}
