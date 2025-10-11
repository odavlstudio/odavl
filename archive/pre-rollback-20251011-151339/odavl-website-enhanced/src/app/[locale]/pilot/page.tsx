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