'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface Props {
  message?: string
  onClose: () => void
}

export default function UpgradeModal({ message, onClose }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('upgrade')

  // 현재 경로에서 로케일 추출
  const locale = pathname.split('/')[1] || 'ko'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="text-center">
          <div className="text-4xl mb-3">🚀</div>
          <h3 className="text-lg font-bold mb-2" style={{ color: '#1a1a2e' }}>{t('title')}</h3>
          <p className="text-gray-500 text-sm mb-5">{message || t('defaultMsg')}</p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              {t('cancel')}
            </button>
            <button onClick={() => router.push(`/${locale}/pricing`)}
              className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90"
              style={{ backgroundColor: '#1a1a2e' }}>
              {t('viewPlans')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
