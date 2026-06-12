import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // 토스페이먼츠 웹훅 이벤트 처리
  const { eventType, data } = body

  if (eventType !== 'PAYMENT_STATUS_CHANGED') {
    return NextResponse.json({ ok: true })
  }

  const { status, metadata } = data

  if (status !== 'DONE') {
    return NextResponse.json({ ok: true })
  }

  const { userId, planType } = metadata || {}

  if (!userId || !planType) {
    return NextResponse.json({ error: 'metadata 누락' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ plan: planType })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: 'DB 업데이트 실패' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
