import { NextRequest, NextResponse } from 'next/server'

const locales = ['ko', 'en', 'ja', 'zh', 'hi']
const defaultLocale = 'ko'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 로케일 접두사가 이미 있으면 통과
  const hasLocale = locales.some(
    (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
  )
  if (hasLocale) return NextResponse.next()

  // 없으면 기본 로케일(ko)로 리다이렉트
  const url = request.nextUrl.clone()
  url.pathname = `/${defaultLocale}${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.).*)'],
}
