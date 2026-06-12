'use client'

import { useState } from 'react'
import UpgradeModal from './UpgradeModal'

const SIZE_PRESETS = [
  { id: 'insta_square', label: '인스타 정방형', w: 1080, h: 1080, free: true },
  { id: 'smartstore', label: '스마트스토어', w: 1000, h: 1000, free: true },
  { id: 'insta_portrait', label: '인스타 세로', w: 1080, h: 1350, free: false },
  { id: 'coupang', label: '쿠팡', w: 1000, h: 1000, free: false },
  { id: 'kakao', label: '카카오쇼핑', w: 1200, h: 1200, free: false },
  { id: 'original', label: '원본 크기', w: 0, h: 0, free: false },
]

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  plan: string
  resultImageUrl: string | null
}

export default function DownloadButton({ canvasRef, plan, resultImageUrl }: Props) {
  const [selectedSize, setSelectedSize] = useState('insta_square')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const isPaid = plan === 'starter' || plan === 'pro'

  function addWatermark(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save()
    ctx.globalAlpha = 0.4
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${Math.max(14, w * 0.02)}px sans-serif`
    ctx.textAlign = 'right'

    const text = '목업AI'
    const textW = ctx.measureText(text).width
    const padding = 10
    const boxW = textW + 16
    const boxH = 24
    const x = w - padding - boxW
    const y = h - padding - boxH

    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.beginPath()
    ctx.roundRect(x, y, boxW, boxH, 4)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.globalAlpha = 0.8
    ctx.textAlign = 'left'
    ctx.fillText(text, x + 8, y + 17)
    ctx.restore()
  }

  async function handleDownload() {
    if (!resultImageUrl) return

    const preset = SIZE_PRESETS.find(s => s.id === selectedSize)
    if (!preset) return

    if (!preset.free && !isPaid) {
      setShowUpgrade(true)
      return
    }

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = resultImageUrl

    await new Promise(resolve => { img.onload = resolve })

    let targetW = preset.w || img.naturalWidth
    let targetH = preset.h || img.naturalHeight

    // 무료: 720p로 다운스케일
    if (!isPaid) {
      const scale = Math.min(720 / targetW, 720 / targetH, 1)
      targetW = Math.round(targetW * scale)
      targetH = Math.round(targetH * scale)
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')!

    // 배경 합성 (캔버스 내용 복사)
    if (canvasRef.current) {
      ctx.drawImage(canvasRef.current, 0, 0, targetW, targetH)
    } else {
      ctx.drawImage(img, 0, 0, targetW, targetH)
    }

    // 무료: 워터마크 추가
    if (!isPaid) {
      addWatermark(ctx, targetW, targetH)
    }

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
    const filename = `mokup-ai-${date}-${rand}.png`

    canvas.toBlob(blob => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
    }, 'image/png')
  }

  return (
    <>
      {showUpgrade && (
        <UpgradeModal
          message="원본 해상도 다운로드는 스타터/프로 플랜에서 사용 가능합니다."
          onClose={() => setShowUpgrade(false)}
        />
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">다운로드 사이즈</h3>
        <div className="grid grid-cols-2 gap-2">
          {SIZE_PRESETS.map(preset => {
            const isLocked = !preset.free && !isPaid
            return (
              <button
                key={preset.id}
                onClick={() => {
                  if (isLocked) { setShowUpgrade(true); return }
                  setSelectedSize(preset.id)
                }}
                className={`px-3 py-2 rounded-lg text-sm border transition-all text-left ${
                  selectedSize === preset.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                } ${isLocked ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span>{preset.label}</span>
                  {isLocked && <span className="text-xs">🔒</span>}
                </div>
                {preset.w > 0 && (
                  <span className="text-xs text-gray-400">{preset.w}×{preset.h}px</span>
                )}
              </button>
            )
          })}
        </div>

        <button
          onClick={handleDownload}
          disabled={!resultImageUrl}
          className="w-full py-3 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: '#1a1a2e' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {isPaid ? '원본 다운로드' : '720p 다운로드 (무료)'}
        </button>
      </div>
    </>
  )
}
