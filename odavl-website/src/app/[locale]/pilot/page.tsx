// Enable static export for all supported locales
export function generateStaticParams() {
  // List all supported locales for static export
  return [
    { locale: 'en' },
    { locale: 'fr' },
    { locale: 'de' },
    { locale: 'es' },
    { locale: 'it' },
    { locale: 'pt' },
    { locale: 'ja' },
    { locale: 'zh' },
    { locale: 'ru' },
  ];
}
import { PilotForm } from '@/components/forms/PilotForm';

export default function PilotPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Join the ODAVL Pilot Program</h1>
          <p className="text-xl text-muted-foreground">
            Be among the first to experience autonomous code quality improvement with enterprise safety.
          </p>
        </div>

        <section id="pilot-form">
          <PilotForm />
        </section>
      </div>
    </div>
  );
}
