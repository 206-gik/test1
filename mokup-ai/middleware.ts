import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API 경로는 패스스루
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // next-intl 로케일 처리
  const intlResponse = intlMiddleware(request)

  // 로케일 제거한 경로 추출 (예: /ko/dashboard → /dashboard)
  const localePattern = /^\/(ko|en|ja|zh|hi)/
  const pathWithoutLocale = pathname.replace(localePattern, '') || '/'

  // 인증 체크
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

  // 로그인 필요한 경로
  if (!user && pathWithoutLocale.startsWith('/dashboard')) {
    const locale = pathname.match(localePattern)?.[1] || 'ko'
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  // 이미 로그인 상태에서 login/signup 접근 시
  if (user && (pathWithoutLocale === '/login' || pathWithoutLocale === '/signup')) {
    const locale = pathname.match(localePattern)?.[1] || 'ko'
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
