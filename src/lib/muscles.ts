/** Coarse muscle groups the body-map UI can render. */
export const UI_MUSCLE_GROUPS = [
  'chest', 'shoulders', 'triceps', 'biceps', 'forearms',
  'back', 'core', 'quads', 'hamstrings', 'glutes', 'calves',
] as const

export type UiMuscleGroup = typeof UI_MUSCLE_GROUPS[number]

const CATALOG_TO_UI_GROUP: Record<string, UiMuscleGroup> = {
  abdominals: 'core',
  abductors: 'glutes',
  adductors: 'quads',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearms',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'back',
  'lower back': 'back',
  'middle back': 'back',
  quadriceps: 'quads',
  shoulders: 'shoulders',
  traps: 'back',
  triceps: 'triceps',
}

/** Maps catalog muscles (free-exercise-db vocabulary) to distinct UI groups, preserving first-seen order. */
export function toUiMuscleGroups(catalogMuscles: readonly string[]): UiMuscleGroup[] {
  const groups = catalogMuscles.flatMap(muscle => CATALOG_TO_UI_GROUP[muscle] ?? [])
  return Array.from(new Set(groups))
}

export const PR_GROUPS = ['Chest', 'Shoulders', 'Back', 'Arms', 'Calisthenics', 'Legs', 'Calves', 'Core', 'Cardio'] as const
export type PrGroup = typeof PR_GROUPS[number]

const UI_GROUP_TO_PR_GROUP: Record<UiMuscleGroup, PrGroup> = {
  chest: 'Chest', shoulders: 'Shoulders', back: 'Back', biceps: 'Arms', triceps: 'Arms', forearms: 'Arms',
  quads: 'Legs', hamstrings: 'Legs', glutes: 'Legs', calves: 'Calves', core: 'Core',
}

/** PR-board section for an exercise: assisted work is Calisthenics, cardio by category, else by first primary muscle. */
export function toPrGroup(exercise: { primaryMuscles: readonly string[]; category: string | null; isAssistance: boolean }): PrGroup {
  if (exercise.isAssistance) return 'Calisthenics'
  if (exercise.category === 'cardio') return 'Cardio'
  const [primaryGroup] = toUiMuscleGroups(exercise.primaryMuscles)
  return primaryGroup ? UI_GROUP_TO_PR_GROUP[primaryGroup] : 'Core'
}

/** For each UI muscle group, how many distinct sessions trained it (by the exercises' primary muscles). */
export function countSessionsPerMuscleGroup(
  sets: ReadonlyArray<{ sessionId: string; primaryMuscles: readonly string[] }>,
): Partial<Record<UiMuscleGroup, number>> {
  const sessionsByGroup = new Map<UiMuscleGroup, Set<string>>()
  for (const set of sets) {
    for (const group of toUiMuscleGroups(set.primaryMuscles)) {
      sessionsByGroup.set(group, (sessionsByGroup.get(group) ?? new Set()).add(set.sessionId))
    }
  }
  return Object.fromEntries(Array.from(sessionsByGroup, ([group, sessionIds]) => [group, sessionIds.size]))
}
