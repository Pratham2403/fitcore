import { ApiError, GoogleGenAI } from '@google/genai'
import type { LLMAdapter, LLMCallParams, LLMMessage, LLMResponse } from '../types'
import { LLMCallError } from '../types'

const toGeminiRole = (role: LLMMessage['role']): 'user' | 'model' => (role === 'assistant' ? 'model' : 'user')

/** Calls Gemini via the Google GenAI SDK. */
export class GeminiAdapter implements LLMAdapter {
  async complete(params: Omit<LLMCallParams, 'provider'>): Promise<LLMResponse> {
    try {
      const response = await new GoogleGenAI({}).models.generateContent({
        model: params.model,
        contents: params.messages.map((message) => ({
          role: toGeminiRole(message.role),
          parts: [{ text: message.content }],
        })),
        config: {
          systemInstruction: params.system,
          maxOutputTokens: params.maxTokens,
          temperature: params.temperature,
        },
      })

      return {
        text: response.text ?? '',
        usage: {
          inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        },
        model: response.modelVersion ?? params.model,
        provider: 'GEMINI',
        stopReason: response.candidates?.[0]?.finishReason ?? 'unknown',
      }
    } catch (error) {
      throw toLLMCallError(error)
    }
  }
}

function toLLMCallError(error: unknown): LLMCallError {
  if (error instanceof ApiError) {
    const retryable = error.status === 429 || error.status >= 500
    return new LLMCallError('GEMINI', retryable, error.message)
  }
  const message = error instanceof Error ? error.message : String(error)
  return new LLMCallError('GEMINI', true, message)
}
