import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

const AUTH_ROUTES = ['/login', '/signup', '/welcome']
// /api requires a signed-in session; /v1/api serves Bearer-token callers and every route there must guard itself (withAdmin).
const PUBLIC_PREFIXES = ['/legal', '/coach', '/opengraph-image', '/api/health', '/v1/api']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getClaims refreshes an expired session and verifies the JWT signature locally (asymmetric signing keys).
  const { data } = await supabase.auth.getClaims()
  const isSignedIn = Boolean(data?.claims.sub)

  const { pathname } = request.nextUrl
  const isAuthRoute = AUTH_ROUTES.includes(pathname)
  const isPublicRoute = isAuthRoute || PUBLIC_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))

  if (!isSignedIn && !isPublicRoute) {
    return redirectTo(request, pathname === '/' ? '/welcome' : '/login')
  }

  if (isSignedIn && isAuthRoute) {
    return redirectTo(request, '/')
  }

  return supabaseResponse
}

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|_vercel|manifest.json|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$).*)'],
}
