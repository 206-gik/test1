import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/planUtils'
import ToolsSidebar from '@/components/ToolsSidebar'
import LangSwitcher from '@/components/LangSwitcher'
import UsageBar from '@/components/UsageBar'
import Link from 'next/link'

export default async function ToolsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  const planData = await getUserPlan(user.id)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8fafc' }}>
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-full px-4 h-14 flex items-center justify-between">
          <Link href={`/${locale}/dashboard`} className="text-lg font-bold" style={{ color: '#1a1a2e' }}>
            목업AI
          </Link>
          <div className="flex items-center gap-3">
            <UsageBar plan={planData.plan} used={planData.monthly_usage} limit={planData.limit} />
            <LangSwitcher />
            <Link href={`/${locale}/pricing`} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 hidden sm:block">
              플랜 업그레이드
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <ToolsSidebar plan={planData.plan} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
