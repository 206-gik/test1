import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function PaymentFailPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'payment' })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-5xl mb-4">😥</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1a2e' }}>{t('failTitle')}</h2>
          <p className="text-gray-500 text-sm mb-6">{t('failDesc')}</p>
          <Link href={`/${locale}/pricing`}
            className="inline-block w-full py-3 rounded-xl text-white font-medium text-sm hover:opacity-90"
            style={{ backgroundColor: '#1a1a2e' }}>
            {t('retry')}
          </Link>
        </div>
      </div>
    </div>
  )
}
