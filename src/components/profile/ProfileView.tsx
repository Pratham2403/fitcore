'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Entitlements, ProfileView as Profile } from '@/types'
import { getSupabaseClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { useToast } from '@/components/ui/Toast'
import { ConstraintsEditSheet, EquipmentEditSheet, ProfileEditSheet } from './EditSheets'
import ProWaitlistCard from './ProWaitlistCard'
import WeightLogger from './WeightLogger'
import WeightSparkline from './WeightSparkline'
import { CONSTRAINT_INFO, EQUIPMENT_OPTIONS, EXPERIENCE_SEGMENTS, MEDICAL_DISCLAIMER, goalLabel } from './trainingOptions'

type EditTarget = 'profile' | 'equipment' | 'constraints'

const LEGAL_LINKS = [
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/disclaimer', label: 'Health disclaimer' },
] as const

const PLAN_LABELS = { FREE: 'Free', MONTHLY: 'Pro (monthly)', ANNUAL: 'Pro (annual)' } as const

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  )
}

function Stat({ label, value, isHighlighted = false }: { label: string; value: string; isHighlighted?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] text-[var(--text-tertiary)]">{label}</dt>
      <dd className={`mt-0.5 font-mono text-sm font-semibold ${isHighlighted ? 'text-[var(--accent-emerald)]' : ''}`}>{value}</dd>
    </div>
  )
}

function formatDelta(delta: number): string {
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} kg`
}

/** Profile, body weight, training setup, plan and account actions. */
export default function ProfileView({ profile, entitlements }: { profile: Profile; entitlements: Entitlements }) {
  const router = useRouter()
  const showToast = useToast()
  const [editing, setEditing] = useState<EditTarget | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const currentWeight = profile.weightHistory.at(-1)?.weightKg ?? null
  const delta = currentWeight !== null && profile.startingWeightKg !== null ? currentWeight - profile.startingWeightKg : null
  const experienceLabel = EXPERIENCE_SEGMENTS.find(segment => segment.value === profile.experienceLevel)?.label
  const equipmentLabels = EQUIPMENT_OPTIONS.filter(option => profile.equipment.includes(option.value)).map(option => option.label)
  const closeEditor = () => setEditing(null)
  const editButton = (target: EditTarget) => (
    <Button variant="ghost" size="sm" onClick={() => setEditing(target)}>Edit</Button>
  )

  async function signOut() {
    setIsSigningOut(true)
    const { error } = await getSupabaseClient().auth.signOut()
    if (error) {
      setIsSigningOut(false)
      showToast('Couldn’t sign out. Please try again.', 'error')
      return
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pb-6 pt-6">
      <h1 className="text-xl font-semibold">{profile.name ?? 'Profile'}</h1>

      <Section title="Stats" action={editButton('profile')}>
        <dl className="grid grid-cols-3 gap-3">
          <Stat label="Age" value={profile.age !== null ? `${profile.age}` : '—'} />
          <Stat label="Height" value={profile.heightCm !== null ? `${profile.heightCm} cm` : '—'} />
          <Stat label="Start" value={profile.startingWeightKg !== null ? `${profile.startingWeightKg} kg` : '—'} />
          <Stat label="Current" value={currentWeight !== null ? `${currentWeight} kg` : '—'} isHighlighted />
          <Stat label="Change" value={delta !== null ? formatDelta(delta) : '—'} />
        </dl>
      </Section>

      <Section title="Body weight">
        <WeightLogger />
        {profile.weightHistory.length > 1 && <WeightSparkline weights={profile.weightHistory} />}
      </Section>

      <Section title="Training" action={editButton('profile')}>
        <p className="text-sm font-semibold">{goalLabel(profile.goal)}</p>
        <p className="text-xs text-[var(--text-secondary)]">
          {[
            experienceLabel,
            profile.trainingDaysPerWeek !== null && `${profile.trainingDaysPerWeek} days/week`,
            profile.sessionMinutes !== null && `${profile.sessionMinutes} min sessions`,
          ].filter(Boolean).join(' · ')}
        </p>
      </Section>

      <Section title="Equipment" action={editButton('equipment')}>
        {equipmentLabels.length > 0 ? (
          <div className="flex flex-wrap gap-2">{equipmentLabels.map(label => <Chip key={label}>{label}</Chip>)}</div>
        ) : <p className="text-sm text-[var(--text-secondary)]">None set.</p>}
      </Section>

      <Section title="Constraints" action={editButton('constraints')}>
        {profile.constraints.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {profile.constraints.map(constraint => (
              <li key={constraint.constraintType} className="text-sm">
                <span className="font-semibold">{CONSTRAINT_INFO[constraint.constraintType].label}</span>
                {constraint.detail && <span className="text-[var(--text-secondary)]"> — {constraint.detail}</span>}
                {constraint.romCapDegrees !== null && <span className="font-mono text-xs text-[var(--text-secondary)]"> · max {constraint.romCapDegrees}°</span>}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-[var(--text-secondary)]">Nothing to work around.</p>}
        <p className="text-xs text-[var(--text-tertiary)]">{MEDICAL_DISCLAIMER}</p>
      </Section>

      <Section title="Plan" action={<Chip tone={entitlements.isPaid ? 'accent' : 'neutral'}>{PLAN_LABELS[entitlements.plan]}</Chip>}>
        <dl className="grid grid-cols-2 gap-3">
          <Stat label="Workouts" value={entitlements.workoutLimit === null ? 'Unlimited' : `Up to ${entitlements.workoutLimit}`} />
          <Stat label="AI builds left" value={String(entitlements.aiBuildsRemaining)} />
        </dl>
      </Section>
      {!entitlements.isPaid && (
        <ProWaitlistCard
          title="FitCore Pro is coming"
          description="Unlimited workouts and more AI Coach builds each month. Join the waitlist to hear first."
          source="profile"
        />
      )}

      <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-4 text-sm text-[var(--text-tertiary)]">
        {LEGAL_LINKS.map(link => (
          <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center hover:text-[var(--text-primary)]">{link.label}</Link>
        ))}
      </nav>

      <Button variant="secondary" isFullWidth isLoading={isSigningOut} loadingLabel="Signing out…" onClick={signOut}>Sign out</Button>

      <ProfileEditSheet open={editing === 'profile'} onClose={closeEditor} profile={profile} />
      <EquipmentEditSheet open={editing === 'equipment'} onClose={closeEditor} profile={profile} />
      <ConstraintsEditSheet open={editing === 'constraints'} onClose={closeEditor} profile={profile} />
    </div>
  )
}
