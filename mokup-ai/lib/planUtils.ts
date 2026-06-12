import { createClient } from './supabase/server'
import { PLAN_CONFIG, getLimit, canAccess, isUnlimited, type Plan, type ToolId } from './plans'

export type { Plan, ToolId }

// 하위 호환성 유지
export type Feature = 'background_remove' | 'hd_download' | 'text_to_image' | 'batch' | 'premium_templates' | 'custom_bg_upload'

export function getPlanLimits(plan: Plan): number {
  return PLAN_CONFIG[plan].limits.mockup
}

export function canUseFeature(plan: Plan, feature: Feature): boolean {
  const map: Record<Feature, ToolId> = {
    background_remove: 'mockup',
    hd_download: 'mockup',
    text_to_image: 'mockup',
    batch: 'mockup',
    premium_templates: 'mockup',
    custom_bg_upload: 'mockup',
  }
  // 기존 feature 게이팅은 mockup 도구 접근 여부 + 플랜 체크로 대체
  const planOrder: Plan[] = ['free', 'starter', 'pro']
  const featureMinPlan: Record<Feature, Plan> = {
    background_remove: 'free',
    hd_download: 'starter',
    text_to_image: 'pro',
    batch: 'pro',
    premium_templates: 'starter',
    custom_bg_upload: 'pro',
  }
  return planOrder.indexOf(plan) >= planOrder.indexOf(featureMinPlan[feature])
}

export async function getUserPlan(userId: string): Promise<{
  plan: Plan
  monthly_usage: number
  limit: number
  tool_usage: Partial<Record<ToolId, number>>
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('plan, monthly_usage, usage_reset_date, tool_usage')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return { plan: 'free', monthly_usage: 0, limit: 5, tool_usage: {} }
  }

  // 매월 1일 자동 초기화
  const resetDate = new Date(data.usage_reset_date)
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  if (resetDate < currentMonthStart) {
    await supabase
      .from('profiles')
      .update({
        monthly_usage: 0,
        tool_usage: {},
        usage_reset_date: currentMonthStart.toISOString().split('T')[0],
      })
      .eq('id', userId)
    data.monthly_usage = 0
    data.tool_usage = {}
  }

  const plan = data.plan as Plan
  return {
    plan,
    monthly_usage: data.monthly_usage,
    limit: PLAN_CONFIG[plan].limits.mockup,
    tool_usage: (data.tool_usage as Partial<Record<ToolId, number>>) ?? {},
  }
}

export async function getToolUsage(userId: string, tool: ToolId): Promise<number> {
  const { tool_usage } = await getUserPlan(userId)
  return tool_usage[tool] ?? 0
}

export async function canUseTool(userId: string, plan: Plan, tool: ToolId): Promise<boolean> {
  if (!canAccess(plan, tool)) return false
  if (isUnlimited(plan, tool)) return true
  const used = await getToolUsage(userId, tool)
  return used < getLimit(plan, tool)
}

export async function incrementToolUsage(userId: string, tool: ToolId): Promise<boolean> {
  const supabase = await createClient()
  const { plan, tool_usage } = await getUserPlan(userId)

  if (!canAccess(plan, tool)) return false
  const limit = getLimit(plan, tool)
  const used = tool_usage[tool] ?? 0
  if (limit !== -1 && used >= limit) return false

  const updated = { ...tool_usage, [tool]: used + 1 }

  await supabase
    .from('profiles')
    .update({
      tool_usage: updated,
      // mockup 도구는 기존 monthly_usage도 같이 증가 (하위 호환)
      ...(tool === 'mockup' ? { monthly_usage: (await getUserPlan(userId)).monthly_usage + 1 } : {}),
    })
    .eq('id', userId)

  await supabase.from('usage_logs').insert({
    user_id: userId,
    action: tool,
    engine: plan === 'free' ? 'free' : 'paid',
  })

  return true
}

// 하위 호환 - 기존 API에서 호출하던 함수
export async function incrementUsage(userId: string): Promise<boolean> {
  return incrementToolUsage(userId, 'mockup')
}
