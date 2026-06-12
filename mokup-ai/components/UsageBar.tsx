'use client'

interface Props {
  plan: string
  used: number
  limit: number
}

const PLAN_LABELS: Record<string, string> = {
  free: '무료',
  starter: '스타터',
  pro: '프로',
}

export default function UsageBar({ plan, used, limit }: Props) {
  const pct = Math.min((used / limit) * 100, 100)
  const isWarning = pct >= 80

  return (
    <div className="flex items-center gap-3 text-sm">
      <span
        className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
        style={{ backgroundColor: plan === 'pro' ? '#4A90E2' : plan === 'starter' ? '#22c55e' : '#6b7280' }}
      >
        {PLAN_LABELS[plan] || plan}
      </span>
      <div className="flex items-center gap-1.5 text-gray-500">
        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: isWarning ? '#ef4444' : '#4A90E2',
            }}
          />
        </div>
        <span className={isWarning ? 'text-red-500' : ''}>
          {used}/{limit}장
        </span>
      </div>
    </div>
  )
}
