'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toISODate } from '@/lib/utils'

const supabase = getSupabaseClient()

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{ name: string; age: number; height_cm: number; starting_weight_kg: number; goal: string } | null>(null)
  const [currentWeight, setCurrentWeight] = useState<number | null>(null)
  const [newWeight, setNewWeight] = useState('')
  const [weights, setWeights] = useState<{ date: string; weight_kg: number }[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: bm }, { data: wh }] = await Promise.all([
        supabase.from('user_profile').select('*').single(),
        supabase.from('body_metrics').select('weight_kg').order('date', { ascending: false }).limit(1).single(),
        supabase.from('body_metrics').select('date, weight_kg').order('date', { ascending: true }),
      ])
      if (p) setProfile(p)
      if (bm) setCurrentWeight(bm.weight_kg)
      if (wh) setWeights(wh)
    }
    load()
  }, [supabase])

  async function logWeight() {
    const w = parseFloat(newWeight)
    if (!w || w < 30 || w > 250) return
    setSaving(true)
    await supabase.from('body_metrics').upsert({ date: toISODate(), weight_kg: w })
    setCurrentWeight(w)
    setWeights(prev => {
      const filtered = prev.filter(x => x.date !== toISODate())
      return [...filtered, { date: toISODate(), weight_kg: w }].sort((a, b) => a.date.localeCompare(b.date))
    })
    setNewWeight('')
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const delta = profile && currentWeight ? currentWeight - profile.starting_weight_kg : null

  return (
    <div className="px-4 pt-5 pb-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Profile</h1>

      {/* Stats card */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>STATS</p>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Name" value={profile?.name ?? '—'} />
          <Stat label="Age" value={profile ? `${profile.age}y` : '—'} />
          <Stat label="Height" value={profile ? `${profile.height_cm} cm` : '—'} />
          <Stat label="Starting weight" value={profile ? `${profile.starting_weight_kg} kg` : '—'} />
          <Stat
            label="Current weight"
            value={currentWeight ? `${currentWeight} kg` : '—'}
            highlight
          />
          <Stat
            label="Change"
            value={delta !== null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} kg` : '—'}
          />
        </div>
      </div>

      {/* Morning weight check-in */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>MORNING WEIGHT</p>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="70.5"
            value={newWeight}
            onChange={e => setNewWeight(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={logWeight}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: saved ? 'var(--accent-green)' : 'var(--accent-emerald)', color: '#fff' }}
          >
            {saved ? '✓' : 'Log'}
          </button>
        </div>
      </div>

      {/* Weight chart — simple sparkline */}
      {weights.length > 1 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>WEIGHT TREND</p>
          <WeightSparkline weights={weights} />
        </div>
      )}

      {/* Goal */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>GOAL</p>
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{profile?.goal ?? 'Body Recomposition'}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>0.5–1 kg muscle/month · Mon–Sat 60 min · Vegetarian</p>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full py-3 rounded-2xl text-sm font-medium"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
      >
        Sign out
      </button>
    </div>
  )
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-sm font-semibold mt-0.5" style={{ color: highlight ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  )
}

function WeightSparkline({ weights }: { weights: { date: string; weight_kg: number }[] }) {
  const values = weights.map(w => w.weight_kg)
  const min = Math.min(...values) - 0.5
  const max = Math.max(...values) + 0.5
  const range = max - min || 1
  const W = 280, H = 60

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - ((v - min) / range) * H
    return `${x},${y}`
  }).join(' ')

  return (
    <div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="var(--accent-emerald)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Last point dot */}
        {values.length > 0 && (() => {
          const lx = W
          const ly = H - ((values[values.length - 1] - min) / range) * H
          return <circle cx={lx} cy={ly} r="3" fill="var(--accent-emerald)" />
        })()}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          {new Date(weights[0].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
        <span className="text-xs font-mono font-semibold" style={{ color: 'var(--accent-emerald)' }}>
          {values[values.length - 1]} kg
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          {new Date(weights[weights.length - 1].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  )
}
