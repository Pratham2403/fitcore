export type LLMProviderName = 'CLAUDE' | 'GEMINI' | 'GROQ'

export interface LLMMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface LLMCallParams {
  provider: LLMProviderName
  model: string          // provider-specific model id, e.g. "claude-haiku-4-5"
  system?: string
  messages: LLMMessage[]
  maxTokens: number
  temperature?: number
}

export interface LLMResponse {
  text: string
  usage: { inputTokens: number; outputTokens: number }
  model: string
  provider: LLMProviderName
  stopReason: string
}

export class LLMCallError extends Error {
  constructor(public provider: LLMProviderName, public retryable: boolean, message: string) {
    super(message)
  }
}

export interface LLMAdapter {
  complete(params: Omit<LLMCallParams, 'provider'>): Promise<LLMResponse>
}
