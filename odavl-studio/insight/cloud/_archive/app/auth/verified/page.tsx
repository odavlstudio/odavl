/**
 * Email Verified Success Page
 * Shown after user clicks verification link in email
 */

import Link from 'next/link';

export default function EmailVerifiedPage({
  searchParams,
}: {
  searchParams: { already?: string };
}) {
  const alreadyVerified = searchParams.already === 'true';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {alreadyVerified ? 'Already Verified!' : 'Email Verified!'}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8">
          {alreadyVerified
            ? 'Your email was already verified. You can now sign in to your account.'
            : 'Your email has been successfully verified. You can now sign in and start using ODAVL Studio.'}
        </p>

        {/* Features List */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 mb-8 text-left">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            What&apos;s next? 🚀
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-indigo-500 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Install the ODAVL VS Code extension</span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-indigo-500 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Run your first code analysis</span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-indigo-500 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>View insights on your dashboard</span>
            </li>
          </ul>
        </div>

        {/* CTA Button */}
        <Link
          href="/auth/login"
          className="inline-block w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Sign In to Your Account
        </Link>

        {/* Support Link */}
        <p className="mt-6 text-sm text-gray-500">
          Need help?{' '}
          <a
            href="mailto:support@odavl.com"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
