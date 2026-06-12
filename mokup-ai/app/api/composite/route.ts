import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === '여기에_API_키_입력') {
      return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }

    const { logoDataUrl, mockupUrl, templateType } = await req.json()
    if (!logoDataUrl || !mockupUrl) {
      return NextResponse.json({ error: '이미지 데이터가 없습니다.' }, { status: 400 })
    }

    // 로고 base64 추출
    const logoMime = logoDataUrl.split(';')[0].split(':')[1] || 'image/png'
    const logoBase64 = logoDataUrl.split(',')[1]

    // 목업 이미지 fetch → base64 변환
    const mockupRes = await fetch(mockupUrl)
    if (!mockupRes.ok) return NextResponse.json({ error: '목업 이미지를 불러올 수 없습니다.' }, { status: 500 })
    const mockupBuffer = await mockupRes.arrayBuffer()
    const mockupBase64 = Buffer.from(mockupBuffer).toString('base64')
    const mockupMime = mockupRes.headers.get('content-type') || 'image/jpeg'

    const productName: Record<string, string> = {
      product: '의류/굿즈',
      stationery: '문구/패키지',
      sns: 'SNS 게시물',
    }

    const prompt = `두 이미지를 자연스럽게 합성해주세요.

첫 번째 이미지: ${productName[templateType] ?? '제품'} 목업 사진
두 번째 이미지: 투명 배경이 제거된 로고 이미지

합성 요구사항:
- 로고를 제품 전면 중앙에 배치해주세요
- 실제로 인쇄되거나 자수된 것처럼 제품 질감에 자연스럽게 녹아들게 해주세요
- 제품의 조명, 굴곡, 그림자를 로고에 반영해서 입체감 있게 만들어주세요
- 로고의 원본 색상과 디자인을 최대한 그대로 유지해주세요
- 목업 제품 전체 이미지를 그대로 출력해주세요 (배경 포함)
- 합성 결과물은 상업적으로 사용 가능한 목업 품질이어야 합니다`

    const { GoogleGenAI, Modality } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mockupMime, data: mockupBase64 } },
          { inlineData: { mimeType: logoMime, data: logoBase64 } },
        ],
      }],
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    })

    let resultBase64: string | null = null
    const parts = response.candidates?.[0]?.content?.parts ?? []
    for (const part of parts) {
      if (part.inlineData?.data) {
        resultBase64 = part.inlineData.data
        break
      }
    }

    if (!resultBase64) {
      return NextResponse.json({ error: 'AI가 이미지를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 })
    }

    return NextResponse.json({ resultUrl: `data:image/png;base64,${resultBase64}` })
  } catch (e: unknown) {
    console.error('composite error:', e)
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      return NextResponse.json({ error: 'QUOTA_EXCEEDED' }, { status: 429 })
    }
    return NextResponse.json({ error: 'AI 합성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
