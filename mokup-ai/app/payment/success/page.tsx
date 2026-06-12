import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ plan?: string; authKey?: string; customerKey?: string }>
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const params = await searchParams
  const { plan, authKey, customerKey } = params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 플랜 업데이트
  if (plan && (plan === 'starter' || plan === 'pro')) {
    await supabase
      .from('profiles')
      .update({ plan })
      .eq('id', user.id)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1a2e' }}>결제가 완료되었습니다!</h2>
          <p className="text-gray-500 text-sm mb-6">
            {plan === 'pro' ? '프로' : '스타터'} 플랜으로 업그레이드되었습니다.
          </p>
          <Link
            href="/dashboard"
            className="inline-block w-full py-3 rounded-xl text-white font-medium text-sm hover:opacity-90"
            style={{ backgroundColor: '#1a1a2e' }}
          >
            대시보드로 이동
          </Link>
        </div>
      </div>
    </div>
  )
}
