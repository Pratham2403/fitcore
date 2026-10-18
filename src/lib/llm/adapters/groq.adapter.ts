import Groq from 'groq-sdk'
import type { LLMAdapter, LLMCallParams, LLMMessage, LLMResponse } from '../types'
import { LLMCallError } from '../types'

const toGroqMessage = (message: LLMMessage): Groq.Chat.ChatCompletionMessageParam => ({
  role: message.role,
  content: message.content,
})

/** Calls Groq's OpenAI-compatible chat completions API. */
export class GroqAdapter implements LLMAdapter {
  async complete(params: Omit<LLMCallParams, 'provider'>): Promise<LLMResponse> {
    try {
      const messages: Groq.Chat.ChatCompletionMessageParam[] = params.system
        ? [{ role: 'system', content: params.system }, ...params.messages.map(toGroqMessage)]
        : params.messages.map(toGroqMessage)

      const response = await new Groq().chat.completions.create({
        model: params.model,
        messages,
        max_completion_tokens: params.maxTokens,
        temperature: params.temperature,
      })

      const choice = response.choices[0]

      return {
        text: choice?.message.content ?? '',
        usage: {
          inputTokens: response.usage?.prompt_tokens ?? 0,
          outputTokens: response.usage?.completion_tokens ?? 0,
        },
        model: response.model,
        provider: 'GROQ',
        stopReason: choice?.finish_reason ?? 'unknown',
      }
    } catch (error) {
      throw toLLMCallError(error)
    }
  }
}

function toLLMCallError(error: unknown): LLMCallError {
  if (error instanceof Groq.RateLimitError) {
    return new LLMCallError('GROQ', true, error.message)
  }
  if (error instanceof Groq.InternalServerError) {
    return new LLMCallError('GROQ', true, error.message)
  }
  if (error instanceof Groq.APIConnectionError) {
    return new LLMCallError('GROQ', true, error.message)
  }
  if (error instanceof Groq.APIError) {
    return new LLMCallError('GROQ', false, error.message)
  }
  const message = error instanceof Error ? error.message : String(error)
  return new LLMCallError('GROQ', false, message)
}
