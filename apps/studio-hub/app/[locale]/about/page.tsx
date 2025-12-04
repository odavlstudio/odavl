import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('about');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function AboutPage() {
  const t = useTranslations('about');

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

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  {t('mission.title')}
                </h2>
                <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                  {t('mission.description')}
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {t('mission.vision')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200">
                  <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                  <div className="text-gray-700 font-semibold">{t('mission.stats.companies')}</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200">
                  <div className="text-4xl font-bold text-purple-600 mb-2">10M+</div>
                  <div className="text-gray-700 font-semibold">{t('mission.stats.errors')}</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-200">
                  <div className="text-4xl font-bold text-green-600 mb-2">$50M+</div>
                  <div className="text-gray-700 font-semibold">{t('mission.stats.saved')}</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-pink-200">
                  <div className="text-4xl font-bold text-pink-600 mb-2">99.9%</div>
                  <div className="text-gray-700 font-semibold">{t('mission.stats.uptime')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('values.title')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('values.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {['innovation', 'quality', 'transparency', 'collaboration'].map((valueId) => (
                <div key={valueId} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl mb-6 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {t(`values.items.${valueId}.title`)}
                  </h3>
                  <p className="text-gray-600">
                    {t(`values.items.${valueId}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('careers.title')}
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              {t('careers.subtitle')}
            </p>
            <a
              href="/careers"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-indigo-900 bg-white rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-xl"
            >
              {t('careers.cta')}
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
