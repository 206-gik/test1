import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function VideoPage() {
  return <VideoPageContent />
}

function VideoPageContent() {
  // 서버 컴포넌트라 훅 사용 불가 - 하드코딩
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center text-center gap-6">
        <div className="text-6xl">🎬</div>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">영상 생성</h1>
          <p className="text-gray-500 mt-2">텍스트 또는 이미지로 짧은 영상을 생성합니다</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 w-full">
          <p className="text-amber-700 font-medium text-sm">🚧 출시 예정</p>
          <p className="text-amber-600 text-xs mt-1">
            fal.ai Kling / Wan 2.5 모델을 사용한 영상 생성 기능을 준비 중입니다.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full text-sm">
          {[
            { icon: '⚡', title: '5-15초', desc: '영상 길이' },
            { icon: '🎯', title: '720p~1080p', desc: '출력 해상도' },
            { icon: '🔑', title: 'Pro 전용', desc: '월 20회' },
          ].map(item => (
            <div key={item.title} className="bg-gray-50 rounded-xl p-3">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="font-semibold text-gray-700">{item.title}</div>
              <div className="text-xs text-gray-400">{item.desc}</div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400">
          업데이트 알림을 받으시려면 Pro 플랜으로 업그레이드하세요
        </p>
        <Link href="../pricing"
          className="px-6 py-2.5 rounded-xl text-white text-sm font-medium"
          style={{ backgroundColor: '#1a1a2e' }}>
          Pro 플랜 보기
        </Link>
      </div>
    </div>
  )
}
