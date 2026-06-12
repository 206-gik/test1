import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const intlResponse = intlMiddleware(request)

  const localePattern = /^\/(ko|en|ja|zh|hi)/
  const pathWithoutLocale = pathname.replace(localePattern, '') || '/'

  const supabaseResponse = intlResponse || NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && pathWithoutLocale.startsWith('/dashboard')) {
    const locale = pathname.match(localePattern)?.[1] || 'ko'
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  if (user && (pathWithoutLocale === '/login' || pathWithoutLocale === '/signup')) {
    const locale = pathname.match(localePattern)?.[1] || 'ko'
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
