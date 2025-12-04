import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { CyclePhaseCard } from '@/components/products/CyclePhaseCard';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('products.autopilot');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function AutopilotProductPage() {
  const t = useTranslations('products.autopilot');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 via-pink-700 to-purple-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium">{t('badge')}</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>

            <p className="text-xl md:text-2xl text-purple-100 mb-10 leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-purple-900 bg-white rounded-lg hover:bg-purple-50 transition-all transform hover:scale-105 shadow-xl"
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

      {/* O-D-A-V-L Cycle */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('cycle.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('cycle.subtitle')}
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Observe */}
              <CyclePhaseCard
                phase="observe"
                letter="O"
                title={t('cycle.observe.title')}
                description={t('cycle.observe.description')}
                feature1={t('cycle.observe.feature1')}
                feature2={t('cycle.observe.feature2')}
                bgGradient="bg-gradient-to-br from-blue-50 to-indigo-50"
                borderColor="border-blue-200"
                hoverBorderColor="hover:border-blue-400"
                letterBg="bg-blue-600"
                iconColor="text-blue-600"
              />

              {/* Decide */}
              <CyclePhaseCard
                phase="decide"
                letter="D"
                title={t('cycle.decide.title')}
                description={t('cycle.decide.description')}
                feature1={t('cycle.decide.feature1')}
                feature2={t('cycle.decide.feature2')}
                bgGradient="bg-gradient-to-br from-purple-50 to-pink-50"
                borderColor="border-purple-200"
                hoverBorderColor="hover:border-purple-400"
                letterBg="bg-purple-600"
                iconColor="text-purple-600"
              />

              {/* Act */}
              <CyclePhaseCard
                phase="act"
                letter="A"
                title={t('cycle.act.title')}
                description={t('cycle.act.description')}
                feature1={t('cycle.act.feature1')}
                feature2={t('cycle.act.feature2')}
                bgGradient="bg-gradient-to-br from-green-50 to-emerald-50"
                borderColor="border-green-200"
                hoverBorderColor="hover:border-green-400"
                letterBg="bg-green-600"
                iconColor="text-green-600"
              />

              {/* Verify */}
              <CyclePhaseCard
                phase="verify"
                letter="V"
                title={t('cycle.verify.title')}
                description={t('cycle.verify.description')}
                feature1={t('cycle.verify.feature1')}
                feature2={t('cycle.verify.feature2')}
                bgGradient="bg-gradient-to-br from-orange-50 to-red-50"
                borderColor="border-orange-200"
                hoverBorderColor="hover:border-orange-400"
                letterBg="bg-orange-600"
                iconColor="text-orange-600"
              />

              {/* Learn */}
              <CyclePhaseCard
                phase="learn"
                letter="L"
                title={t('cycle.learn.title')}
                description={t('cycle.learn.description')}
                feature1={t('cycle.learn.feature1')}
                feature2={t('cycle.learn.feature2')}
                bgGradient="bg-gradient-to-br from-indigo-50 to-purple-50"
                borderColor="border-indigo-200"
                hoverBorderColor="hover:border-indigo-400"
                letterBg="bg-indigo-600"
                iconColor="text-indigo-600"
                showArrow={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Triple-Layer Safety */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('safety.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('safety.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Risk Budget */}
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-red-600 rounded-xl mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">{t('safety.layer1.title')}</h3>
              <p className="text-gray-600 mb-6 text-center">{t('safety.layer1.description')}</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('safety.layer1.feature1')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('safety.layer1.feature2')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('safety.layer1.feature3')}</span>
                </li>
              </ul>
            </div>

            {/* Undo Snapshots */}
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">{t('safety.layer2.title')}</h3>
              <p className="text-gray-600 mb-6 text-center">{t('safety.layer2.description')}</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('safety.layer2.feature1')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('safety.layer2.feature2')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('safety.layer2.feature3')}</span>
                </li>
              </ul>
            </div>

            {/* Attestation Chain */}
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-purple-600 rounded-xl mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">{t('safety.layer3.title')}</h3>
              <p className="text-gray-600 mb-6 text-center">{t('safety.layer3.description')}</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('safety.layer3.feature1')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('safety.layer3.feature2')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('safety.layer3.feature3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Scoring */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  {t('trust.title')}
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  {t('trust.subtitle')}
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-900">{t('trust.feature1.title')}</h4>
                      <p className="text-gray-600">{t('trust.feature1.description')}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-900">{t('trust.feature2.title')}</h4>
                      <p className="text-gray-600">{t('trust.feature2.description')}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-900">{t('trust.feature3.title')}</h4>
                      <p className="text-gray-600">{t('trust.feature3.description')}</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8">
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Recipe: fix-eslint-errors</span>
                      <span className="text-2xl font-bold text-green-600">0.92</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '92%'}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">145 successes / 158 runs</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Recipe: optimize-imports</span>
                      <span className="text-2xl font-bold text-blue-600">0.87</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '87%'}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">89 successes / 102 runs</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Recipe: remove-unused-code</span>
                      <span className="text-2xl font-bold text-purple-600">0.81</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '81%'}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">73 successes / 90 runs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-600 via-pink-700 to-purple-800 text-white">
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
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-purple-900 bg-white rounded-lg hover:bg-purple-50 transition-all transform hover:scale-105 shadow-xl"
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
