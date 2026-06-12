export type Plan = 'free' | 'starter' | 'pro'
export type ToolId = 'mockup' | 'upscaler' | 'shadows' | 'tryon' | 'enhance' | 'video'

export interface PlanConfig {
  price_monthly: number   // KRW
  price_yearly: number    // KRW (per month)
  limits: Record<ToolId, number>  // -1 = 무제한, 0 = 접근 불가
}

export const PLAN_CONFIG: Record<Plan, PlanConfig> = {
  free: {
    price_monthly: 0,
    price_yearly: 0,
    limits: {
      mockup:   5,
      upscaler: 10,
      shadows:  20,
      tryon:    0,
      enhance:  10,
      video:    0,
    },
  },
  starter: {
    price_monthly: 9900,
    price_yearly: 7920,
    limits: {
      mockup:   100,
      upscaler: 50,
      shadows:  -1,
      tryon:    30,
      enhance:  50,
      video:    0,
    },
  },
  pro: {
    price_monthly: 19900,
    price_yearly: 15920,
    limits: {
      mockup:   500,
      upscaler: -1,
      shadows:  -1,
      tryon:    100,
      enhance:  -1,
      video:    20,
    },
  },
}

export function getLimit(plan: Plan, tool: ToolId): number {
  return PLAN_CONFIG[plan].limits[tool]
}

export function canAccess(plan: Plan, tool: ToolId): boolean {
  return PLAN_CONFIG[plan].limits[tool] !== 0
}

export function isUnlimited(plan: Plan, tool: ToolId): boolean {
  return PLAN_CONFIG[plan].limits[tool] === -1
}

// 새 플랜 추가 시 이 파일만 수정하면 됨
// 새 도구 추가 시 ToolId 타입 + PLAN_CONFIG limits에 항목 추가
