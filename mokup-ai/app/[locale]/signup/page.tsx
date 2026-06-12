'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import LangSwitcher from '@/components/LangSwitcher'

export default function SignupPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('signup')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) { setError(t('errorMatch')); return }
    if (password.length < 6) { setError(t('errorLength')); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/${locale}/dashboard` },
    })

    if (error) {
      setError(t('errorGeneral'))
      setLoading(false)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-4xl mb-4">✉️</div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#1a1a2e' }}>{t('doneTitle')}</h2>
            <p className="text-gray-500 text-sm">
              <strong>{email}</strong>{t('doneDesc')}
            </p>
            <Link href={`/${locale}/login`} className="inline-block mt-6 text-sm font-medium" style={{ color: '#4A90E2' }}>
              {t('goLogin')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="absolute top-4 right-4">
        <LangSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#1a1a2e' }}>{t('title')}</h1>
          <p className="text-gray-500 mt-2 text-sm">{t('subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#1a1a2e' }}>{t('heading')}</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')} required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')} required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirm')}</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder={t('confirmPlaceholder')} required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2" />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-white font-medium text-sm hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#1a1a2e' }}>
              {loading ? t('submitting') : t('submit')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('hasAccount')}{' '}
            <Link href={`/${locale}/login`} className="font-medium" style={{ color: '#4A90E2' }}>{t('login')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
