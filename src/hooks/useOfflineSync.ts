'use client'

import { useState, useEffect, useCallback } from 'react'

const QUEUE_KEY = 'fitcore_offline_queue'

interface QueuedOperation {
  id: string
  table: string
  operation: 'insert' | 'update' | 'upsert'
  payload: Record<string, unknown>
  timestamp: number
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [hasPending, setHasPending] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const getQueue = useCallback((): QueuedOperation[] => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
    } catch {
      return []
    }
  }, [])

  const enqueue = useCallback((op: Omit<QueuedOperation, 'id' | 'timestamp'>) => {
    const queue = getQueue()
    queue.push({ ...op, id: crypto.randomUUID(), timestamp: Date.now() })
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    setHasPending(true)
  }, [getQueue])

  const clearQueue = useCallback(() => {
    localStorage.removeItem(QUEUE_KEY)
    setHasPending(false)
  }, [])

  useEffect(() => {
    setHasPending(getQueue().length > 0)
  }, [getQueue])

  return { isOnline, hasPending, enqueue, getQueue, clearQueue }
}
