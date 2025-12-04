import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('products.insight');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function InsightProductPage() {
  const t = useTranslations('products.insight');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm font-medium">{t('badge')}</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-900 bg-white rounded-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl"
              >
                {t('hero.cta')}
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="/demo"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg hover:bg-white/20 transition-all"
              >
                {t('hero.demo')}
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 80C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* 12 Detectors Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('detectors.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('detectors.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* TypeScript Detector */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xl">TS</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('detectors.typescript.title')}</h3>
                  <p className="text-sm text-gray-600">{t('detectors.typescript.description')}</p>
                </div>
              </div>
            </div>

            {/* ESLint Detector */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('detectors.eslint.title')}</h3>
                  <p className="text-sm text-gray-600">{t('detectors.eslint.description')}</p>
                </div>
              </div>
            </div>

            {/* Security Detector */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border-2 border-red-100 hover:border-red-300 transition-all hover:shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('detectors.security.title')}</h3>
                  <p className="text-sm text-gray-600">{t('detectors.security.description')}</p>
                </div>
              </div>
            </div>

            {/* Performance Detector */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('detectors.performance.title')}</h3>
                  <p className="text-sm text-gray-600">{t('detectors.performance.description')}</p>
                </div>
              </div>
            </div>

            {/* Import Detector */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border-2 border-yellow-100 hover:border-yellow-300 transition-all hover:shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('detectors.import.title')}</h3>
                  <p className="text-sm text-gray-600">{t('detectors.import.description')}</p>
                </div>
              </div>
            </div>

            {/* Package Detector */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border-2 border-indigo-100 hover:border-indigo-300 transition-all hover:shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('detectors.package.title')}</h3>
                  <p className="text-sm text-gray-600">{t('detectors.package.description')}</p>
                </div>
              </div>
            </div>

            {/* Runtime Detector */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border-2 border-pink-100 hover:border-pink-300 transition-all hover:shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('detectors.runtime.title')}</h3>
                  <p className="text-sm text-gray-600">{t('detectors.runtime.description')}</p>
                </div>
              </div>
            </div>

            {/* Build Detector */}
            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-6 border-2 border-cyan-100 hover:border-cyan-300 transition-all hover:shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('detectors.build.title')}</h3>
                  <p className="text-sm text-gray-600">{t('detectors.build.description')}</p>
                </div>
              </div>
            </div>

            {/* Circular Detector */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-100 hover:border-orange-300 transition-all hover:shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('detectors.circular.title')}</h3>
                  <p className="text-sm text-gray-600">{t('detectors.circular.description')}</p>
                </div>
              </div>
            </div>

            {/* Network Detector */}
            <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-xl p-6 border-2 border-lime-100 hover:border-lime-300 transition-all hover:shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-lime-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('detectors.network.title')}</h3>
                  <p className="text-sm text-gray-600">{t('detectors.network.description')}</p>
                </div>
              </div>
            </div>

            {/* Complexity Detector */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border-2 border-violet-100 hover:border-violet-300 transition-all hover:shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('detectors.complexity.title')}</h3>
                  <p className="text-sm text-gray-600">{t('detectors.complexity.description')}</p>
                </div>
              </div>
            </div>

            {/* Isolation Detector */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-6 border-2 border-slate-100 hover:border-slate-300 transition-all hover:shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('detectors.isolation.title')}</h3>
                  <p className="text-sm text-gray-600">{t('detectors.isolation.description')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Language Support */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('languages.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('languages.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* TypeScript */}
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-xl mx-auto mb-6 flex items-center justify-center">
                <span className="text-white font-bold text-3xl">TS</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('languages.typescript.title')}</h3>
              <p className="text-gray-600 mb-6">{t('languages.typescript.description')}</p>
              <ul className="text-left space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('languages.typescript.feature1')}</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('languages.typescript.feature2')}</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('languages.typescript.feature3')}</span>
                </li>
              </ul>
            </div>

            {/* Python */}
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="w-20 h-20 bg-yellow-500 rounded-xl mx-auto mb-6 flex items-center justify-center">
                <span className="text-white font-bold text-3xl">Py</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('languages.python.title')}</h3>
              <p className="text-gray-600 mb-6">{t('languages.python.description')}</p>
              <ul className="text-left space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('languages.python.feature1')}</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('languages.python.feature2')}</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('languages.python.feature3')}</span>
                </li>
              </ul>
            </div>

            {/* Java */}
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="w-20 h-20 bg-red-600 rounded-xl mx-auto mb-6 flex items-center justify-center">
                <span className="text-white font-bold text-3xl">J</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('languages.java.title')}</h3>
              <p className="text-gray-600 mb-6">{t('languages.java.description')}</p>
              <ul className="text-left space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('languages.java.feature1')}</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('languages.java.feature2')}</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('languages.java.feature3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* VS Code Integration */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  {t('vscode.title')}
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  {t('vscode.subtitle')}
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-900">{t('vscode.feature1.title')}</h4>
                      <p className="text-gray-600">{t('vscode.feature1.description')}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-900">{t('vscode.feature2.title')}</h4>
                      <p className="text-gray-600">{t('vscode.feature2.description')}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-900">{t('vscode.feature3.title')}</h4>
                      <p className="text-gray-600">{t('vscode.feature3.description')}</p>
                    </div>
                  </li>
                </ul>
                <div className="mt-8">
                  <a
                    href="https://marketplace.visualstudio.com/items?itemName=odavl.insight"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    {t('vscode.install')}
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="bg-gray-900 rounded-xl p-8 shadow-2xl">
                <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm text-green-400">
                  <div className="mb-2">$ code --install-extension odavl.insight</div>
                  <div className="text-gray-500">Installing extension 'odavl.insight'...</div>
                  <div className="text-gray-500">Extension 'odavl.insight' v2.0.0 was successfully installed.</div>
                  <div className="mt-4 text-blue-400">✓ 12 detectors activated</div>
                  <div className="text-blue-400">✓ Real-time analysis enabled</div>
                  <div className="text-blue-400">✓ VS Code integrated</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t('finalCta.title')}
            </h2>
            <p className="text-xl text-blue-100 mb-10">
              {t('finalCta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-900 bg-white rounded-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl"
              >
                {t('finalCta.primary')}
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg hover:bg-white/20 transition-all"
              >
                {t('finalCta.secondary')}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
