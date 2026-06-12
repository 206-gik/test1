'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function TryOnPage() {
  const t = useTranslations('tools')
  const tUpgrade = useTranslations('upgrade')
  const locale = useLocale()
  const [personUrl, setPersonUrl] = useState<string | null>(null)
  const [garmentUrl, setGarmentUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const personInputRef = useRef<HTMLInputElement>(null)
  const garmentInputRef = useRef<HTMLInputElement>(null)

  async function handleProcess() {
    if (!personUrl || !garmentUrl) return
    setProcessing(true); setError('')
    try {
      const res = await fetch('/api/tools/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personUrl, garmentUrl }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || t('errorGeneral')); return }
      setResultUrl(data.resultUrl)
    } catch {
      setError(t('errorGeneral'))
    } finally {
      setProcessing(false)
    }
  }

  function handleDownload() {
    if (!resultUrl) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = `tryon-${Date.now()}.png`
    a.click()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1a1a2e]">👗 {t('tryon')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('tryon_desc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 인물 사진 */}
        <UploadBox
          label={t('personLabel')}
          hint="전신 인물 사진"
          emoji="🧍"
          url={personUrl}
          onFile={f => setPersonUrl(URL.createObjectURL(f))}
          onClear={() => setPersonUrl(null)}
          inputRef={personInputRef}
        />

        {/* 의류 사진 */}
        <UploadBox
          label={t('garmentLabel')}
          hint="단독 의류 사진 (평면 OR 모델 착용)"
          emoji="👕"
          url={garmentUrl}
          onFile={f => setGarmentUrl(URL.createObjectURL(f))}
          onClear={() => setGarmentUrl(null)}
          inputRef={garmentInputRef}
        />

        {/* 결과 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">결과</p>
          <div className="min-h-[200px] flex items-center justify-center rounded-xl bg-gray-50">
            {processing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
                <p className="text-sm text-gray-500">{t('processing')}</p>
              </div>
            ) : resultUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resultUrl} alt="result" className="w-full rounded-xl object-contain max-h-64" />
            ) : (
              <p className="text-sm text-gray-300">결과 이미지</p>
            )}
          </div>
          {resultUrl && (
            <button onClick={handleDownload}
              className="w-full py-2.5 rounded-xl font-medium text-sm border border-gray-200 hover:bg-gray-50">
              {t('downloadBtn')} ⬇️
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

      <button onClick={handleProcess} disabled={!personUrl || !garmentUrl || processing}
        className="w-full py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50"
        style={{ backgroundColor: '#1a1a2e' }}>
        {processing ? t('processing') : t('processBtn')}
      </button>

      <p className="text-xs text-gray-400 text-center">
        무료: HuggingFace Kolors · 유료: fal.ai FASHN v1.5 · Starter 플랜 이상
      </p>
    </div>
  )
}

function UploadBox({ label, hint, emoji, url, onFile, onClear, inputRef }: {
  label: string; hint: string; emoji: string
  url: string | null
  onFile: (f: File) => void
  onClear: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {!url ? (
        <div onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all min-h-[160px]">
          <span className="text-4xl mb-2">{emoji}</span>
          <p className="text-xs text-gray-400 text-center">{hint}</p>
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
        </div>
      ) : (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="w-full rounded-xl object-contain max-h-48 bg-gray-50" />
          <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-600">다른 이미지</button>
        </div>
      )}
    </div>
  )
}
