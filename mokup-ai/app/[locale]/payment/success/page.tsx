import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ plan?: string }>
}

export default async function PaymentSuccessPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { plan } = await searchParams
  const t = await getTranslations({ locale, namespace: 'payment' })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  if (plan && (plan === 'starter' || plan === 'pro')) {
    await supabase.from('profiles').update({ plan }).eq('id', user.id)
  }

  const planLabel = plan === 'pro' ? t('pro') : t('starter')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1a2e' }}>{t('successTitle')}</h2>
          <p className="text-gray-500 text-sm mb-6">{planLabel} {t('successDesc')}</p>
          <Link href={`/${locale}/dashboard`}
            className="inline-block w-full py-3 rounded-xl text-white font-medium text-sm hover:opacity-90"
            style={{ backgroundColor: '#1a1a2e' }}>
            {t('goDashboard')}
          </Link>
        </div>
      </div>
    </div>
  )
}
