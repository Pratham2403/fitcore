/** Driver errors can embed the connection URL, so credentials are stripped before logging. */
export function redactCredentials(message: string): string {
  return message.replace(/\/\/[^\s]*@/g, '//[redacted]@')
}

/** A loggable description of a cache failure: the error code when present (never contains the URL), else the redacted message. */
export function describeCacheError(error: unknown): string {
  if (!(error instanceof Error)) return redactCredentials(String(error))
  const code = 'code' in error && typeof error.code === 'string' ? error.code : null
  return code ?? redactCredentials(error.message)
}
