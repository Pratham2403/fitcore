import { CheckIcon } from '@/components/ui/Icon'

export const MIN_PASSWORD_LENGTH = 8

const PASSWORD_RULES = [
  { label: `At least ${MIN_PASSWORD_LENGTH} characters`, isMet: (password: string) => password.length >= MIN_PASSWORD_LENGTH },
  { label: 'Contains a letter', isMet: (password: string) => /[a-zA-Z]/.test(password) },
  { label: 'Contains a number', isMet: (password: string) => /\d/.test(password) },
] as const

export function isPasswordAcceptable(password: string): boolean {
  return PASSWORD_RULES.every(rule => rule.isMet(password))
}

/** Live checklist of the password rules shared by sign-up and password reset. */
export default function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="mt-1 space-y-1">
      {PASSWORD_RULES.map(rule => {
        const isMet = rule.isMet(password)
        return (
          <li key={rule.label} className={`flex items-center gap-1.5 ${isMet ? 'text-[var(--accent-emerald)]' : ''}`}>
            <CheckIcon size={14} className={isMet ? '' : 'opacity-30'} />
            {rule.label}
            <span className="sr-only">{isMet ? '(met)' : '(not met)'}</span>
          </li>
        )
      })}
    </ul>
  )
}
