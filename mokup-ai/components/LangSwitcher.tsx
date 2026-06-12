'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

const FLAGS: Record<string, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  ja: '🇯🇵',
  zh: '🇨🇳',
  hi: '🇮🇳',
}

export default function LangSwitcher() {
  const locale = useLocale()
  const t = useTranslations('lang')
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const locales = ['ko', 'en', 'ja', 'zh', 'hi'] as const

  function switchLocale(next: string) {
    // /ko/dashboard → /en/dashboard
    const segments = pathname.split('/')
    segments[1] = next
    router.push(segments.join('/'))
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
      >
        <span>{FLAGS[locale]}</span>
        <span className="hidden sm:inline">{t(locale as 'ko' | 'en' | 'ja' | 'zh' | 'hi')}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl border border-gray-100 shadow-lg z-20 py-1 overflow-hidden">
            {locales.map(loc => (
              <button
                key={loc}
                onClick={() => switchLocale(loc)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  loc === locale ? 'font-semibold text-blue-600 bg-blue-50' : 'text-gray-700'
                }`}
              >
                <span>{FLAGS[loc]}</span>
                <span>{t(loc)}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
