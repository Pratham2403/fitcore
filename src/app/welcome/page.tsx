import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import {
  AlertIcon, ArrowRightIcon, BodyIcon, CheckIcon, ChevronDownIcon, LogoIcon, ResumeIcon, SearchIcon, ShieldIcon,
  SparkIcon, SwapIcon, TrendIcon,
} from '@/components/ui/Icon'
import WaitlistForm from '@/components/ui/WaitlistForm'
import HeroFigure from '@/components/landing/HeroFigure'
import Reveal from '@/components/landing/Reveal'
import { submitLandingWaitlist } from './actions'

export const metadata: Metadata = {
  title: { absolute: 'FitCore — Build the physique you want without wrecking the joints you have' },
  description:
    'Constraint-aware strength training. Declare your knees, back and imbalances; get a plan that explains every substitution; log sets in two taps.',
}

const SECTION_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
] as const

const PROBLEMS = [
  {
    title: 'Your knee is sore after leg day',
    body: 'Most plans still hand you full-range leg extensions and deep lunges, because they don’t know your knee exists.',
  },
  {
    title: 'One side is weaker',
    body: 'Bilateral lifts let your strong side cover for the weak one. Nobody logs it, so the gap quietly grows.',
  },
  {
    title: 'Your lower back flares up',
    body: 'Generic apps give you two options: push through it or skip the day. Neither one builds muscle.',
  },
] as const

const STEPS = [
  {
    title: 'Declare your constraints',
    body: 'Patellar tendon, flat feet, left–right imbalance, lower back, shoulder impingement and more. Add your equipment and how long you have.',
  },
  {
    title: 'Get a plan that explains itself',
    body: 'Every substitution and range-of-motion cap comes with the reason behind it. You approve or reject each one.',
  },
  {
    title: 'Log in two taps',
    body: 'Last session’s numbers are prefilled. Tap to adjust, tap to log. The rest timer starts itself.',
  },
] as const

const FEATURES: readonly { icon: ReactNode; title: string; body: string; isWide?: boolean }[] = [
  {
    icon: <SwapIcon size={22} />,
    title: 'Constraint-aware substitutions',
    body: 'Rules map each constraint to safer alternatives or a range-of-motion cap, and warnings you can’t dismiss stay visible while you train.',
    isWide: true,
  },
  {
    icon: <BodyIcon size={22} />,
    title: 'Live 3-phase muscle map',
    body: 'Watch muscles prime in the warm-up, heat up while you work and cool down in the stretch.',
  },
  {
    icon: <TrendIcon size={22} />,
    title: 'PRs, plateaus & imbalances',
    body: 'Automatic PR detection, plateau alerts with a suggested next step, and left-vs-right tracking for unilateral work.',
  },
  {
    icon: <SearchIcon size={22} />,
    title: '870+ exercise catalog',
    body: 'Search forgives typos, and you can filter by muscle, equipment, level and mechanic. Every exercise includes instructions.',
  },
  {
    icon: <ResumeIcon size={22} />,
    title: 'Resume-anywhere sessions',
    body: 'Close the tab mid-set, lose signal in the basement gym. Your session picks up exactly where you left it.',
    isWide: true,
  },
]

const FREE_PLAN = ['Unlimited workout logging', 'Up to 7 saved workouts', '1 AI Coach plan build', 'PRs, plateaus & imbalance analytics'] as const
const PRO_PLAN = ['Everything in Free', 'Unlimited saved workouts', '4 AI Coach builds every month', '8 revision rounds per AI build'] as const

const FAQS = [
  {
    question: 'Is this physiotherapy or medical advice?',
    answer:
      'No. FitCore is a training tool. It adapts exercise selection and range of motion to constraints you declare, but it can’t diagnose or treat anything. If something hurts, see a physiotherapist or doctor.',
  },
  {
    question: 'Which constraints are supported?',
    answer:
      'Patellar tendon (knee), flat feet, left–right strength imbalance, pelvic floor, lower back, shoulder impingement, wrist pain and hypertension. More will be added as the rule set is reviewed.',
  },
  {
    question: 'Does the AI decide what I do?',
    answer:
      'No, you do. The AI Coach drafts a plan, and a deterministic rule pass then removes anything your constraints rule out. Every substitution shows its reasoning and waits for you to approve it.',
  },
  {
    question: 'Do I need a full gym?',
    answer:
      'No. Tell FitCore what equipment you have, whether that’s dumbbells at home or a commercial gym, and plans only use exercises you can actually do.',
  },
  {
    question: 'What happens to my data?',
    answer:
      'Your logs belong to you. Data is used only to run the app, never sold and never used for ads. You can ask for it to be deleted at any time. The privacy policy has the details.',
  },
  {
    question: 'Is there a mobile app?',
    answer:
      'FitCore is a web app built for your phone. Open it in your browser and use “Add to Home Screen” to get it full-screen like a native app.',
  },
] as const

const CURRENT_YEAR = new Date().getFullYear()

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-emerald)]">{eyebrow}</p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-balance text-base text-[var(--text-secondary)]">{description}</p>}
    </div>
  )
}

function SubstitutionPreview() {
  return (
    <div className="space-y-2 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-left">
      <div className="rounded-[var(--radius-md)] bg-[var(--bg-elevated)] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Leg Extension</p>
          <Chip tone="warning" icon={<AlertIcon size={12} />}>Knee</Chip>
        </div>
        <p className="mt-1 font-mono text-xs text-[var(--accent-orange)]">Stop at 90° — Knee Protocol</p>
      </div>
      <div className="rounded-[var(--radius-md)] bg-[var(--bg-elevated)] p-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-tertiary)] line-through">Walking Lunge</span>
          <ArrowRightIcon size={14} className="text-[var(--text-tertiary)]" />
          <span className="font-medium">Reverse Lunge</span>
        </div>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Why: stepping back keeps the shin more vertical, so the patellar tendon takes less load.
        </p>
      </div>
    </div>
  )
}

function LogPreview() {
  return (
    <div className="space-y-2 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
      {[{ set: 1, isLogged: true }, { set: 2, isLogged: false }].map(({ set, isLogged }) => (
        <div key={set} className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] px-3 py-2.5">
          <span className="w-10 text-xs text-[var(--text-tertiary)]">Set {set}</span>
          <span className="flex-1 font-mono text-sm">
            60<span className="text-[var(--text-tertiary)]"> kg × </span>10
          </span>
          <span
            className={`grid h-8 w-8 place-items-center rounded-lg ${
              isLogged ? 'bg-[var(--accent-emerald)] text-[var(--on-accent)]' : 'border border-[var(--border)] text-[var(--text-tertiary)]'
            }`}
          >
            <CheckIcon size={16} />
          </span>
        </div>
      ))}
    </div>
  )
}

const STEP_PREVIEWS: readonly ReactNode[] = [
  <div key="constraints" className="flex flex-wrap gap-2">
    {['Patellar tendon', 'Flat feet', 'Left side weaker', 'Pelvic floor'].map(label => (
      <Chip key={label} tone="accent" icon={<CheckIcon size={12} />}>{label}</Chip>
    ))}
    <Chip>Lower back</Chip>
    <Chip>Wrist</Chip>
  </div>,
  <SubstitutionPreview key="plan" />,
  <LogPreview key="log" />,
]

export default function WelcomePage() {
  return (
    <div className="min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-primary)_82%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <Link href="/welcome" className="flex items-center gap-2 rounded-lg font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[var(--accent-emerald)] text-[var(--on-accent)]">
              <LogoIcon size={18} strokeWidth={2.5} />
            </span>
            FitCore
          </Link>
          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {SECTION_LINKS.map(link => (
              <a key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/login" className={buttonClassName({ variant: 'ghost', size: 'sm' })}>Sign in</Link>
            <Link href="/signup" className={buttonClassName({ size: 'sm' })}>Start free</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.12),transparent)]"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 md:grid-cols-[1.15fr_1fr] md:px-6 md:pb-28 md:pt-20">
            <div>
              <Chip tone="accent" icon={<ShieldIcon size={12} />}>Constraint-aware strength training</Chip>
              <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Build the physique you want <span className="text-[var(--accent-emerald)]">without wrecking the joints you have.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)]">
                FitCore plans around your knees, back and imbalances, and tells you why every exercise was swapped. Logging a set then takes two taps.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className={buttonClassName({ size: 'lg' })}>
                  Start free
                  <ArrowRightIcon size={18} />
                </Link>
                <Link href="/coach" className={buttonClassName({ variant: 'secondary', size: 'lg' })}>
                  <SparkIcon size={18} className="text-[var(--accent-emerald)]" />
                  Try the AI Coach
                </Link>
              </div>
              <p className="mt-4 text-sm text-[var(--text-tertiary)]">Logging is free forever. No card needed.</p>
            </div>
            <Reveal delay={0.15}>
              <HeroFigure />
            </Reveal>
          </div>
        </section>

        <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Reveal>
              <SectionHeading
                eyebrow="The problem"
                title="Generic programs assume a generic body."
                description="Most people who lift have something to work around. Their training app usually doesn’t know about it."
              />
            </Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {PROBLEMS.map((problem, index) => (
                <Reveal key={problem.title} delay={index * 0.08}>
                  <article className="h-full rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-6">
                    <AlertIcon size={22} className="text-[var(--accent-orange)]" />
                    <h3 className="mt-4 text-base font-semibold">{problem.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{problem.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-16 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Reveal>
              <SectionHeading eyebrow="How it works" title="Three steps. The reasoning stays visible." />
            </Reveal>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <Reveal delay={index * 0.08} className="flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
                    <span className="font-mono text-sm text-[var(--accent-emerald)]">0{index + 1}</span>
                    <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{step.body}</p>
                    <div className="mt-6 flex-1 content-end">{STEP_PREVIEWS[index]}</div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="scroll-mt-16 border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Reveal>
              <SectionHeading eyebrow="Features" title="Built for people who train around something." />
            </Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={(index % 3) * 0.06} className={feature.isWide ? 'md:col-span-2' : ''}>
                  <article className="h-full rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-6">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--accent-emerald-line)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]">
                      {feature.icon}
                    </span>
                    <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">{feature.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-16 py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-4 md:px-6">
            <Reveal>
              <SectionHeading
                eyebrow="Pricing"
                title="Free to log. Pro when you want more plans."
                description="Logging and analytics stay free. Pro adds more saved workouts and more AI Coach builds."
              />
            </Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              <Reveal className="h-full">
                <article className="flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 md:p-8">
                  <h3 className="text-base font-semibold">Free</h3>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-semibold">₹0</span>
                    <span className="text-sm text-[var(--text-tertiary)]">forever</span>
                  </p>
                  <PlanFeatures items={FREE_PLAN} />
                  <Link href="/signup" className={`${buttonClassName({ variant: 'secondary', isFullWidth: true })} mt-8`}>
                    Start free
                  </Link>
                </article>
              </Reveal>
              <Reveal delay={0.08} className="h-full">
                <article className="relative flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--accent-emerald-line)] bg-[linear-gradient(180deg,rgba(16,185,129,0.08),var(--bg-surface)_40%)] p-6 md:p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">Pro</h3>
                    <Chip tone="accent">Coming soon</Chip>
                  </div>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-semibold">₹999</span>
                    <span className="text-sm text-[var(--text-tertiary)]">/ year</span>
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    About ₹83 a month, versus <span className="font-mono">₹149</span> billed monthly.
                  </p>
                  <PlanFeatures items={PRO_PLAN} />
                  <div className="mt-8">
                    <p className="mb-3 text-sm text-[var(--text-secondary)]">
                      You can’t buy Pro yet. Leave your email and we’ll send you one message when it opens.
                    </p>
                    <WaitlistForm onSubmit={submitLandingWaitlist} />
                  </div>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-16 border-t border-[var(--border-subtle)] py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <Reveal>
              <SectionHeading eyebrow="FAQ" title="Straight answers." />
            </Reveal>
            <div className="mt-10 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              {FAQS.map(faq => (
                <details key={faq.question} className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-medium [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronDownIcon size={18} className="shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="pb-5 pr-8 text-sm leading-relaxed text-[var(--text-secondary)]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <Reveal className="mx-auto max-w-4xl rounded-[28px] border border-[var(--accent-emerald-line)] bg-[radial-gradient(80%_120%_at_50%_0%,rgba(16,185,129,0.16),var(--bg-surface))] px-6 py-12 text-center md:py-16">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Train hard around what you’ve got.</h2>
            <p className="mx-auto mt-4 max-w-lg text-[var(--text-secondary)]">
              Set up your constraints in about two minutes. Your first plan is on us.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/signup" className={buttonClassName({ size: 'lg' })}>
                Start free
                <ArrowRightIcon size={18} />
              </Link>
              <Link href="/coach" className={buttonClassName({ variant: 'secondary', size: 'lg' })}>
                Try the AI Coach
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between md:px-6">
          <div className="max-w-md">
            <p className="flex items-center gap-2 font-semibold">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent-emerald)] text-[var(--on-accent)]">
                <LogoIcon size={16} strokeWidth={2.5} />
              </span>
              FitCore
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              <strong className="font-semibold text-[var(--text-primary)]">Not medical advice.</strong> FitCore offers training guidance only.
              For pain or injuries, see a physiotherapist or doctor.
            </p>
          </div>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/legal/terms" className="py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Terms</Link>
            <Link href="/legal/privacy" className="py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Privacy</Link>
            <Link href="/legal/disclaimer" className="py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Disclaimer</Link>
          </nav>
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-[var(--text-tertiary)] md:px-6">© {CURRENT_YEAR} FitCore</p>
      </footer>
    </div>
  )
}

function PlanFeatures({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-6 flex-1 space-y-3">
      {items.map(item => (
        <li key={item} className="flex items-start gap-3 text-sm">
          <CheckIcon size={18} className="mt-px shrink-0 text-[var(--accent-emerald)]" />
          {item}
        </li>
      ))}
    </ul>
  )
}
