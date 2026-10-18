import type { CatalogExercise, CatalogFacets } from '@/types'
import type { Database } from '@/types/database'

/** Base URL for free-exercise-db images; the catalog stores paths relative to it. */
export const EXERCISE_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

export const CATALOG_MUSCLES = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest', 'forearms', 'glutes', 'hamstrings',
  'lats', 'lower back', 'middle back', 'neck', 'quadriceps', 'shoulders', 'traps', 'triceps',
] as const
export const CATALOG_EQUIPMENT = [
  'body only', 'dumbbell', 'barbell', 'e-z curl bar', 'kettlebells', 'cable', 'machine', 'bands',
  'medicine ball', 'exercise ball', 'foam roll', 'other',
] as const
export const CATALOG_LEVELS = ['beginner', 'intermediate', 'expert'] as const
export const CATALOG_MECHANICS = ['compound', 'isolation'] as const
export const CATALOG_FORCES = ['static', 'pull', 'push'] as const
export const CATALOG_CATEGORIES = [
  'strength', 'stretching', 'cardio', 'plyometrics', 'powerlifting', 'olympic weightlifting', 'strongman',
] as const

export const CATALOG_FACETS: CatalogFacets = {
  muscles: CATALOG_MUSCLES,
  equipment: CATALOG_EQUIPMENT,
  levels: CATALOG_LEVELS,
  mechanics: CATALOG_MECHANICS,
  categories: CATALOG_CATEGORIES,
}

type ExerciseRow = Database['public']['Tables']['exercises']['Row']

/** Columns needed to build a CatalogExercise (excludes the search vector). */
export const CATALOG_COLUMNS =
  'id, name, force, level, mechanic, equipment, primary_muscles, secondary_muscles, instructions, category, images, source'

/** Absolute image URLs for a catalog row's relative image paths. */
export function toImageUrls(imagePaths: readonly string[]): string[] {
  return imagePaths.map(path => EXERCISE_IMAGE_BASE_URL + path)
}

type CatalogExerciseRow = Pick<ExerciseRow,
  'id' | 'name' | 'force' | 'level' | 'mechanic' | 'equipment' | 'primary_muscles' | 'secondary_muscles' | 'instructions' | 'category' | 'images' | 'source'>

export function toCatalogExercise(row: CatalogExerciseRow): CatalogExercise {
  return {
    id: row.id,
    name: row.name,
    force: row.force,
    level: row.level,
    mechanic: row.mechanic,
    equipment: row.equipment,
    primaryMuscles: row.primary_muscles,
    secondaryMuscles: row.secondary_muscles,
    instructions: row.instructions,
    category: row.category,
    imageUrls: toImageUrls(row.images),
    source: row.source === 'fitcore' ? 'fitcore' : 'free-exercise-db',
  }
}
