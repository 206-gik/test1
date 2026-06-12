import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ko', 'en', 'ja', 'zh', 'hi'],
  defaultLocale: 'ko',
})
