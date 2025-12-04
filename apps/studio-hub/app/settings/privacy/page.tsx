/**
 * GDPR Privacy Settings Page
 *
 * Complete privacy management dashboard for users
 * Implements GDPR Articles 15, 17, 20, 21
 *
 * @route /settings/privacy
 */

import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GDPRPrivacyDashboard } from "@/components/gdpr-components";
import { Shield, Lock, Database, UserX } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy & Data Management | ODAVL Studio",
  description: "Manage your privacy settings, export your data, and exercise your GDPR rights.",
};

export default async function PrivacySettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/settings/privacy");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Privacy & Data Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your data and exercise your privacy rights
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold">Your privacy is protected</p>
              <p className="mt-1">
                ODAVL Studio is fully compliant with GDPR (EU), CCPA (California), and other
                privacy regulations. You have complete control over your data.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition">
            <Database className="h-10 w-10 text-green-600 dark:text-green-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Export Your Data
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Download all your personal data in JSON format. Includes workspaces, errors,
              analyses, and settings.
            </p>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-500">
              <strong>GDPR Article 15:</strong> Right to Access
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition">
            <Shield className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Manage Cookies
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Control which cookies we use. You can opt-out of analytics and marketing cookies
              anytime.
            </p>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-500">
              <strong>ePrivacy Directive:</strong> Cookie Consent
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg p-6 hover:shadow-lg transition">
            <UserX className="h-10 w-10 text-red-600 dark:text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Account
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Permanently delete your account and all data. This action cannot be undone after
              30 days.
            </p>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-500">
              <strong>GDPR Article 17:</strong> Right to Erasure
            </div>
          </div>
        </div>

        {/* Main GDPR Dashboard */}
        <GDPRPrivacyDashboard />

        {/* Legal Links */}
        <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Legal Documents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="/legal/privacy"
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-center"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">Privacy Policy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                How we collect and use your data
              </p>
            </a>
            <a
              href="/legal/terms"
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-center"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">Terms of Service</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Rules for using ODAVL Studio
              </p>
            </a>
            <a
              href="/legal/cookies"
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-center"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">Cookie Policy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                How we use cookies
              </p>
            </a>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Privacy Questions?
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            For privacy-related inquiries, contact our Data Protection Officer:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Email:</span>
              <a
                href="mailto:privacy@odavl.studio"
                className="text-blue-600 dark:text-blue-400 underline"
              >
                privacy@odavl.studio
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">DPO:</span>
              <a
                href="mailto:dpo@odavl.studio"
                className="text-blue-600 dark:text-blue-400 underline"
              >
                dpo@odavl.studio
              </a>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
            We will respond to all GDPR requests within 30 days as required by law.
          </p>
        </div>
      </div>
    </div>
  );
}
