'use server'

import type { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient, getAuthenticatedUserId, type ServerSupabaseClient } from '@/lib/supabase/server'
import { assertNoDbError, requireDbData, toActionResult } from '@/lib/errors'
import { withUserViewInvalidation } from '@/lib/cache'
import { clientLocalDateSchema, parseInput } from '@/lib/validation'
import { EXPERIENCE_LEVELS, toEnumValue } from '@/lib/enums'
import { loadEntitlements } from '@/lib/entitlements'
import { loadUserConstraints } from '@/lib/constraints/queries'
import type { ActionResult, Entitlements, ProfileView } from '@/types'
import type { TablesUpdate } from '@/types/database'
import {
  bodyWeightSchema, constraintListSchema, equipmentListSchema, onboardingInputSchema, profileInputSchema,
  type ConstraintInput, type OnboardingInput, type ProfileInput,
} from './schema'

type ParsedProfile = z.output<typeof profileInputSchema>
type ParsedConstraint = z.output<typeof constraintListSchema>[number]

function toProfileColumns(profile: ParsedProfile): TablesUpdate<'user_profile'> {
  return {
    name: profile.name,
    age: profile.age,
    sex: profile.sex,
    height_cm: profile.heightCm,
    starting_weight_kg: profile.startingWeightKg,
    goal: profile.goal,
    experience_level: profile.experienceLevel,
    training_days_per_week: profile.trainingDaysPerWeek,
    session_minutes: profile.sessionMinutes,
  }
}

async function updateProfileRow(supabase: ServerSupabaseClient, userId: string, columns: TablesUpdate<'user_profile'>) {
  const { error } = await supabase.from('user_profile').update(columns).eq('user_id', userId)
  assertNoDbError(error, 'update profile')
}

/** Upserts the listed constraints first, then removes unlisted ones, so a partial failure never drops a constraint. */
async function replaceConstraints(supabase: ServerSupabaseClient, userId: string, constraints: ParsedConstraint[]) {
  if (constraints.length > 0) {
    const { error } = await supabase.from('constraint_profiles').upsert(constraints.map(constraint => ({
      user_id: userId,
      constraint_type: constraint.constraintType,
      detail: constraint.detail ?? null,
      rom_cap_degrees: constraint.romCapDegrees ?? null,
      contraindications: constraint.contraindications,
      priority_area: constraint.priorityArea,
    })), { onConflict: 'user_id,constraint_type' })
    assertNoDbError(error, 'save constraints')
  }
  const keptTypes = constraints.map(constraint => constraint.constraintType)
  const staleQuery = supabase.from('constraint_profiles').delete().eq('user_id', userId)
  const { error } = keptTypes.length > 0
    ? await staleQuery.not('constraint_type', 'in', `(${keptTypes.join(',')})`)
    : await staleQuery
  assertNoDbError(error, 'remove constraints')
}

function revalidateProfileViews(): void {
  revalidatePath('/', 'layout')
}

export async function getProfile(): Promise<ProfileView> {
  const supabase = await createClient()
  const userId = await getAuthenticatedUserId(supabase)
  const [profileResult, weightsResult, constraints] = await Promise.all([
    supabase.from('user_profile').select('*').eq('user_id', userId).single(),
    supabase.from('body_metrics').select('date, weight_kg').eq('user_id', userId).order('date'),
    loadUserConstraints(supabase, userId),
  ])
  const profile = requireDbData(profileResult, 'load profile')
  assertNoDbError(weightsResult.error, 'load body weights')
  return {
    name: profile.name,
    age: profile.age,
    sex: profile.sex,
    heightCm: profile.height_cm,
    startingWeightKg: profile.starting_weight_kg,
    goal: profile.goal,
    experienceLevel: profile.experience_level === null
      ? null
      : toEnumValue(EXPERIENCE_LEVELS, profile.experience_level, 'experience_level'),
    trainingDaysPerWeek: profile.training_days_per_week,
    sessionMinutes: profile.session_minutes,
    equipment: profile.equipment,
    constraints,
    onboardedAt: profile.onboarded_at,
    weightHistory: (weightsResult.data ?? []).map(row => ({ date: row.date, weightKg: row.weight_kg })),
  }
}

/** Saves the onboarding answers and marks the user onboarded (unlocks the app shell). */
export async function completeOnboarding(input: OnboardingInput): Promise<ActionResult<void>> {
  return toActionResult(async () => {
    const { equipment, constraints, ...profile } = parseInput(onboardingInputSchema, input)
    const supabase = await createClient()
    const userId = await getAuthenticatedUserId(supabase)
    await withUserViewInvalidation(userId, async () => {
      await replaceConstraints(supabase, userId, constraints)
      await updateProfileRow(supabase, userId, { ...toProfileColumns(profile), equipment, onboarded_at: new Date().toISOString() })
    })
    revalidateProfileViews()
  })
}

/** Updates only the provided profile fields. */
export async function updateProfile(input: ProfileInput): Promise<ActionResult<void>> {
  return toActionResult(async () => {
    const profile = parseInput(profileInputSchema, input)
    const supabase = await createClient()
    const userId = await getAuthenticatedUserId(supabase)
    await withUserViewInvalidation(userId, () => updateProfileRow(supabase, userId, toProfileColumns(profile)))
    revalidateProfileViews()
  })
}

export async function updateEquipment(equipment: string[]): Promise<ActionResult<void>> {
  return toActionResult(async () => {
    const items = parseInput(equipmentListSchema, equipment)
    const supabase = await createClient()
    const userId = await getAuthenticatedUserId(supabase)
    await withUserViewInvalidation(userId, () => updateProfileRow(supabase, userId, { equipment: items }))
    revalidateProfileViews()
  })
}

/** Replaces the user's full constraint set. */
export async function setConstraints(constraints: ConstraintInput[]): Promise<ActionResult<void>> {
  return toActionResult(async () => {
    const items = parseInput(constraintListSchema, constraints)
    const supabase = await createClient()
    const userId = await getAuthenticatedUserId(supabase)
    await withUserViewInvalidation(userId, () => replaceConstraints(supabase, userId, items))
    revalidateProfileViews()
  })
}

/**
 * Records today's body weight (one entry per day; re-logging overwrites).
 * @param localDate - the caller's local date (YYYY-MM-DD).
 */
export async function logBodyWeight(weightKg: number, localDate: string): Promise<ActionResult<{ date: string; weightKg: number }>> {
  return toActionResult(async () => {
    const weight = parseInput(bodyWeightSchema, weightKg)
    const date = parseInput(clientLocalDateSchema, localDate)
    const supabase = await createClient()
    const userId = await getAuthenticatedUserId(supabase)
    const { error } = await withUserViewInvalidation(userId, async () => supabase.from('body_metrics')
      .upsert({ user_id: userId, date, weight_kg: weight }, { onConflict: 'user_id,date' }))
    assertNoDbError(error, 'log body weight')
    revalidateProfileViews()
    return { date, weightKg: weight }
  })
}

export async function getEntitlements(): Promise<Entitlements> {
  const supabase = await createClient()
  const userId = await getAuthenticatedUserId(supabase)
  return loadEntitlements(supabase, userId)
}
