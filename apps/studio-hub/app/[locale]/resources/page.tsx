import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('resources');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function ResourcesPage() {
  const t = useTranslations('resources');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 mb-8">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links Grid */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('quickLinks.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('quickLinks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Documentation */}
            <Link href="/docs" className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="w-16 h-16 bg-blue-600 rounded-xl mb-6 flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('quickLinks.docs.title')}</h3>
              <p className="text-gray-600 mb-4">{t('quickLinks.docs.description')}</p>
              <span className="text-blue-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                {t('quickLinks.docs.cta')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            {/* API Reference */}
            <Link href="/api-reference" className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="w-16 h-16 bg-green-600 rounded-xl mb-6 flex items-center justify-center group-hover:bg-green-700 transition-colors">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('quickLinks.api.title')}</h3>
              <p className="text-gray-600 mb-4">{t('quickLinks.api.description')}</p>
              <span className="text-green-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                {t('quickLinks.api.cta')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            {/* Video Tutorials */}
            <Link href="/tutorials" className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="w-16 h-16 bg-purple-600 rounded-xl mb-6 flex items-center justify-center group-hover:bg-purple-700 transition-colors">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('quickLinks.videos.title')}</h3>
              <p className="text-gray-600 mb-4">{t('quickLinks.videos.description')}</p>
              <span className="text-purple-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                {t('quickLinks.videos.cta')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            {/* Community */}
            <Link href="/community" className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="w-16 h-16 bg-pink-600 rounded-xl mb-6 flex items-center justify-center group-hover:bg-pink-700 transition-colors">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('quickLinks.community.title')}</h3>
              <p className="text-gray-600 mb-4">{t('quickLinks.community.description')}</p>
              <span className="text-pink-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                {t('quickLinks.community.cta')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Getting Started Guide */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('gettingStarted.title')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('gettingStarted.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    1
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-4">{t('gettingStarted.step1.title')}</h3>
                  <p className="text-gray-700 mb-6">{t('gettingStarted.step1.description')}</p>
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400">
                    npm install -g @odavl-studio/cli
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border-2 border-purple-200">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    2
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-4">{t('gettingStarted.step2.title')}</h3>
                  <p className="text-gray-700 mb-6">{t('gettingStarted.step2.description')}</p>
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400">
                    odavl init<br/>
                    odavl insight analyze
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border-2 border-green-200">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    3
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-4">{t('gettingStarted.step3.title')}</h3>
                  <p className="text-gray-700 mb-6">{t('gettingStarted.step3.description')}</p>
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400">
                    odavl autopilot run<br/>
                    odavl guardian test
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Guides */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('guides.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Guide 1 */}
            <Link href="/guides/insight-setup" className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {t('guides.guide1.title')}
                  </h3>
                  <p className="text-gray-600 text-sm">{t('guides.guide1.description')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t('guides.guide1.duration')}</span>
                <span className="text-blue-600 font-semibold group-hover:gap-2 flex items-center gap-1">
                  {t('guides.readMore')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Guide 2 */}
            <Link href="/guides/autopilot-config" className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {t('guides.guide2.title')}
                  </h3>
                  <p className="text-gray-600 text-sm">{t('guides.guide2.description')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t('guides.guide2.duration')}</span>
                <span className="text-purple-600 font-semibold group-hover:gap-2 flex items-center gap-1">
                  {t('guides.readMore')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Guide 3 */}
            <Link href="/guides/guardian-ci-cd" className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                    {t('guides.guide3.title')}
                  </h3>
                  <p className="text-gray-600 text-sm">{t('guides.guide3.description')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t('guides.guide3.duration')}</span>
                <span className="text-green-600 font-semibold group-hover:gap-2 flex items-center gap-1">
                  {t('guides.readMore')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Guide 4 */}
            <Link href="/guides/multi-language" className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {t('guides.guide4.title')}
                  </h3>
                  <p className="text-gray-600 text-sm">{t('guides.guide4.description')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t('guides.guide4.duration')}</span>
                <span className="text-orange-600 font-semibold group-hover:gap-2 flex items-center gap-1">
                  {t('guides.readMore')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Guide 5 */}
            <Link href="/guides/vs-code-extension" className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {t('guides.guide5.title')}
                  </h3>
                  <p className="text-gray-600 text-sm">{t('guides.guide5.description')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t('guides.guide5.duration')}</span>
                <span className="text-indigo-600 font-semibold group-hover:gap-2 flex items-center gap-1">
                  {t('guides.readMore')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Guide 6 */}
            <Link href="/guides/custom-recipes" className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                    {t('guides.guide6.title')}
                  </h3>
                  <p className="text-gray-600 text-sm">{t('guides.guide6.description')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t('guides.guide6.duration')}</span>
                <span className="text-pink-600 font-semibold group-hover:gap-2 flex items-center gap-1">
                  {t('guides.readMore')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('support.title')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('support.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/support" className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200 hover:border-blue-400 transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {t('support.help.title')}
                    </h3>
                    <p className="text-gray-600">{t('support.help.description')}</p>
                  </div>
                </div>
              </Link>

              <Link href="/contact" className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border-2 border-green-200 hover:border-green-400 transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                      {t('support.contact.title')}
                    </h3>
                    <p className="text-gray-600">{t('support.contact.description')}</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t('finalCta.title')}
            </h2>
            <p className="text-xl text-purple-100 mb-10">
              {t('finalCta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-indigo-900 bg-white rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-xl"
              >
                {t('finalCta.cta')}
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
