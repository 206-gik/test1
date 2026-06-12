'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'

type ShadowType = 'bottom' | 'float' | 'soft'

export default function ShadowsPage() {
  const t = useTranslations('tools')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [shadowType, setShadowType] = useState<ShadowType>('bottom')
  const [opacity, setOpacity] = useState(60)
  const [blur, setBlur] = useState(20)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const render = useCallback((imgUrl: string, type: ShadowType, op: number, bl: number) => {
    const img = new window.Image()
    img.onload = () => {
      const W = img.naturalWidth
      const H = img.naturalHeight
      const pad = Math.round(H * 0.25)
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H + pad
      const ctx = canvas.getContext('2d')!

      // 흰 배경
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H + pad)

      const alpha = op / 100

      if (type === 'bottom') {
        // 바닥 그림자: 타원형
        const grd = ctx.createRadialGradient(W / 2, H + pad * 0.35, 0, W / 2, H + pad * 0.35, W * 0.45)
        grd.addColorStop(0, `rgba(0,0,0,${alpha})`)
        grd.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.save()
        ctx.scale(1, 0.3)
        ctx.beginPath()
        ctx.ellipse(W / 2, (H + pad * 0.35) / 0.3, W * 0.4, H * 0.15 / 0.3, 0, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.filter = `blur(${bl}px)`
        ctx.fill()
        ctx.restore()
      } else if (type === 'float') {
        // 부유 그림자: 이미지 아래 중심
        ctx.save()
        ctx.filter = `blur(${bl}px)`
        ctx.fillStyle = `rgba(0,0,0,${alpha})`
        ctx.beginPath()
        ctx.ellipse(W / 2, H + pad * 0.2, W * 0.35, pad * 0.15, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      } else {
        // 소프트 글로우: 이미지 뒤에 퍼지는 그림자
        ctx.save()
        ctx.filter = `blur(${bl * 2}px)`
        ctx.drawImage(img, bl, bl, W - bl * 2, H - bl * 2)
        ctx.restore()
        ctx.globalAlpha = alpha
        ctx.drawImage(img, bl * 0.5, bl * 0.5, W - bl, H - bl)
        ctx.globalAlpha = 1
      }

      // 원본 이미지 그리기
      ctx.drawImage(img, 0, 0, W, H)

      canvas.toBlob(blob => {
        if (blob) setResultUrl(URL.createObjectURL(blob))
      }, 'image/png')
    }
    img.src = imgUrl
  }, [])

  function loadFile(f: File) {
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
    render(url, shadowType, opacity, blur)
  }

  function updateShadow(type: ShadowType, op: number, bl: number) {
    setShadowType(type); setOpacity(op); setBlur(bl)
    if (previewUrl) render(previewUrl, type, op, bl)
  }

  function handleDownload() {
    if (!resultUrl) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = `shadow-${Date.now()}.png`
    a.click()
  }

  const shadowTypes: { key: ShadowType; label: string }[] = [
    { key: 'bottom', label: t('shadowBottom') },
    { key: 'float', label: t('shadowFloat') },
    { key: 'soft', label: t('shadowSoft') },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1a1a2e]">🌑 {t('shadows')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('shadows_desc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 컨트롤 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">{t('shadowType')}</p>
            {shadowTypes.map(s => (
              <button key={s.key} onClick={() => updateShadow(s.key, opacity, blur)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${shadowType === s.key ? 'bg-[#1a1a2e] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">{t('shadowOpacity')}</span>
              <span className="text-xs text-gray-400">{opacity}%</span>
            </div>
            <input type="range" min={10} max={90} value={opacity}
              onChange={e => updateShadow(shadowType, Number(e.target.value), blur)}
              className="w-full accent-[#1a1a2e]" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">{t('shadowBlur')}</span>
              <span className="text-xs text-gray-400">{blur}px</span>
            </div>
            <input type="range" min={5} max={60} value={blur}
              onChange={e => updateShadow(shadowType, opacity, Number(e.target.value))}
              className="w-full accent-[#1a1a2e]" />
          </div>
        </div>

        {/* 업로드 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">{t('uploadLabel')}</p>
          {!previewUrl ? (
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all min-h-[200px]">
              <span className="text-4xl mb-2">🌑</span>
              <p className="text-sm text-gray-500">투명 PNG 권장</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />
            </div>
          ) : (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="original" className="w-full rounded-xl object-contain max-h-48 bg-gray-50" />
              <button onClick={() => { setPreviewUrl(null); setResultUrl(null) }}
                className="text-xs text-gray-400 hover:text-gray-600">다른 이미지</button>
            </div>
          )}
        </div>

        {/* 결과 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">결과</p>
          <div className="min-h-[200px] flex items-center justify-center rounded-xl bg-gray-50">
            {resultUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resultUrl} alt="result" className="w-full rounded-xl object-contain max-h-48" />
            ) : (
              <p className="text-sm text-gray-300">그림자가 추가된 결과</p>
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

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
