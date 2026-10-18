import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/api/withAdmin'
import { apiError, readJsonBody, toValidationIssues } from '@/lib/api/http'
import { MAX_EXERCISES_PER_REQUEST, newExerciseBatchSchema } from '@/lib/catalog/newExercise'
import { appendExercises } from '@/lib/catalog/append'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 1_048_576

/** Appends a JSON array of exercises to the catalog (ADMIN only, all-or-nothing). */
export const POST = withAdmin(async (request, { supabase, userId }) => {
  const body = await readJsonBody(request, MAX_BODY_BYTES)
  if (body.kind === 'too_large') return apiError('PAYLOAD_TOO_LARGE', `Request body must be at most ${MAX_BODY_BYTES} bytes.`)
  if (body.kind === 'malformed') return apiError('VALIDATION', 'Request body must be valid JSON.')

  const parsed = newExerciseBatchSchema.safeParse(body.value)
  if (!parsed.success) {
    return apiError('VALIDATION', `Body must be an array of 1–${MAX_EXERCISES_PER_REQUEST} complete exercises. Nothing was saved.`, {
      issues: toValidationIssues(parsed.error),
    })
  }

  const result = await appendExercises(supabase, parsed.data)
  if (result.kind === 'conflict') {
    return apiError('CONFLICT', 'Some exercises are already in the catalog. Nothing was saved.', { conflicts: result.conflicts })
  }
  console.info(`[admin] ${userId} appended ${result.exercises.length} exercises: ${result.exercises.map(exercise => exercise.id).join(', ')}`)
  return NextResponse.json({ inserted: result.exercises.length, exercises: result.exercises }, { status: 201 })
})
