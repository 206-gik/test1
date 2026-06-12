import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/planUtils'

fal.config({ credentials: process.env.FAL_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { prompt } = await req.json()
  if (!prompt) {
    return NextResponse.json({ error: '프롬프트를 입력해주세요.' }, { status: 400 })
  }

  const { plan } = await getUserPlan(user.id)
  if (plan !== 'pro') {
    return NextResponse.json({ error: '프로 플랜에서만 사용 가능한 기능입니다.', requireUpgrade: true }, { status: 403 })
  }

  try {
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt,
        image_size: 'square_hd',
        num_inference_steps: 28,
        num_images: 1,
      },
    }) as unknown as { data: { images: { url: string }[] } }

    return NextResponse.json({ imageUrl: result.data.images[0].url })
  } catch {
    return NextResponse.json({ error: '이미지 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
