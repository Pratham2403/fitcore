import type { Metadata } from 'next'
import { getWeeklyProgram } from '@/lib/program/actions'
import ExercisesView from '@/components/exercises/ExercisesView'

export const metadata: Metadata = { title: 'Exercises' }
export const dynamic = 'force-dynamic'

export default async function ExercisesPage() {
  const { workouts } = await getWeeklyProgram()
  return <ExercisesView workouts={workouts} />
}
