'use client'

import { useEffect, useState } from 'react'
import { FALLBACK_QUOTES } from '@/lib/workoutData'
import type { Quote } from '@/types'

const QUOTE_API = 'https://motivational-spark-api.vercel.app/api/quotes/random'
const STORAGE_KEY = 'fitcore_quote'

export default function QuoteCard() {
  const [quote, setQuote] = useState<Quote | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.date === today) {
          setQuote(parsed.quote)
          return
        }
      }
    } catch {}

    fetch(QUOTE_API)
      .then(r => r.json())
      .then(data => {
        const q: Quote = { text: data.quote ?? data.text ?? data.q, author: data.author ?? data.a ?? 'Unknown' }
        setQuote(q)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, quote: q }))
      })
      .catch(() => {
        const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
        setQuote(fallback)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, quote: fallback }))
      })
  }, [])

  if (!quote) return (
    <div className="rounded-2xl p-4 animate-pulse" style={{ background: 'var(--bg-surface)', minHeight: 72 }} />
  )

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>— {quote.author}</p>
    </div>
  )
}
