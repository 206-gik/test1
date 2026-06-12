'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Plan } from '@/lib/planUtils'
import LangSwitcher from '@/components/LangSwitcher'

interface Props {
  userId: string
  currentPlan: Plan
  locale: string
}

const PLAN_PRICES = {
  free: { monthly: 0, yearly: 0 },
  starter: { monthly: 9900, yearly: 95000 },
  pro: { monthly: 19900, yearly: 190000 },
}

export default function PricingClient({ userId, currentPlan, locale }: Props) {
  const t = useTranslations('pricing')
  const tNav = useTranslations('nav')
  const [yearly, setYearly] = useState(false)
  const [loading, setLoading] = useState<Plan | null>(null)

  const planIds: Plan[] = ['free', 'starter', 'pro']

  async function handleCheckout(plan: Plan) {
    if (plan === 'free' || plan === currentPlan) return
    setLoading(plan)
    try {
      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk')
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      if (!clientKey) { alert('결제 설정 오류'); setLoading(null); return }
      const tossPayments = await loadTossPayments(clientKey)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tossPayments as any).requestBillingAuth('카드', {
        customerKey: userId,
        successUrl: `${window.location.origin}/${locale}/payment/success?plan=${plan}`,
        failUrl: `${window.location.origin}/${locale}/payment/fail`,
      })
    } catch (e) { console.error(e); alert('결제 중 오류가 발생했습니다.') }
    finally { setLoading(null) }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/${locale}/dashboard`} className="text-lg font-bold" style={{ color: '#1a1a2e' }}>{tNav('logo')}</Link>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <Link href={`/${locale}/dashboard`} className="text-sm text-gray-500 hover:text-gray-700">{tNav('dashboard')}</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3" style={{ color: '#1a1a2e' }}>{t('title')}</h1>
          <p className="text-gray-500">{t('subtitle')}</p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm ${!yearly ? 'font-medium text-gray-800' : 'text-gray-400'}`}>{t('monthly')}</span>
            <button onClick={() => setYearly(!yearly)}
              className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${yearly ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm ${yearly ? 'font-medium text-gray-800' : 'text-gray-400'}`}>
              {t('yearly')} <span className="text-green-500 text-xs font-semibold">{t('discount')}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planIds.map(planId => {
            const isCurrent = planId === currentPlan
            const prices = PLAN_PRICES[planId]
            const price = yearly ? prices.yearly : prices.monthly
            const planName = t(`plans.${planId}.name`)
            const planCta = t(`plans.${planId}.cta`)
            const features = t.raw(`features.${planId}`) as string[]
            const isHighlight = planId === 'pro'

            return (
              <div key={planId} className={`bg-white rounded-2xl border p-6 relative ${isHighlight ? 'border-blue-400 shadow-lg shadow-blue-100' : 'border-gray-100'}`}>
                {isHighlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    {t('popular')}
                  </span>
                )}
                <div className="mb-5">
                  <h3 className="text-lg font-bold mb-1" style={{ color: '#1a1a2e' }}>{planName}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold" style={{ color: '#1a1a2e' }}>
                      {price === 0 ? t('free') : `₩${price.toLocaleString()}`}
                    </span>
                    {price > 0 && <span className="text-gray-400 text-sm mb-1">{yearly ? t('perYear') : t('perMonth')}</span>}
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {features.map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleCheckout(planId)}
                  disabled={isCurrent || planId === 'free' || loading === planId}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-opacity ${isCurrent ? 'bg-gray-100 text-gray-400 cursor-default' : isHighlight ? 'text-white hover:opacity-90' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'} disabled:opacity-60`}
                  style={isHighlight && !isCurrent ? { backgroundColor: '#1a1a2e' } : {}}>
                  {isCurrent ? t('currentPlan') : loading === planId ? t('processing') : planCta}
                </button>
              </div>
            )
          })}
        </div>
        <p className="text-center text-xs text-gray-400 mt-8">{t('footer')}</p>
      </main>
    </div>
  )
}
