'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Plan } from '@/lib/planUtils'
import UsageBar from '@/components/UsageBar'
import BackgroundTemplates from '@/components/BackgroundTemplates'
import { TEMPLATES } from '@/lib/templates'
import DownloadButton from '@/components/DownloadButton'
import UpgradeModal from '@/components/UpgradeModal'
import LangSwitcher from '@/components/LangSwitcher'
import ToolsSidebar from '@/components/ToolsSidebar'

interface Props {
  user: User
  planData: { plan: Plan; monthly_usage: number; limit: number }
  locale: string
}

type ActiveTab = 'remove' | 'generate'

export default function DashboardClient({ user, planData, locale }: Props) {
  const router = useRouter()
  const t = useTranslations('dashboard')
  const tNav = useTranslations('nav')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<ActiveTab>('remove')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [selectedBg, setSelectedBg] = useState<string | null>('white')
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeMsg, setUpgradeMsg] = useState('')
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [planInfo, setPlanInfo] = useState(planData)
  const [aiCompositing, setAiCompositing] = useState(false)
  const [aiCompositeUrl, setAiCompositeUrl] = useState<string | null>(null)
  const aiTriggerKey = useRef<string | null>(null)

  const isPaid = planInfo.plan === 'starter' || planInfo.plan === 'pro'
  const isPro = planInfo.plan === 'pro'

  const examplePrompts = t.raw('examplePrompts') as string[]

  useEffect(() => {
    if (typeof window === 'undefined' || isPaid) return
    let mounted = true
    async function preload() {
      try {
        const { removeBackground } = await import('@imgly/background-removal')
        const canvas = document.createElement('canvas')
        canvas.width = 1; canvas.height = 1
        canvas.toBlob(async blob => {
          if (!blob || !mounted) return
          try { await removeBackground(blob); if (mounted) {} } catch {}
        })
      } catch {}
    }
    preload()
    return () => { mounted = false }
  }, [isPaid])

  function fillColorBg(ctx: CanvasRenderingContext2D, color: string, w: number, h: number) {
    if (color.startsWith('linear-gradient')) {
      const stops = color.match(/#[0-9a-f]{6}|rgba?\([^)]+\)/gi) || []
      const isVertical = color.includes('180deg')
      const grad = ctx.createLinearGradient(0, 0, isVertical ? 0 : w, isVertical ? h : 0)
      stops.forEach((c, i) => grad.addColorStop(i / Math.max(stops.length - 1, 1), c))
      ctx.fillStyle = stops.length >= 2 ? grad : '#ffffff'
    } else {
      ctx.fillStyle = color
    }
    ctx.fillRect(0, 0, w, h)
  }

  // 배경 위에 로고를 중앙 배치 — 자연스러운 그림자 추가
  function drawLogoWithShadow(ctx: CanvasRenderingContext2D, logo: HTMLImageElement, cw: number, ch: number) {
    const maxW = cw * 0.55
    const maxH = ch * 0.55
    const aspect = logo.naturalWidth / logo.naturalHeight
    let dw = maxW, dh = maxW / aspect
    if (dh > maxH) { dh = maxH; dw = maxH * aspect }
    const dx = (cw - dw) / 2
    const dy = (ch - dh) / 2

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.shadowColor = 'rgba(0,0,0,0.30)'
    ctx.shadowBlur = Math.round(ch * 0.028)
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = Math.round(ch * 0.018)
    ctx.drawImage(logo, dx, dy, dw, dh)
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }

  // 전문 목업 합성: 로고 먼저 배치 → 목업을 multiply/screen으로 위에 덮기
  // → 로고가 제품 표면에 실제 인쇄된 것처럼 보임
  function compositeOnMockup(
    ctx: CanvasRenderingContext2D,
    logo: HTMLImageElement,
    mockup: HTMLImageElement,
    cw: number, ch: number,
    px: number, py: number, pw: number, ph: number,
    blend: string
  ) {
    const aspect = logo.naturalWidth / logo.naturalHeight
    const placeAspect = pw / ph
    let dw = pw, dh = ph, dx = px, dy = py
    if (aspect > placeAspect) { dh = pw / aspect; dy = py + (ph - dh) / 2 }
    else { dw = ph * aspect; dx = px + (pw - dw) / 2 }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    if (blend === 'multiply') {
      // ① 흰 배경
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, cw, ch)
      // ② 로고를 배치 영역에 그리기
      ctx.drawImage(logo, dx, dy, dw, dh)
      // ③ 목업 이미지를 multiply로 위에 덮기 → 제품 질감·조명이 로고에 스며듦
      ctx.globalCompositeOperation = 'multiply'
      ctx.drawImage(mockup, 0, 0, cw, ch)
      ctx.globalCompositeOperation = 'source-over'
    } else if (blend === 'screen') {
      // ① 검정 배경
      ctx.fillStyle = '#111111'
      ctx.fillRect(0, 0, cw, ch)
      // ② 목업 먼저 (어두운 제품)
      ctx.drawImage(mockup, 0, 0, cw, ch)
      // ③ 로고를 screen으로 — 어두운 배경에서 로고가 빛남
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = 0.85
      ctx.drawImage(logo, dx, dy, dw, dh)
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
    } else {
      // SNS 프레임 — 일반 합성 + 그림자
      ctx.drawImage(mockup, 0, 0, cw, ch)
      ctx.shadowColor = 'rgba(0,0,0,0.25)'
      ctx.shadowBlur = 20
      ctx.shadowOffsetY = 8
      ctx.drawImage(logo, dx, dy, dw, dh)
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
    }
  }

  const renderCanvas = useCallback(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    // AI 합성 결과가 있으면 바로 렌더링
    if (aiCompositeUrl) {
      const img = new window.Image()
      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0)
      }
      img.src = aiCompositeUrl
      return
    }

    if (!resultUrl) return
    const logo = new window.Image()
    logo.crossOrigin = 'anonymous'
    logo.src = resultUrl
    logo.onload = () => {
      const template = TEMPLATES.find(t => t.id === selectedBg)

      if (!template || template.type === 'background') {
        // 배경 합성: canvas = 로고 원본 크기, 로고는 중앙에 그림자와 함께
        canvas.width = logo.naturalWidth
        canvas.height = logo.naturalHeight
        const cw = canvas.width, ch = canvas.height

        // 사진 배경: 살짝 blur + 주변 어둡게 → 로고 자연스럽게 부각
        const applyPhotoBg = (bgImg: HTMLImageElement) => {
          ctx.filter = 'blur(2px)'
          ctx.drawImage(bgImg, -4, -4, cw + 8, ch + 8)
          ctx.filter = 'none'
          // 중앙 밝고 가장자리 어두운 vignette
          const vignette = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.1, cw / 2, ch / 2, cw * 0.75)
          vignette.addColorStop(0, 'rgba(0,0,0,0.05)')
          vignette.addColorStop(1, 'rgba(0,0,0,0.45)')
          ctx.fillStyle = vignette
          ctx.fillRect(0, 0, cw, ch)
          drawLogoWithShadow(ctx, logo, cw, ch)
        }

        const finish = () => drawLogoWithShadow(ctx, logo, cw, ch)

        if (selectedBg === 'custom' && customBgUrl) {
          const bgImg = new window.Image()
          bgImg.src = customBgUrl
          bgImg.onload = () => applyPhotoBg(bgImg)
        } else if (template?.bgUrl) {
          const bgImg = new window.Image()
          bgImg.crossOrigin = 'anonymous'
          bgImg.src = template.bgUrl
          bgImg.onload = () => applyPhotoBg(bgImg)
        } else if (template?.color) {
          fillColorBg(ctx, template.color, cw, ch); finish()
        } else {
          ctx.clearRect(0, 0, cw, ch); finish()
        }
      } else {
        // 목업 합성: canvas = outputW x outputH, 블렌드 모드 사용
        const cw = template.outputW ?? 1000
        const ch = template.outputH ?? 1000
        canvas.width = cw; canvas.height = ch
        const p = template.placement ?? { x: 0.2, y: 0.2, w: 0.6, h: 0.6 }
        const px = p.x * cw, py = p.y * ch, pw = p.w * cw, ph = p.h * ch
        const blend = template.blend ?? 'multiply'

        if (template.mockupUrl) {
          const mockup = new window.Image()
          mockup.crossOrigin = 'anonymous'
          mockup.src = template.mockupUrl
          mockup.onload = () => {
            compositeOnMockup(ctx, logo, mockup, cw, ch, px, py, pw, ph, blend)
          }
        } else if (template.color) {
          fillColorBg(ctx, template.color, cw, ch)
          // 색상 배경 SNS 프레임: 그림자만 추가
          ctx.shadowColor = 'rgba(0,0,0,0.25)'
          ctx.shadowBlur = 20
          ctx.shadowOffsetY = 8
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          const aspect = logo.naturalWidth / logo.naturalHeight
          const placeAspect = pw / ph
          let dw = pw, dh = ph, dx = px, dy = py
          if (aspect > placeAspect) { dh = pw / aspect; dy = py + (ph - dh) / 2 }
          else { dw = ph * aspect; dx = px + (pw - dw) / 2 }
          ctx.drawImage(logo, dx, dy, dw, dh)
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetY = 0
        }
      }
    }
  }, [resultUrl, selectedBg, customBgUrl, aiCompositeUrl])

  useEffect(() => { renderCanvas() }, [renderCanvas])

  // 제품/문구 템플릿 선택 시 Gemini AI 자동 합성
  useEffect(() => {
    if (!resultUrl || !selectedBg) return
    const template = TEMPLATES.find(t => t.id === selectedBg)
    if (!template?.mockupUrl || (template.type !== 'product' && template.type !== 'stationery')) return

    const key = `${resultUrl}__${selectedBg}`
    if (aiTriggerKey.current === key) return   // 이미 이 조합으로 실행함
    aiTriggerKey.current = key
    setAiCompositeUrl(null)
    handleAiComposite()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultUrl, selectedBg])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) loadFile(file)
  }

  function loadFile(file: File) {
    setUploadedFile(file); setResultUrl(null); setError(''); setAiCompositeUrl(null)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleRemoveBackground() {
    if (!uploadedFile) return
    if (planInfo.monthly_usage >= planInfo.limit) {
      setUpgradeMsg(t('usageLimitMsg')); setShowUpgrade(true); return
    }
    setLoading(true); setError('')
    try {
      if (!isPaid) {
        setLoadingMsg(t('modelLoading'))
        const { removeBackground } = await import('@imgly/background-removal')
        setLoadingMsg(t('processingBg'))
        const result = await removeBackground(uploadedFile, { output: { format: 'image/png', quality: 0.9 } })
        setResultUrl(URL.createObjectURL(result)); setAiCompositeUrl(null)
        setPlanInfo(prev => ({ ...prev, monthly_usage: prev.monthly_usage + 1 }))
      } else {
        setLoadingMsg(t('processingHd'))
        const supabase = createClient()
        const fileName = `temp/${user.id}/${Date.now()}.${uploadedFile.name.split('.').pop()}`
        const { error: uploadError } = await supabase.storage.from('images').upload(fileName, uploadedFile, { upsert: true })

        let imageUrl: string
        if (uploadError) {
          const reader = new FileReader()
          imageUrl = await new Promise<string>(resolve => { reader.onload = e => resolve(e.target?.result as string); reader.readAsDataURL(uploadedFile) })
        } else {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)
          imageUrl = urlData.publicUrl
        }

        const res = await fetch('/api/remove-background', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (data.limitExceeded) { setUpgradeMsg(data.error); setShowUpgrade(true) }
          else { setError(data.error || t('errorGeneral')) }
          return
        }
        setResultUrl(data.resultUrl); setAiCompositeUrl(null)
        setPlanInfo(prev => ({ ...prev, monthly_usage: prev.monthly_usage + 1 }))
      }
    } catch { setError(t('errorGeneral')) }
    finally { setLoading(false); setLoadingMsg('') }
  }

  async function handleGenerateImage() {
    if (!generatePrompt.trim()) return
    if (!isPro) { setUpgradeMsg(t('upgradeForFeature')); setShowUpgrade(true); return }
    setGenerating(true); setError('')
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generatePrompt }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.requireUpgrade) { setUpgradeMsg(data.error); setShowUpgrade(true) }
        else { setError(data.error || t('errorGeneral')) }
        return
      }
      setPreviewUrl(data.imageUrl); setResultUrl(null)
    } catch { setError(t('errorGeneral')) }
    finally { setGenerating(false) }
  }

  async function handleAiComposite(force = false) {
    if (!resultUrl || !selectedBg) return
    const template = TEMPLATES.find(t => t.id === selectedBg)
    if (!template?.mockupUrl) return

    if (force) {
      const key = `${resultUrl}__${selectedBg}`
      aiTriggerKey.current = key
    }

    setAiCompositing(true); setError('')
    try {
      // blob URL → data URL 변환
      let logoDataUrl = resultUrl
      if (resultUrl.startsWith('blob:')) {
        const blob = await fetch(resultUrl).then(r => r.blob())
        logoDataUrl = await new Promise<string>(resolve => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target?.result as string)
          reader.readAsDataURL(blob)
        })
      }

      const res = await fetch('/api/composite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoDataUrl, mockupUrl: template.mockupUrl, templateType: template.type }),
      })
      const data = await res.json()
      if (!res.ok) {
        // 쿼터 초과 등 AI 오류 시: 오류 표시 없이 Canvas 합성 결과를 그대로 사용
        if (res.status === 429 || data.error === 'QUOTA_EXCEEDED') return
        setError(data.error || 'AI 합성 오류')
        return
      }
      setAiCompositeUrl(data.resultUrl)
    } catch { /* AI 실패 시 Canvas 폴백 사용 */ }
    finally { setAiCompositing(false) }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8fafc' }}>
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold" style={{ color: '#1a1a2e' }}>{tNav('logo')}</span>
          <div className="flex items-center gap-3">
            <UsageBar plan={planInfo.plan} used={planInfo.monthly_usage} limit={planInfo.limit} />
            <LangSwitcher />
            <a href={`/${locale}/pricing`} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 hidden sm:block">
              {tNav('upgrade')}
            </a>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">
              {tNav('logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <ToolsSidebar plan={planInfo.plan} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* 탭 */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-100 w-fit">
          <button onClick={() => setTab('remove')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'remove' ? 'bg-[#1a1a2e] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t('tabRemove')}
          </button>
          <button
            onClick={() => { if (!isPro) { setUpgradeMsg(t('upgradeForFeature')); setShowUpgrade(true); return } setTab('generate') }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'generate' ? 'bg-[#1a1a2e] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t('tabGenerate')}{!isPro && ' 🔒'}
          </button>
        </div>

        {tab === 'remove' && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              {!previewUrl ? (
                <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all min-h-[240px]">
                  <div className="text-5xl mb-3">🖼️</div>
                  <p className="font-medium text-gray-700 text-center">{t('uploadTitle')}</p>
                  <p className="text-sm text-gray-400 mt-1 text-center">{t('uploadDesc')}</p>
                  <p className="text-xs text-gray-300 mt-1">{t('uploadFormats')}</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />
                </div>
              ) : (
                <div>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-2 gap-px bg-gray-100">
                      <div className="bg-white p-3">
                        <p className="text-xs text-gray-400 mb-2 font-medium">{t('original')}</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt="original" className="w-full rounded-lg object-contain max-h-64" />
                      </div>
                      <div className="bg-white p-3">
                        <p className="text-xs text-gray-400 mb-2 font-medium">
                          {t('result')} {loading && <span className="text-blue-500">{t('processing')}</span>}
                        </p>
                        {loading ? (
                          <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
                            <div className="w-8 h-8 border-blue-500 border-t-transparent rounded-full" style={{ borderWidth: 3, animation: 'spin 1s linear infinite' }} />
                            <p className="text-sm text-gray-500">{loadingMsg}</p>
                          </div>
                        ) : resultUrl ? (
                          <div className="relative">
                            <canvas ref={canvasRef} className="w-full rounded-lg object-contain max-h-64 bg-checkered" />
                            {aiCompositing && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-lg gap-2">
                                <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-medium text-purple-600">AI 합성 중...</p>
                              </div>
                            )}
                            {!aiCompositing && aiCompositeUrl && (
                              <div className="absolute top-2 left-2 bg-purple-500/80 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">✨ AI</div>
                            )}
                            {!isPaid && <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">MokupAI</div>}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center min-h-[200px] text-gray-300 text-sm">{t('beforeRemove')}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl mt-3">{error}</p>}
                  {!isPaid && resultUrl && <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mt-2">{t('freePlan')}</p>}

                  <div className="flex gap-3 mt-4">
                    <button onClick={() => { setPreviewUrl(null); setResultUrl(null); setUploadedFile(null) }}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                      {t('uploadAnother')}
                    </button>
                    <button onClick={handleRemoveBackground} disabled={loading}
                      className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: '#4A90E2' }}>
                      {loading ? t('removing') : t('removeBtn')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full lg:w-72 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <BackgroundTemplates plan={planInfo.plan} selected={selectedBg} onSelect={setSelectedBg}
                  customBgUrl={customBgUrl} onCustomBgUpload={setCustomBgUrl} />
              </div>
              {/* AI 합성 상태 표시 */}
              {(() => {
                const tpl = TEMPLATES.find(t => t.id === selectedBg)
                if (!resultUrl || !tpl?.mockupUrl || (tpl.type !== 'product' && tpl.type !== 'stationery')) return null
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: aiCompositing ? '#a78bfa' : aiCompositeUrl ? '#22c55e' : '#d1d5db' }} />
                      <p className="text-xs font-semibold text-gray-700">
                        {aiCompositing ? 'AI 합성 중...' : aiCompositeUrl ? 'AI 합성 완료' : 'AI 합성 대기'}
                      </p>
                    </div>
                    <p className="text-[11px] text-gray-400">Gemini AI가 제품 질감·조명에 맞게 자동 합성합니다</p>
                    <button onClick={() => handleAiComposite(true)} disabled={aiCompositing}
                      className="w-full py-2 rounded-xl text-xs font-medium border border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-40">
                      {aiCompositing ? '처리 중...' : '↺ 다시 합성'}
                    </button>
                  </div>
                )
              })()}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <DownloadButton canvasRef={canvasRef} plan={planInfo.plan} resultImageUrl={resultUrl} />
              </div>
            </div>
          </div>
        )}

        {tab === 'generate' && (
          <div className="max-w-xl">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold" style={{ color: '#1a1a2e' }}>{t('generateTitle')}</h2>
              <p className="text-sm text-gray-500">{t('generateDesc')}</p>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t('promptLabel')}</label>
                <textarea value={generatePrompt} onChange={e => setGeneratePrompt(e.target.value)}
                  placeholder={t('promptPlaceholder')} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none" />
              </div>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((p: string) => (
                  <button key={p} onClick={() => setGeneratePrompt(p)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                    {p}
                  </button>
                ))}
              </div>
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button onClick={handleGenerateImage} disabled={generating || !generatePrompt.trim()}
                className="w-full py-3 rounded-xl text-white font-medium text-sm hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#1a1a2e' }}>
                {generating ? t('generating') : t('generateBtn')}
              </button>
              {previewUrl && (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="generated" className="w-full rounded-xl" />
                  <button onClick={() => setTab('remove')}
                    className="w-full py-2.5 rounded-xl border text-sm font-medium hover:bg-gray-50"
                    style={{ borderColor: '#4A90E2', color: '#4A90E2' }}>
                    {t('useAsBackground')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      </div>

      {showUpgrade && <UpgradeModal message={upgradeMsg} onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
