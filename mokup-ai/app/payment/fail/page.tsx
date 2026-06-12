import Link from 'next/link'

export default function PaymentFailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-5xl mb-4">😥</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1a2e' }}>결제가 취소되었습니다</h2>
          <p className="text-gray-500 text-sm mb-6">
            결제 중 오류가 발생했거나 취소되었습니다. 다시 시도해주세요.
          </p>
          <Link
            href="/pricing"
            className="inline-block w-full py-3 rounded-xl text-white font-medium text-sm hover:opacity-90"
            style={{ backgroundColor: '#1a1a2e' }}
          >
            다시 시도하기
          </Link>
        </div>
      </div>
    </div>
  )
}
