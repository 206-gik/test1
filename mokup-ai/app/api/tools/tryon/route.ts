import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, incrementToolUsage } from '@/lib/planUtils'
import { canAccess } from '@/lib/plans'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const { plan, tool_usage } = await getUserPlan(user.id)
    if (!canAccess(plan, 'tryon')) {
      return NextResponse.json({ error: 'Starter 플랜 이상에서 사용 가능합니다.', requireUpgrade: true }, { status: 403 })
    }

    const { personUrl, garmentUrl } = await req.json()
    if (!personUrl || !garmentUrl) {
      return NextResponse.json({ error: '인물 사진과 의류 사진이 모두 필요합니다.' }, { status: 400 })
    }

    const isPaid = plan === 'starter' || plan === 'pro'
    let resultUrl: string

    if (isPaid) {
      // fal.ai FASHN v1.5
      const { fal } = await import('@fal-ai/client')
      fal.config({ credentials: process.env.FAL_KEY })
      const result = await fal.subscribe('fal-ai/fashn/tryon/v1', {
        input: {
          model_image: personUrl,
          garment_image: garmentUrl,
          category: 'tops',
        },
      }) as unknown as { data: { images: Array<{ url: string }> } }
      resultUrl = result.data.images[0].url
    } else {
      // HuggingFace Kolors (무료, rate limited)
      const HF_TOKEN = process.env.HF_TOKEN
      const response = await fetch(
        'https://api-inference.huggingface.co/models/Kwai-Kolors/Kolors-Virtual-Try-On',
        {
          method: 'POST',
          headers: {
            'Authorization': HF_TOKEN ? `Bearer ${HF_TOKEN}` : '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: { person_image: personUrl, cloth_image: garmentUrl } }),
        }
      )
      if (!response.ok) {
        return NextResponse.json({ error: '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 })
      }
      const blob = await response.blob()
      resultUrl = `data:image/png;base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`
    }

    await incrementToolUsage(user.id, 'tryon')
    return NextResponse.json({ resultUrl })
  } catch (e) {
    console.error('tryon error:', e)
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
