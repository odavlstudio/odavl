import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('caseStudies');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function CaseStudiesPage() {
  const t = useTranslations('caseStudies');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Case Study 1: TechCorp */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-900">{t('case1.industry')}</span>
                </div>

                <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('case1.company')}</h2>
                <p className="text-xl text-gray-600 mb-6">{t('case1.tagline')}</p>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('case1.challenge.title')}</h3>
                  <p className="text-gray-700">{t('case1.challenge.description')}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('case1.solution.title')}</h3>
                  <p className="text-gray-700">{t('case1.solution.description')}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('case1.results.title')}</h3>
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-5xl font-bold text-blue-600 mb-2">73%</div>
                    <p className="text-gray-700 font-semibold">{t('case1.results.metric1')}</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-5xl font-bold text-green-600 mb-2">85%</div>
                    <p className="text-gray-700 font-semibold">{t('case1.results.metric2')}</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-5xl font-bold text-purple-600 mb-2">$2.4M</div>
                    <p className="text-gray-700 font-semibold">{t('case1.results.metric3')}</p>
                  </div>
                </div>
                <div className="mt-8 p-6 bg-white rounded-xl shadow-lg">
                  <p className="text-gray-600 italic mb-4">"{t('case1.quote')}"</p>
                  <p className="text-sm font-semibold text-gray-900">{t('case1.author')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study 2: FinanceHub */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('case2.results.title')}</h3>
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-5xl font-bold text-purple-600 mb-2">100%</div>
                    <p className="text-gray-700 font-semibold">{t('case2.results.metric1')}</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-5xl font-bold text-green-600 mb-2">91%</div>
                    <p className="text-gray-700 font-semibold">{t('case2.results.metric2')}</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-5xl font-bold text-blue-600 mb-2">60%</div>
                    <p className="text-gray-700 font-semibold">{t('case2.results.metric3')}</p>
                  </div>
                </div>
                <div className="mt-8 p-6 bg-white rounded-xl shadow-lg">
                  <p className="text-gray-600 italic mb-4">"{t('case2.quote')}"</p>
                  <p className="text-sm font-semibold text-gray-900">{t('case2.author')}</p>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-6">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-purple-900">{t('case2.industry')}</span>
                </div>

                <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('case2.company')}</h2>
                <p className="text-xl text-gray-600 mb-6">{t('case2.tagline')}</p>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('case2.challenge.title')}</h3>
                  <p className="text-gray-700">{t('case2.challenge.description')}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('case2.solution.title')}</h3>
                  <p className="text-gray-700">{t('case2.solution.description')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study 3: HealthTech */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full mb-6">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-green-900">{t('case3.industry')}</span>
                </div>

                <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('case3.company')}</h2>
                <p className="text-xl text-gray-600 mb-6">{t('case3.tagline')}</p>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('case3.challenge.title')}</h3>
                  <p className="text-gray-700">{t('case3.challenge.description')}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('case3.solution.title')}</h3>
                  <p className="text-gray-700">{t('case3.solution.description')}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('case3.results.title')}</h3>
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-5xl font-bold text-green-600 mb-2">AA</div>
                    <p className="text-gray-700 font-semibold">{t('case3.results.metric1')}</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-5xl font-bold text-blue-600 mb-2">98%</div>
                    <p className="text-gray-700 font-semibold">{t('case3.results.metric2')}</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-5xl font-bold text-purple-600 mb-2">Zero</div>
                    <p className="text-gray-700 font-semibold">{t('case3.results.metric3')}</p>
                  </div>
                </div>
                <div className="mt-8 p-6 bg-white rounded-xl shadow-lg">
                  <p className="text-gray-600 italic mb-4">"{t('case3.quote')}"</p>
                  <p className="text-sm font-semibold text-gray-900">{t('case3.author')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('stats.title')}</h2>
            <p className="text-xl text-purple-100">{t('stats.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">500+</div>
              <p className="text-lg text-purple-100">{t('stats.companies')}</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">10M+</div>
              <p className="text-lg text-purple-100">{t('stats.errors')}</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">$50M+</div>
              <p className="text-lg text-purple-100">{t('stats.saved')}</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">99.9%</div>
              <p className="text-lg text-purple-100">{t('stats.uptime')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t('finalCta.title')}
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              {t('finalCta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-xl"
              >
                {t('finalCta.primary')}
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
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
