import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, incrementUsage } from '@/lib/planUtils'

fal.config({ credentials: process.env.FAL_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { imageUrl } = await req.json()
  if (!imageUrl) {
    return NextResponse.json({ error: '이미지 URL이 필요합니다.' }, { status: 400 })
  }

  const { plan, monthly_usage, limit } = await getUserPlan(user.id)

  if (monthly_usage >= limit) {
    return NextResponse.json(
      { error: '이번 달 사용량을 초과했습니다. 플랜을 업그레이드해주세요.', limitExceeded: true },
      { status: 429 }
    )
  }

  try {
    const result = await fal.subscribe('fal-ai/bria/background/remove', {
      input: { image_url: imageUrl },
    }) as unknown as { data: { image: { url: string } } }

    await incrementUsage(user.id)

    return NextResponse.json({ resultUrl: result.data.image.url, plan })
  } catch {
    return NextResponse.json({ error: '배경 제거 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
