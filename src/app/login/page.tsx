import LoginForm from '@/components/auth/LoginForm'
import { isAuthLinkError } from '@/lib/auth/links'

export default function LoginPage({ searchParams }: { searchParams: { error?: string | string[] } }) {
  return <LoginForm hasLinkError={isAuthLinkError(searchParams.error)} />
}
