'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { TOOLS } from '@/lib/tools'
import type { Plan } from '@/lib/plans'
import { canAccess } from '@/lib/plans'

interface Props {
  plan: Plan
}

export default function ToolsSidebar({ plan }: Props) {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('tools')

  return (
    <aside className="w-16 lg:w-52 shrink-0 bg-white border-r border-gray-100 flex flex-col py-4 gap-1 min-h-screen">
      {TOOLS.map(tool => {
        const href = `/${locale}${tool.route}`
        const isActive = pathname === href || pathname.startsWith(href + '/')
        const locked = !canAccess(plan, tool.id)
        const comingSoon = tool.status === 'coming_soon'

        return (
          <Link
            key={tool.id}
            href={locked || comingSoon ? '#' : href}
            className={`
              flex items-center gap-3 mx-2 px-2 lg:px-3 py-2.5 rounded-xl transition-all group
              ${isActive ? 'bg-[#1a1a2e] text-white' : 'text-gray-600 hover:bg-gray-50'}
              ${locked || comingSoon ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span className="text-xl shrink-0">{tool.icon}</span>
            <span className="hidden lg:block text-sm font-medium truncate">
              {t(tool.id)}
            </span>
            {comingSoon && (
              <span className="hidden lg:block ml-auto text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full shrink-0">
                {t('comingSoon')}
              </span>
            )}
            {locked && !comingSoon && (
              <span className="hidden lg:block ml-auto text-xs shrink-0">🔒</span>
            )}
          </Link>
        )
      })}
    </aside>
  )
}
