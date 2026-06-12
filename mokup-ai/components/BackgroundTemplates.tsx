'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { TEMPLATES, TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/templates'

// 하위 호환성을 위해 export 유지
export { TEMPLATES }

const CATEGORY_ICONS: Record<TemplateCategory, string> = {
  background: '🎨',
  product: '👕',
  stationery: '📇',
  sns: '📱',
}

interface Props {
  plan: string
  selected: string | null
  onSelect: (id: string) => void
  customBgUrl: string | null
  onCustomBgUpload: (url: string) => void
}

export default function BackgroundTemplates({ plan, selected, onSelect, customBgUrl, onCustomBgUpload }: Props) {
  const t = useTranslations('backgrounds')
  const tCat = useTranslations('templateCategories')
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('background')

  const isPaid = plan === 'starter' || plan === 'pro'
  const isPro = plan === 'pro'

  const filtered = TEMPLATES.filter(tmpl => tmpl.type === activeCategory)

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onCustomBgUpload(url)
    onSelect('custom')
  }

  function getPreviewContent(tmpl: typeof TEMPLATES[0]) {
    if (tmpl.type !== 'background' && tmpl.mockupUrl) {
      return (
        <Image
          src={tmpl.mockupUrl}
          alt={t(tmpl.labelKey as Parameters<typeof t>[0])}
          fill
          className="object-cover"
          unoptimized
        />
      )
    }
    if (tmpl.bgUrl) {
      return <Image src={tmpl.bgUrl} alt={t(tmpl.labelKey as Parameters<typeof t>[0])} fill className="object-cover" unoptimized />
    }
    if (tmpl.color) {
      return <div className="w-full h-full" style={{ background: tmpl.color }} />
    }
    return <div className="w-full h-full bg-gray-100" />
  }

  return (
    <div className="space-y-3">
      {/* 카테고리 탭 */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-[#1a1a2e] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{CATEGORY_ICONS[cat]}</span>
            <span>{tCat(cat)}</span>
          </button>
        ))}
      </div>

      {/* 카테고리 설명 */}
      {activeCategory !== 'background' && (
        <p className="text-xs text-gray-400">
          {activeCategory === 'product' && '로고가 제품 위에 합성됩니다'}
          {activeCategory === 'stationery' && '로고가 문구류/패키지에 적용됩니다'}
          {activeCategory === 'sns' && 'SNS 게시물 최적화 크기로 출력됩니다'}
        </p>
      )}

      {/* 커스텀 배경 업로드 (배경 카테고리 + 프로만) */}
      {activeCategory === 'background' && isPro && (
        <label className="flex items-center justify-center gap-2 text-xs font-medium cursor-pointer px-3 py-2 rounded-lg border border-dashed border-blue-400 text-blue-500 hover:bg-blue-50 w-full">
          + {t('customUpload')}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>
      )}

      {/* 템플릿 그리드 */}
      <div className="grid grid-cols-4 gap-1.5 max-h-60 overflow-y-auto pr-0.5">
        {/* 커스텀 배경 썸네일 */}
        {activeCategory === 'background' && customBgUrl && (
          <button
            onClick={() => onSelect('custom')}
            className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all ${
              selected === 'custom' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <Image src={customBgUrl} alt="커스텀" fill className="object-cover" />
            <span className="absolute bottom-0 left-0 right-0 text-[9px] text-white bg-black/60 text-center py-0.5 truncate px-0.5">
              {t('custom')}
            </span>
          </button>
        )}

        {filtered.map(tmpl => {
          const isLocked = !tmpl.free && !isPaid
          const label = t(tmpl.labelKey as Parameters<typeof t>[0])
          return (
            <button
              key={tmpl.id}
              onClick={() => !isLocked && onSelect(tmpl.id)}
              title={label}
              className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all ${
                selected === tmpl.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'
              } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {getPreviewContent(tmpl)}
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="text-white text-sm">🔒</span>
                </div>
              )}
              <span className="absolute bottom-0 left-0 right-0 text-[9px] text-white bg-black/50 text-center py-0.5 truncate px-0.5">
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
