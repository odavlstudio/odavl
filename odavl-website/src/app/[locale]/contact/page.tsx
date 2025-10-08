import { ContactForm } from '@/components/forms/ContactForm';
import { PilotForm } from '@/components/forms/PilotForm';

export default function ContactPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Get in Touch</h1>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-semibold mb-6">Contact Us</h2>
            <p className="text-gray-600 mb-6">
              Have questions about ODAVL? We&apos;d love to hear from you.
            </p>
            <ContactForm />
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-6">Join Our Pilot Program</h2>
            <p className="text-gray-600 mb-6">
              Be among the first to experience autonomous code quality improvement.
            </p>
            <PilotForm />
          </div>
        </div>
      </div>
    </div>
  );
}