'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTimerReturn {
  remaining: number
  elapsed: number
  isRunning: boolean
  start: () => void
  pause: () => void
  reset: (newDuration?: number) => void
  skip: () => void
  adjust: (deltaSecs: number) => void
}

export function useTimer(initialSecs: number, onComplete?: () => void): UseTimerReturn {
  const [duration, setDuration] = useState(initialSecs)
  const [remaining, setRemaining] = useState(initialSecs)
  const [isRunning, setIsRunning] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const startRemainingRef = useRef(initialSecs)
  // Always-current remaining value — avoids stale closure in start()
  const remainingRef = useRef(initialSecs)
  const rafRef = useRef<number | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const tick = useCallback(() => {
    if (startTimeRef.current === null) return
    const elapsed = (Date.now() - startTimeRef.current) / 1000
    const newRemaining = Math.max(0, startRemainingRef.current - elapsed)
    remainingRef.current = newRemaining
    setRemaining(newRemaining)

    if (newRemaining <= 0) {
      setIsRunning(false)
      startTimeRef.current = null
      onCompleteRef.current?.()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  // `remaining` removed from deps — reads from remainingRef to avoid stale closures
  const start = useCallback(() => {
    if (isRunning) return
    startTimeRef.current = Date.now()
    startRemainingRef.current = remainingRef.current
    setIsRunning(true)
    rafRef.current = requestAnimationFrame(tick)
  }, [isRunning, tick])

  const pause = useCallback(() => {
    if (!isRunning) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsRunning(false)
    startTimeRef.current = null
  }, [isRunning])

  const reset = useCallback((newDuration?: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startTimeRef.current = null
    const d = newDuration ?? duration
    if (newDuration !== undefined) setDuration(newDuration)
    remainingRef.current = d  // sync ref immediately so start() sees the right value
    setRemaining(d)
    setIsRunning(false)
  }, [duration])

  const skip = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsRunning(false)
    startTimeRef.current = null
    remainingRef.current = 0
    setRemaining(0)
    onCompleteRef.current?.()
  }, [])

  const adjust = useCallback((deltaSecs: number) => {
    setRemaining(prev => {
      const next = Math.max(0, prev + deltaSecs)
      remainingRef.current = next
      if (isRunning && startTimeRef.current !== null) {
        startRemainingRef.current = next
        startTimeRef.current = Date.now()
      }
      return next
    })
  }, [isRunning])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return {
    remaining,
    elapsed: duration - remaining,
    isRunning,
    start,
    pause,
    reset,
    skip,
    adjust,
  }
}
