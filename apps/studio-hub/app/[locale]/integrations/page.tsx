import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('integrations');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function IntegrationsPage() {
  const t = useTranslations('integrations');

  const cicdIntegrations = ['github-actions', 'gitlab-ci', 'jenkins', 'circleci', 'azure-devops', 'bitbucket'];
  const ideIntegrations = ['vscode', 'intellij', 'webstorm', 'vim'];
  const monitoringIntegrations = ['sentry', 'datadog', 'newrelic', 'prometheus'];
  const communicationIntegrations = ['slack', 'teams', 'discord', 'email'];
  const cloudIntegrations = ['aws', 'azure', 'gcp', 'vercel', 'netlify', 'heroku'];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-600 via-purple-700 to-indigo-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-pink-100 mb-8">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* CI/CD Integrations */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('cicd.title')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('cicd.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cicdIntegrations.map((integration) => (
                <div key={integration} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                      {integration.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {t(`cicd.items.${integration}.name`)}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {t(`cicd.items.${integration}.description`)}
                  </p>
                  <Link
                    href={`/docs/integrations/${integration}`}
                    className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700"
                  >
                    {t('viewDocs')}
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IDE Integrations */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('ide.title')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('ide.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ideIntegrations.map((integration) => (
                <div key={integration} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                      {integration === 'vscode' && '💻'}
                      {integration === 'intellij' && '🧠'}
                      {integration === 'webstorm' && '🌐'}
                      {integration === 'vim' && '⚡'}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {t(`ide.items.${integration}.name`)}
                    </h3>
                    <p className="text-gray-600">
                      {t(`ide.items.${integration}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Monitoring Integrations */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('monitoring.title')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('monitoring.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {monitoringIntegrations.map((integration) => (
                <div key={integration} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                      📊
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {t(`monitoring.items.${integration}.name`)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t(`monitoring.items.${integration}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Communication Integrations */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('communication.title')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('communication.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {communicationIntegrations.map((integration) => (
                <div key={integration} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white text-2xl mx-auto mb-4">
                      {integration === 'slack' && '💬'}
                      {integration === 'teams' && '👥'}
                      {integration === 'discord' && '🎮'}
                      {integration === 'email' && '📧'}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {t(`communication.items.${integration}.name`)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t(`communication.items.${integration}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cloud Platform Integrations */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('cloud.title')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('cloud.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {cloudIntegrations.map((integration) => (
                <div key={integration} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 shadow-md hover:shadow-xl transition-all text-center">
                  <div className="text-4xl mb-3">☁️</div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {t(`cloud.items.${integration}.name`)}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-pink-600 via-purple-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-pink-100 mb-8">
              {t('cta.subtitle')}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-indigo-900 bg-white rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-xl"
            >
              {t('cta.cta')}
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
