import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWorkoutPlan } from '@/lib/program/actions'
import WorkoutBuilder from '@/components/builder/WorkoutBuilder'

export const metadata: Metadata = { title: 'Edit workout' }
export const dynamic = 'force-dynamic'

export default async function WorkoutBuilderPage({ params }: { params: { workoutId: string } }) {
  const plan = await getWorkoutPlan(params.workoutId)
  if (!plan) notFound()
  return <WorkoutBuilder plan={plan} />
}
