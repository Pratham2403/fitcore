import type { Metadata } from 'next'
import { getWeeklyProgram } from '@/lib/program/actions'
import ProgramView from '@/components/program/ProgramView'

export const metadata: Metadata = { title: 'Program' }
export const dynamic = 'force-dynamic'

export default async function ProgramPage() {
  return <ProgramView program={await getWeeklyProgram()} />
}
