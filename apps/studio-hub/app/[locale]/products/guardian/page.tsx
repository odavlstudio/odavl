import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('products.guardian');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function GuardianProductPage() {
  const t = useTranslations('products.guardian');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-medium">{t('badge')}</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>

            <p className="text-xl md:text-2xl text-green-100 mb-10 leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-green-900 bg-white rounded-lg hover:bg-green-50 transition-all transform hover:scale-105 shadow-xl"
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

      {/* Testing Categories */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('categories.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('categories.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Accessibility */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg">
              <div className="w-16 h-16 bg-blue-600 rounded-xl mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('categories.accessibility.title')}</h3>
              <p className="text-gray-600 mb-6">{t('categories.accessibility.description')}</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('categories.accessibility.test1')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('categories.accessibility.test2')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('categories.accessibility.test3')}</span>
                </li>
              </ul>
            </div>

            {/* Performance */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-lg">
              <div className="w-16 h-16 bg-green-600 rounded-xl mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('categories.performance.title')}</h3>
              <p className="text-gray-600 mb-6">{t('categories.performance.description')}</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('categories.performance.test1')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('categories.performance.test2')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('categories.performance.test3')}</span>
                </li>
              </ul>
            </div>

            {/* Security */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-8 border-2 border-red-200 hover:border-red-400 transition-all hover:shadow-lg">
              <div className="w-16 h-16 bg-red-600 rounded-xl mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('categories.security.title')}</h3>
              <p className="text-gray-600 mb-6">{t('categories.security.description')}</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('categories.security.test1')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('categories.security.test2')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('categories.security.test3')}</span>
                </li>
              </ul>
            </div>

            {/* SEO */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-lg">
              <div className="w-16 h-16 bg-purple-600 rounded-xl mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('categories.seo.title')}</h3>
              <p className="text-gray-600 mb-6">{t('categories.seo.description')}</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('categories.seo.test1')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('categories.seo.test2')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('categories.seo.test3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WCAG Compliance */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  {t('wcag.title')}
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  {t('wcag.subtitle')}
                </p>
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">A</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{t('wcag.levelA.title')}</h4>
                        <p className="text-sm text-gray-600">{t('wcag.levelA.description')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">AA</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{t('wcag.levelAA.title')}</h4>
                        <p className="text-sm text-gray-600">{t('wcag.levelAA.description')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">AAA</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{t('wcag.levelAAA.title')}</h4>
                        <p className="text-sm text-gray-600">{t('wcag.levelAAA.description')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-xl">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Perceivable</span>
                      <span className="text-sm font-bold text-green-600">98%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-green-600 h-3 rounded-full" style={{width: '98%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Operable</span>
                      <span className="text-sm font-bold text-blue-600">96%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-600 h-3 rounded-full" style={{width: '96%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Understandable</span>
                      <span className="text-sm font-bold text-purple-600">94%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-purple-600 h-3 rounded-full" style={{width: '94%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Robust</span>
                      <span className="text-sm font-bold text-orange-600">97%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-orange-600 h-3 rounded-full" style={{width: '97%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Web Vitals */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('vitals.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('vitals.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* LCP */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('vitals.lcp.title')}</h3>
              <p className="text-4xl font-bold text-blue-600 mb-4">&lt; 2.5s</p>
              <p className="text-gray-600 text-sm">{t('vitals.lcp.description')}</p>
            </div>

            {/* FID */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('vitals.fid.title')}</h3>
              <p className="text-4xl font-bold text-green-600 mb-4">&lt; 100ms</p>
              <p className="text-gray-600 text-sm">{t('vitals.fid.description')}</p>
            </div>

            {/* CLS */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 text-center">
              <div className="w-20 h-20 bg-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v2m0 0h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h5m0 0V5a1 1 0 011-1h2a1 1 0 011 1v2m0 0h4a1 1 0 011 1v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h5" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('vitals.cls.title')}</h3>
              <p className="text-4xl font-bold text-purple-600 mb-4">&lt; 0.1</p>
              <p className="text-gray-600 text-sm">{t('vitals.cls.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t('finalCta.title')}
            </h2>
            <p className="text-xl text-green-100 mb-10">
              {t('finalCta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-green-900 bg-white rounded-lg hover:bg-green-50 transition-all transform hover:scale-105 shadow-xl"
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
