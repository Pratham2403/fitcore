'use client'

import { getDayLabel } from '@/lib/utils'
import type { SessionDraft } from '@/types'

interface Props {
  draft: SessionDraft
  onContinue: () => void
  onDiscard: () => Promise<void>
}

const PHASE_LABELS: Record<string, string> = {
  warmup: 'Warmup',
  workout: 'Working sets',
  stretch: 'Cool-down stretch',
}

export default function ResumeSessionModal({ draft, onContinue, onDiscard }: Props) {
  const sessionAge = Math.round((Date.now() - draft.startTime) / 60000)
  const ageLabel = sessionAge < 60 ? `${sessionAge}m ago` : `${Math.round(sessionAge / 60)}h ago`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8"
      style={{ background: 'rgba(15,15,15,0.92)' }}>
      <div className="w-full max-w-sm rounded-3xl p-6 space-y-4"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>

        <div className="text-center">
          <p className="text-3xl mb-3">⚡</p>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Unfinished session
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {getDayLabel(draft.dayType)} · started {ageLabel}
          </p>
        </div>

        <div className="px-4 py-3 rounded-2xl space-y-1"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Left off at</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {PHASE_LABELS[draft.phase] ?? draft.phase}
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={onContinue}
            className="w-full py-3 rounded-2xl text-sm font-semibold"
            style={{ background: 'var(--accent-emerald)', color: '#fff' }}
          >
            Continue session →
          </button>
          <button
            onClick={onDiscard}
            className="w-full py-3 rounded-2xl text-sm font-medium"
            style={{ background: 'var(--bg-surface)', color: 'var(--destructive)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            Discard & start fresh
          </button>
        </div>
      </div>
    </div>
  )
}
