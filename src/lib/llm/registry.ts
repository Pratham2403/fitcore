import { AnthropicAdapter } from './adapters/anthropic.adapter'
import { GeminiAdapter } from './adapters/gemini.adapter'
import { GroqAdapter } from './adapters/groq.adapter'
import type { LLMAdapter, LLMCallParams, LLMProviderName, LLMResponse } from './types'
import { LLMCallError } from './types'

const registry: Record<LLMProviderName, LLMAdapter> = {
  CLAUDE: new AnthropicAdapter(),
  GEMINI: new GeminiAdapter(),
  GROQ: new GroqAdapter(),
}

export async function callLLM(params: LLMCallParams): Promise<LLMResponse> {
  const adapter = registry[params.provider]
  if (!adapter) throw new LLMCallError(params.provider, false, `Unsupported LLM provider: ${params.provider}`)
  return adapter.complete(params)
}

const PROVIDER_API_KEY_ENV: Record<LLMProviderName, string> = {
  CLAUDE: 'ANTHROPIC_API_KEY',
  GEMINI: 'GEMINI_API_KEY',
  GROQ: 'GROQ_API_KEY',
}

/** True when the provider's API key is set; adapters build their SDK client per call, so a missing key never breaks imports. */
export function isProviderConfigured(provider: LLMProviderName): boolean {
  return Boolean(process.env[PROVIDER_API_KEY_ENV[provider]])
}
