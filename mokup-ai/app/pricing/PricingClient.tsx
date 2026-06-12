'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Plan } from '@/lib/planUtils'

interface Props {
  userId: string
  currentPlan: Plan
}

const PLANS = [
  {
    id: 'free' as Plan,
    name: '무료',
    price: 0,
    yearlyPrice: 0,
    features: [
      '월 5장',
      '720p 다운로드',
      '기본 배경 템플릿 8종',
      '워터마크 포함',
    ],
    cta: '현재 플랜',
    highlight: false,
  },
  {
    id: 'starter' as Plan,
    name: '스타터',
    price: 9900,
    yearlyPrice: 95000,
    features: [
      '월 100장',
      '원본 해상도 다운로드',
      '배경 템플릿 30종 전체',
      '워터마크 없음',
      '6가지 사이즈 프리셋',
    ],
    cta: '스타터 시작하기',
    highlight: false,
  },
  {
    id: 'pro' as Plan,
    name: '프로',
    price: 19900,
    yearlyPrice: 190000,
    features: [
      '월 500장',
      '원본 해상도 다운로드',
      '배경 템플릿 30종 전체',
      '워터마크 없음',
      'AI 이미지 생성 (FLUX.1)',
      '일괄 처리 최대 10장',
      '커스텀 배경 업로드',
    ],
    cta: '프로 시작하기',
    highlight: true,
  },
]

export default function PricingClient({ userId, currentPlan }: Props) {
  const [yearly, setYearly] = useState(false)
  const [loading, setLoading] = useState<Plan | null>(null)

  async function handleCheckout(plan: Plan) {
    if (plan === 'free' || plan === currentPlan) return
    setLoading(plan)

    // 토스페이먼츠 결제창 호출
    try {
      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk')

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      if (!clientKey) {
        alert('결제 설정이 완료되지 않았습니다. 관리자에게 문의하세요.')
        setLoading(null)
        return
      }

      const tossPayments = await loadTossPayments(clientKey)

      // 빌링키 발급 요청
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tossPayments as any).requestBillingAuth('카드', {
        customerKey: userId,
        successUrl: `${window.location.origin}/payment/success?plan=${plan}`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (e) {
      console.error(e)
      alert('결제 중 오류가 발생했습니다.')
    }

    setLoading(null)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold" style={{ color: '#1a1a2e' }}>목업AI</Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← 대시보드로</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3" style={{ color: '#1a1a2e' }}>플랜 선택</h1>
          <p className="text-gray-500">필요에 맞는 플랜을 선택하세요. 언제든지 변경 가능합니다.</p>

          {/* 월/연 토글 */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm ${!yearly ? 'font-medium text-gray-800' : 'text-gray-400'}`}>월간</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${yearly ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </button>
            <span className={`text-sm ${yearly ? 'font-medium text-gray-800' : 'text-gray-400'}`}>
              연간 <span className="text-green-500 text-xs font-semibold">20% 할인</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => {
            const isCurrent = plan.id === currentPlan
            const price = yearly ? plan.yearlyPrice : plan.price

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border p-6 relative ${
                  plan.highlight
                    ? 'border-blue-400 shadow-lg shadow-blue-100'
                    : 'border-gray-100'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    인기
                  </span>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-bold mb-1" style={{ color: '#1a1a2e' }}>{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold" style={{ color: '#1a1a2e' }}>
                      {price === 0 ? '무료' : `₩${price.toLocaleString()}`}
                    </span>
                    {price > 0 && (
                      <span className="text-gray-400 text-sm mb-1">/{yearly ? '년' : '월'}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={isCurrent || plan.id === 'free' || loading === plan.id}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-opacity ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : plan.highlight
                      ? 'text-white hover:opacity-90'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-60`}
                  style={plan.highlight && !isCurrent ? { backgroundColor: '#1a1a2e' } : {}}
                >
                  {isCurrent ? '현재 플랜' : loading === plan.id ? '처리 중...' : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          결제는 토스페이먼츠를 통해 안전하게 처리됩니다. 구독은 언제든지 취소 가능합니다.
        </p>
      </main>
    </div>
  )
}
