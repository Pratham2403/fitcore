'use client'

import { useState } from 'react'
import type { CatalogExercise, WorkoutSummary } from '@/types'
import CatalogBrowser from '@/components/catalog/CatalogBrowser'
import ExerciseDetailSheet from './ExerciseDetailSheet'

/** Catalog browse page body: search + filters, with a detail sheet per exercise. */
export default function ExercisesView({ workouts }: { workouts: readonly WorkoutSummary[] }) {
  const [selected, setSelected] = useState<CatalogExercise | null>(null)
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pb-6 pt-6">
      <header>
        <h1 className="text-xl font-semibold">Exercises</h1>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">Search the catalog. Typos are fine.</p>
      </header>
      <CatalogBrowser onSelect={setSelected} />
      <ExerciseDetailSheet exercise={selected} workouts={workouts} onClose={() => setSelected(null)} />
    </div>
  )
}
