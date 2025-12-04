import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('contact');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function ContactPage() {
  const t = useTranslations('contact');

  const contactMethods = [
    {
      id: 'sales',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'blue',
    },
    {
      id: 'support',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'green',
    },
    {
      id: 'enterprise',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'purple',
    },
    {
      id: 'partnerships',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'pink',
    },
  ];

  const offices = [
    { id: 'sf', continent: 'americas' },
    { id: 'london', continent: 'europe' },
    { id: 'singapore', continent: 'asia' },
  ];

  const faqs = [
    { id: 'response', category: 'general' },
    { id: 'demo', category: 'general' },
    { id: 'pricing', category: 'sales' },
    { id: 'trial', category: 'sales' },
    { id: 'support-hours', category: 'support' },
    { id: 'custom', category: 'enterprise' },
  ];

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

      {/* Contact Methods */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('methods.title')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('methods.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {contactMethods.map((method) => (
                <div
                  key={method.id}
                  className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br from-${method.color}-500 to-${method.color}-700 rounded-xl mb-6 flex items-center justify-center text-white`}>
                    {method.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {t(`methods.items.${method.id}.title`)}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t(`methods.items.${method.id}.description`)}
                  </p>
                  <a
                    href={`mailto:${t(`methods.items.${method.id}.email`)}`}
                    className={`inline-flex items-center text-${method.color}-600 font-semibold hover:text-${method.color}-700`}
                  >
                    {t(`methods.items.${method.id}.email`)}
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('form.title')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('form.subtitle')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 shadow-xl">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('form.fields.name')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder={t('form.placeholders.name')}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('form.fields.email')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder={t('form.placeholders.email')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="company" className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('form.fields.company')}
                    </label>
                    <input
                      type="text"
                      id="company"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder={t('form.placeholders.company')}
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('form.fields.subject')}
                    </label>
                    <select
                      id="subject"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                      <option value="">{t('form.placeholders.subject')}</option>
                      <option value="sales">{t('methods.items.sales.title')}</option>
                      <option value="support">{t('methods.items.support.title')}</option>
                      <option value="enterprise">{t('methods.items.enterprise.title')}</option>
                      <option value="partnerships">{t('methods.items.partnerships.title')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('form.fields.message')}
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder={t('form.placeholders.message')}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-xl"
                >
                  {t('form.submit')}
                </button>

                <p className="text-sm text-gray-600 mt-4">
                  {t('form.privacy')}
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('offices.title')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('offices.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {offices.map((office) => (
                <div key={office.id} className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="text-4xl mb-4">{t(`offices.locations.${office.id}.flag`)}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {t(`offices.locations.${office.id}.city`)}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t(`offices.locations.${office.id}.address`)}
                  </p>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {t(`offices.locations.${office.id}.phone`)}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {t(`offices.locations.${office.id}.email`)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('faq.title')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('faq.subtitle')}
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t(`faq.items.${faq.id}.question`)}
                  </h3>
                  <p className="text-gray-700">
                    {t(`faq.items.${faq.id}.answer`)}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">{t('faq.more')}</p>
              <a
                href="/resources"
                className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700"
              >
                {t('faq.helpCenter')}
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              {t('cta.subtitle')}
            </p>
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-indigo-900 bg-white rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-xl"
            >
              {t('cta.cta')}
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
