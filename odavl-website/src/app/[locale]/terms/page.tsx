import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - ODAVL',
  description: 'Terms of service and user agreement for ODAVL autonomous code quality platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-8">
            Terms of Service
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              Last updated: October 11, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using ODAVL services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Services</h2>
              <p className="text-gray-700 mb-4">ODAVL provides autonomous code quality improvement services including:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Command-line interface for autonomous code quality improvement</li>
                <li>Visual Studio Code extension for real-time monitoring</li>
                <li>Documentation, support, and account management portal</li>
                <li>Technical support and customer service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-4">To access certain features, you may need to create an account. You are responsible for:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Providing accurate and complete information</li>
                <li>Maintaining the security of your account credentials</li>
                <li>Ensuring all account activity is authorized</li>
                <li>Notifying us immediately of any unauthorized access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
              <p className="text-gray-700 mb-4">You agree to use ODAVL services only for lawful purposes and in compliance with these terms.</p>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h3 className="font-semibold text-red-800 mb-2">Prohibited Activities:</h3>
                <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                  <li>Any illegal or unauthorized activities</li>
                  <li>Uploading malicious code or malware</li>
                  <li>Attempting to gain unauthorized access to our systems</li>
                  <li>Interfering with or disrupting our services</li>
                  <li>Reverse engineering or attempting to extract source code</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Ownership & Privacy</h2>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <p className="text-blue-800 font-semibold">
                  🔒 You retain full ownership of your code and data. ODAVL never claims ownership of your intellectual property.
                </p>
              </div>
              <p className="text-gray-700 mb-4">Our data handling practices include:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Zero telemetry collection from your development environment</li>
                <li>Full data portability and export capabilities</li>
                <li>Right to delete all data upon account termination</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">ODAVL and its content are protected by copyright, trademark, and other intellectual property laws.</p>
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <h3 className="font-semibold text-green-800 mb-2">License Grant</h3>
                <p className="text-green-700 text-sm">We grant you a limited, non-exclusive, non-transferable license to use our services for their intended purpose.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Payment Terms</h2>
              <p className="text-gray-700 mb-4">For paid services, the following payment terms apply:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Billing cycles are monthly or annually as selected</li>
                <li>Automatic renewal unless cancelled before renewal date</li>
                <li>You are responsible for applicable taxes</li>
                <li>Price changes require 30 days advance notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Termination</h2>
              <p className="text-gray-700 mb-4">We may terminate or suspend your account for:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Material breach of these terms</li>
                <li>Illegal or unauthorized use of services</li>
                <li>Business reasons with 30 days notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-yellow-800 font-semibold text-sm">
                  ODAVL is provided &apos;AS IS&apos; without warranties of any kind.
                </p>
              </div>
              <p className="text-gray-700">We disclaim all warranties, express or implied, including but not limited to merchantability, fitness for a particular purpose, and non-infringement.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700">In no event shall ODAVL be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business interruption.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-700">You agree to indemnify and hold ODAVL harmless from any claims, damages, or expenses arising from your use of our services or violation of these terms.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-700">These terms are governed by the laws of the State of California, United States. Any disputes will be resolved in the courts of California.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700">We reserve the right to modify these terms at any time. Material changes will be communicated via email with 30 days advance notice. Continued use constitutes acceptance of modified terms.</p>
            </section>

            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 mb-4">For questions about these terms, contact us:</p>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <span className="font-medium">Email:</span> legal@odavl.com
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Address:</span><br />
                  ODAVL Legal Department<br />
                  123 Enterprise Way<br />
                  Tech Valley, CA 94000<br />
                  United States
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}