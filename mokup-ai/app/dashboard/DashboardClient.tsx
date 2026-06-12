'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Plan } from '@/lib/planUtils'
import UsageBar from '@/components/UsageBar'
import BackgroundTemplates, { TEMPLATES } from '@/components/BackgroundTemplates'
import DownloadButton from '@/components/DownloadButton'
import UpgradeModal from '@/components/UpgradeModal'

interface Props {
  user: User
  planData: { plan: Plan; monthly_usage: number; limit: number }
}

type ActiveTab = 'remove' | 'generate'

const EXAMPLE_PROMPTS = [
  '흰색 머그컵에 꽃 패턴 디자인',
  '검정 후드티 미니멀 넥태그 디자인',
  '에코백 레트로 스타일',
]

export default function DashboardClient({ user, planData }: Props) {
  const router = useRouter()
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
  const [imglyReady, setImglyReady] = useState(false)
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [planInfo, setPlanInfo] = useState(planData)

  const isPaid = planInfo.plan === 'starter' || planInfo.plan === 'pro'
  const isPro = planInfo.plan === 'pro'

  // @imgly 무료 모델 사전 로드
  useEffect(() => {
    if (typeof window === 'undefined' || isPaid) return

    let mounted = true
    async function preload() {
      try {
        const { removeBackground } = await import('@imgly/background-removal')
        // 작은 더미 이미지로 모델 초기화
        const canvas = document.createElement('canvas')
        canvas.width = 1; canvas.height = 1
        canvas.toBlob(async blob => {
          if (!blob || !mounted) return
          try {
            await removeBackground(blob)
            if (mounted) setImglyReady(true)
          } catch {}
        })
      } catch {}
    }
    preload()
    return () => { mounted = false }
  }, [isPaid])

  // 배경 합성 canvas 렌더링
  const renderCanvas = useCallback(() => {
    if (!resultUrl || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = resultUrl
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      // 배경 그리기
      const template = TEMPLATES.find(t => t.id === selectedBg)
      if (selectedBg === 'custom' && customBgUrl) {
        const bgImg = new window.Image()
        bgImg.src = customBgUrl
        bgImg.onload = () => {
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
        }
      } else if (template?.bgUrl) {
        const bgImg = new window.Image()
        bgImg.crossOrigin = 'anonymous'
        bgImg.src = template.bgUrl
        bgImg.onload = () => {
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
        }
      } else if (template?.color) {
        const color = template.color
        if (color.startsWith('linear-gradient')) {
          // 그라디언트
          const match = color.match(/#[0-9a-f]{6}/gi) || []
          if (match.length >= 2) {
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
            grad.addColorStop(0, match[0]!)
            grad.addColorStop(1, match[1]!)
            ctx.fillStyle = grad
          } else {
            ctx.fillStyle = '#ffffff'
          }
        } else {
          ctx.fillStyle = color
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
    }
  }, [resultUrl, selectedBg, customBgUrl])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) loadFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  function loadFile(file: File) {
    setUploadedFile(file)
    setResultUrl(null)
    setError('')
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  async function handleRemoveBackground() {
    if (!uploadedFile) return
    if (planInfo.monthly_usage >= planInfo.limit) {
      setUpgradeMsg(`이번 달 사용량(${planInfo.limit}장)을 모두 사용했습니다.`)
      setShowUpgrade(true)
      return
    }

    setLoading(true)
    setError('')

    try {
      if (!isPaid) {
        // 무료: @imgly 브라우저 처리
        if (!imglyReady) {
          setLoadingMsg('AI 모델 로딩 중... (최초 1회)')
        } else {
          setLoadingMsg('배경 제거 중...')
        }

        const { removeBackground } = await import('@imgly/background-removal')
        setLoadingMsg('배경 제거 중...')

        const result = await removeBackground(uploadedFile, {
          output: { format: 'image/png', quality: 0.9 },
        })
        const url = URL.createObjectURL(result)
        setResultUrl(url)
        setPlanInfo(prev => ({ ...prev, monthly_usage: prev.monthly_usage + 1 }))
      } else {
        // 유료: fal.ai BRIA 2.0
        setLoadingMsg('고화질 AI로 배경 제거 중...')

        // Supabase Storage에 업로드 후 URL 전달
        const supabase = createClient()
        const fileName = `temp/${user.id}/${Date.now()}.${uploadedFile.name.split('.').pop()}`
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, uploadedFile, { upsert: true })

        if (uploadError) {
          // Storage 없을 경우 base64로 폴백
          const reader = new FileReader()
          const dataUrl = await new Promise<string>(resolve => {
            reader.onload = e => resolve(e.target?.result as string)
            reader.readAsDataURL(uploadedFile)
          })

          const res = await fetch('/api/remove-background', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: dataUrl }),
          })
          const data = await res.json()
          if (!res.ok) {
            if (data.limitExceeded) {
              setUpgradeMsg(data.error)
              setShowUpgrade(true)
            } else {
              setError(data.error || '오류가 발생했습니다.')
            }
            return
          }
          setResultUrl(data.resultUrl)
          setPlanInfo(prev => ({ ...prev, monthly_usage: prev.monthly_usage + 1 }))
        } else {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)
          const publicUrl = urlData.publicUrl
          const res = await fetch('/api/remove-background', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: publicUrl }),
          })
          const data = await res.json()
          if (!res.ok) {
            if (data.limitExceeded) {
              setUpgradeMsg(data.error)
              setShowUpgrade(true)
            } else {
              setError(data.error || '오류가 발생했습니다.')
            }
            return
          }
          setResultUrl(data.resultUrl)
          setPlanInfo(prev => ({ ...prev, monthly_usage: prev.monthly_usage + 1 }))
        }
      }
    } catch (err) {
      setError('배경 제거 중 오류가 발생했습니다. 다시 시도해주세요.')
      console.error(err)
    } finally {
      setLoading(false)
      setLoadingMsg('')
    }
  }

  async function handleGenerateImage() {
    if (!generatePrompt.trim()) return
    if (!isPro) {
      setUpgradeMsg('AI 이미지 생성은 프로 플랜 전용 기능입니다.')
      setShowUpgrade(true)
      return
    }

    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generatePrompt }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.requireUpgrade) {
          setUpgradeMsg(data.error)
          setShowUpgrade(true)
        } else {
          setError(data.error || '오류가 발생했습니다.')
        }
        return
      }
      setPreviewUrl(data.imageUrl)
      setResultUrl(null)
    } catch {
      setError('이미지 생성 중 오류가 발생했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8fafc' }}>
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold" style={{ color: '#1a1a2e' }}>목업AI</span>
          <div className="flex items-center gap-4">
            <UsageBar plan={planInfo.plan} used={planInfo.monthly_usage} limit={planInfo.limit} />
            <a href="/pricing" className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
              플랜 업그레이드
            </a>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* 탭 */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-100 w-fit">
          <button
            onClick={() => setTab('remove')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'remove' ? 'bg-[#1a1a2e] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            배경 제거
          </button>
          <button
            onClick={() => {
              if (!isPro) { setUpgradeMsg('AI 이미지 생성은 프로 플랜 전용 기능입니다.'); setShowUpgrade(true); return }
              setTab('generate')
            }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all relative ${
              tab === 'generate' ? 'bg-[#1a1a2e] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            AI 이미지 생성
            {!isPro && <span className="ml-1 text-xs">🔒</span>}
          </button>
        </div>

        {tab === 'remove' && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 왼쪽: 업로드 + 결과 */}
            <div className="flex-1 space-y-4">
              {/* 업로드 영역 */}
              {!previewUrl ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all min-h-[240px]"
                >
                  <div className="text-5xl mb-3">🖼️</div>
                  <p className="font-medium text-gray-700">이미지를 드래그하거나 클릭해서 업로드</p>
                  <p className="text-sm text-gray-400 mt-1">JPG, PNG, WEBP 지원</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              ) : (
                <div className="relative">
                  {/* 미리보기 + 결과 */}
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-2 gap-px bg-gray-100">
                      {/* 원본 */}
                      <div className="bg-white p-3">
                        <p className="text-xs text-gray-400 mb-2 font-medium">원본</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt="원본" className="w-full rounded-lg object-contain max-h-64" />
                      </div>
                      {/* 결과 */}
                      <div className="bg-white p-3">
                        <p className="text-xs text-gray-400 mb-2 font-medium">
                          결과 {loading && <span className="text-blue-500">(처리중...)</span>}
                        </p>
                        {loading ? (
                          <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
                            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3, animation: 'spin 1s linear infinite' }} />
                            <p className="text-sm text-gray-500">{loadingMsg || '처리 중...'}</p>
                          </div>
                        ) : resultUrl ? (
                          <div className="relative">
                            <canvas ref={canvasRef} className="w-full rounded-lg object-contain max-h-64 bg-checkered" />
                            {/* 무료 워터마크 표시 */}
                            {!isPaid && (
                              <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                                목업AI
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center min-h-[200px] text-gray-300 text-sm">
                            배경 제거 전
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl mt-3">{error}</p>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => { setPreviewUrl(null); setResultUrl(null); setUploadedFile(null) }}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      다른 이미지
                    </button>
                    <button
                      onClick={handleRemoveBackground}
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: '#4A90E2' }}
                    >
                      {loading ? '처리 중...' : '배경 제거하기'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 오른쪽: 배경 템플릿 + 다운로드 */}
            <div className="w-full lg:w-72 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <BackgroundTemplates
                  plan={planInfo.plan}
                  selected={selectedBg}
                  onSelect={setSelectedBg}
                  customBgUrl={customBgUrl}
                  onCustomBgUpload={setCustomBgUrl}
                />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <DownloadButton
                  canvasRef={canvasRef}
                  plan={planInfo.plan}
                  resultImageUrl={resultUrl}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'generate' && (
          <div className="max-w-xl">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold" style={{ color: '#1a1a2e' }}>AI 이미지 생성 (FLUX.1)</h2>
              <p className="text-sm text-gray-500">텍스트 설명으로 상품 배경 이미지를 만들어보세요.</p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">프롬프트</label>
                <textarea
                  value={generatePrompt}
                  onChange={e => setGeneratePrompt(e.target.value)}
                  placeholder="원하는 이미지를 한국어 또는 영어로 설명해주세요"
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium">예시 프롬프트</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => setGeneratePrompt(p)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <button
                onClick={handleGenerateImage}
                disabled={generating || !generatePrompt.trim()}
                className="w-full py-3 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#1a1a2e' }}
              >
                {generating ? '생성 중... (10~15초)' : '이미지 생성하기'}
              </button>

              {previewUrl && (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="생성된 이미지" className="w-full rounded-xl" />
                  <button
                    onClick={() => { setTab('remove'); }}
                    className="w-full py-2.5 rounded-xl border text-sm font-medium hover:bg-gray-50"
                    style={{ borderColor: '#4A90E2', color: '#4A90E2' }}
                  >
                    이 이미지로 배경 제거하기 →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showUpgrade && (
        <UpgradeModal message={upgradeMsg} onClose={() => setShowUpgrade(false)} />
      )}
    </div>
  )
}
