import { profileInputSchema } from '@/lib/profile/schema'
import type { Sex } from '@/components/profile/trainingOptions'

/** Raw text of the basics step, kept as strings so inputs can be empty mid-edit. */
export interface BasicsForm {
  name: string
  age: string
  sex: Sex | null
  heightCm: string
  startingWeightKg: string
}

export type BasicsField = keyof BasicsForm
export type BasicsErrors = Partial<Record<BasicsField, string>>

const FIELD_ERRORS: Record<BasicsField, string> = {
  name: 'Enter your name.',
  age: 'Enter 13–100.',
  sex: 'Choose one.',
  heightCm: 'Enter 100–250 cm.',
  startingWeightKg: 'Enter 30–250 kg.',
}

const basicsSchema = profileInputSchema
  .pick({ name: true, age: true, sex: true, heightCm: true, startingWeightKg: true })
  .required()

function toOptionalNumber(text: string): number | undefined {
  return text.trim() === '' ? undefined : Number(text)
}

function isBasicsField(key: PropertyKey | undefined): key is BasicsField {
  return typeof key === 'string' && key in FIELD_ERRORS
}

/** Validates the basics step against the same rules the server enforces. */
export function validateBasics(form: BasicsForm) {
  const result = basicsSchema.safeParse({
    name: form.name,
    age: toOptionalNumber(form.age),
    sex: form.sex ?? undefined,
    heightCm: toOptionalNumber(form.heightCm),
    startingWeightKg: toOptionalNumber(form.startingWeightKg),
  })
  if (result.success) return { values: result.data, errors: {} }
  const errors: BasicsErrors = {}
  for (const issue of result.error.issues) {
    const [field] = issue.path
    if (isBasicsField(field)) errors[field] = FIELD_ERRORS[field]
  }
  return { values: null, errors }
}
