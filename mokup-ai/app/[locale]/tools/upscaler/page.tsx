'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'

type Scale = 2 | 4

export default function UpscalerPage() {
  const t = useTranslations('tools')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [scale, setScale] = useState<Scale>(2)
  const [origSize, setOrigSize] = useState({ w: 0, h: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  function loadFile(f: File) {
    setFile(f)
    setResultUrl(null)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
    const img = new window.Image()
    img.onload = () => setOrigSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
  }

  async function handleProcess() {
    if (!file || !previewUrl) return
    setProcessing(true)
    try {
      const img = new window.Image()
      img.src = previewUrl
      await new Promise(r => { img.onload = r })

      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth * scale
      canvas.height = img.naturalHeight * scale
      const ctx = canvas.getContext('2d')!

      // 고품질 이중선형 보간 업스케일
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // 선명도 향상 (언샤프 마스킹 시뮬레이션)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      const sharpened = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const sd = sharpened.data

      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const i = (y * canvas.width + x) * 4
          for (let c = 0; c < 3; c++) {
            const val =
              5 * data[i + c] -
              data[i - 4 + c] -
              data[i + 4 + c] -
              data[i - canvas.width * 4 + c] -
              data[i + canvas.width * 4 + c]
            sd[i + c] = Math.min(255, Math.max(0, val))
          }
          sd[i + 3] = data[i + 3]
        }
      }
      ctx.putImageData(sharpened, 0, 0)

      canvas.toBlob(blob => {
        if (blob) setResultUrl(URL.createObjectURL(blob))
        setProcessing(false)
      }, 'image/png')
    } catch {
      setProcessing(false)
    }
  }

  function handleDownload() {
    if (!resultUrl) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = `upscaled-${scale}x-${Date.now()}.png`
    a.click()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1a1a2e]">🔍 {t('upscaler')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('upscaler_desc')}</p>
      </div>

      {/* 설정 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-6">
        <span className="text-sm font-medium text-gray-700">{t('scaleLabel')}</span>
        {([2, 4] as Scale[]).map(s => (
          <button key={s} onClick={() => setScale(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${scale === s ? 'bg-[#1a1a2e] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s}x
          </button>
        ))}
        {origSize.w > 0 && (
          <span className="text-xs text-gray-400 ml-auto">
            {origSize.w}×{origSize.h} → {origSize.w * scale}×{origSize.h * scale}px
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 업로드 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">{t('uploadLabel')}</p>
          {!previewUrl ? (
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all min-h-[200px]">
              <span className="text-4xl mb-2">🔍</span>
              <p className="text-sm text-gray-500">JPG, PNG, WEBP</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />
            </div>
          ) : (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="original" className="w-full rounded-xl object-contain max-h-64" />
              <button onClick={() => { setPreviewUrl(null); setFile(null); setResultUrl(null) }}
                className="text-xs text-gray-400 hover:text-gray-600">다른 이미지 선택</button>
            </div>
          )}
        </div>

        {/* 결과 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">{t('downloadBtn')}</p>
          <div className="min-h-[200px] flex items-center justify-center rounded-xl bg-gray-50">
            {processing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
                <p className="text-sm text-gray-500">{t('processing')}</p>
              </div>
            ) : resultUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resultUrl} alt="upscaled" className="w-full rounded-xl object-contain max-h-64" />
            ) : (
              <p className="text-sm text-gray-300">업스케일 결과가 여기에 표시됩니다</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleProcess} disabled={!file || processing}
          className="flex-1 py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50"
          style={{ backgroundColor: '#4A90E2' }}>
          {processing ? t('processing') : t('processBtn')}
        </button>
        {resultUrl && (
          <button onClick={handleDownload}
            className="px-6 py-3 rounded-xl font-medium text-sm border border-gray-200 hover:bg-gray-50">
            {t('downloadBtn')} ⬇️
          </button>
        )}
      </div>
    </div>
  )
}
