import type { ToolId, Plan } from './plans'
import { canAccess } from './plans'

export type ToolStatus = 'active' | 'coming_soon'

export interface ToolDef {
  id: ToolId
  icon: string
  route: string          // /[locale] 뒤의 경로
  status: ToolStatus
  minPlan: Plan          // 접근 가능한 최소 플랜
  engine: {
    free: string         // 무료 엔진 설명
    paid: string         // 유료 엔진 설명
  }
}

export const TOOLS: ToolDef[] = [
  {
    id: 'mockup',
    icon: '🖼️',
    route: '/dashboard',
    status: 'active',
    minPlan: 'free',
    engine: { free: '@imgly (브라우저)', paid: 'fal.ai BRIA 2.0' },
  },
  {
    id: 'upscaler',
    icon: '🔍',
    route: '/tools/upscaler',
    status: 'active',
    minPlan: 'free',
    engine: { free: 'UpscalerJS (브라우저)', paid: 'UpscalerJS (브라우저)' },
  },
  {
    id: 'shadows',
    icon: '🌑',
    route: '/tools/shadows',
    status: 'active',
    minPlan: 'free',
    engine: { free: 'Canvas API', paid: 'Canvas API' },
  },
  {
    id: 'tryon',
    icon: '👗',
    route: '/tools/tryon',
    status: 'active',
    minPlan: 'starter',
    engine: { free: 'HuggingFace Kolors', paid: 'fal.ai FASHN v1.5' },
  },
  {
    id: 'enhance',
    icon: '✨',
    route: '/tools/enhance',
    status: 'active',
    minPlan: 'free',
    engine: { free: 'UpscalerJS denoise', paid: 'UpscalerJS denoise' },
  },
  {
    id: 'video',
    icon: '🎬',
    route: '/tools/video',
    status: 'coming_soon',
    minPlan: 'pro',
    engine: { free: '-', paid: 'fal.ai Kling / Wan 2.5' },
  },
]

export function getTool(id: ToolId): ToolDef | undefined {
  return TOOLS.find(t => t.id === id)
}

export function getAccessibleTools(plan: Plan): ToolDef[] {
  return TOOLS.filter(t => canAccess(plan, t.id))
}

// 새 도구 추가 시 이 배열에 항목 하나만 추가하면 사이드바에 자동 반영됨
