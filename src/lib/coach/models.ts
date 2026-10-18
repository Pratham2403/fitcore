import type { LLMProviderName } from '@/lib/llm/types'
import type { CoachTier } from './rateLimit'

export type CoachStep = 'draft' | 'revise' | 'repair'

/** Model class recorded in ai_usage.model_tier for cost tracking. */
export type ModelClass = 'haiku' | 'sonnet'

export interface ModelRoute {
  provider: LLMProviderName
  model: string
  modelClass: ModelClass
}

/** Hard output cap for every coach call. */
export const COACH_MAX_TOKENS = 3000

const FAST_MODEL: ModelRoute = { provider: 'CLAUDE', model: 'claude-haiku-4-5-20251001', modelClass: 'haiku' }
const SYNTHESIS_MODEL: ModelRoute = { provider: 'CLAUDE', model: 'claude-sonnet-5', modelClass: 'sonnet' }

/**
 * The single model-routing table: paid plan synthesis gets the stronger model, everything else the fast one.
 * No temperature is sent: Claude Sonnet 5 rejects sampling parameters.
 */
export const COACH_MODEL_ROUTES: Record<CoachStep, Record<CoachTier, ModelRoute>> = {
  draft: { anonymous: FAST_MODEL, free: FAST_MODEL, paid: SYNTHESIS_MODEL },
  revise: { anonymous: FAST_MODEL, free: FAST_MODEL, paid: SYNTHESIS_MODEL },
  repair: { anonymous: FAST_MODEL, free: FAST_MODEL, paid: FAST_MODEL },
}
