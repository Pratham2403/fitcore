import Anthropic from '@anthropic-ai/sdk'
import type { LLMAdapter, LLMCallParams, LLMResponse } from '../types'
import { LLMCallError } from '../types'

/** Calls Claude via the Anthropic Messages API. */
export class AnthropicAdapter implements LLMAdapter {
  async complete(params: Omit<LLMCallParams, 'provider'>): Promise<LLMResponse> {
    try {
      const response = await new Anthropic().messages.create({
        model: params.model,
        system: params.system,
        messages: params.messages,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
      })

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('')

      return {
        text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        model: response.model,
        provider: 'CLAUDE',
        stopReason: response.stop_reason ?? 'unknown',
      }
    } catch (error) {
      throw toLLMCallError(error)
    }
  }
}

function toLLMCallError(error: unknown): LLMCallError {
  if (error instanceof Anthropic.RateLimitError) {
    return new LLMCallError('CLAUDE', true, error.message)
  }
  if (error instanceof Anthropic.InternalServerError) {
    return new LLMCallError('CLAUDE', true, error.message)
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new LLMCallError('CLAUDE', true, error.message)
  }
  if (error instanceof Anthropic.APIError) {
    return new LLMCallError('CLAUDE', false, error.message)
  }
  const message = error instanceof Error ? error.message : String(error)
  return new LLMCallError('CLAUDE', false, message)
}
