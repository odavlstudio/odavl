import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">ODAVL Cloud</h1>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <>
                  <Link
                    href="/app/dashboard"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/api/auth/signout"
                    className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Autonomous Code Quality Platform
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            AI-powered error detection, self-healing code, and website testing for production-grade applications
          </p>
          
          {!session && (
            <div className="mt-8">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Start Free Trial
              </Link>
            </div>
          )}
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow-lg rounded-lg">
              <div className="px-6 py-8">
                <h3 className="text-lg font-medium text-gray-900">ODAVL Insight</h3>
                <p className="mt-2 text-gray-600">
                  16 detectors for TypeScript, Security, Performance, and more
                </p>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow-lg rounded-lg">
              <div className="px-6 py-8">
                <h3 className="text-lg font-medium text-gray-900">ODAVL Autopilot</h3>
                <p className="mt-2 text-gray-600">
                  Self-healing code with O-D-A-V-L cycle and undo snapshots
                </p>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow-lg rounded-lg">
              <div className="px-6 py-8">
                <h3 className="text-lg font-medium text-gray-900">ODAVL Guardian</h3>
                <p className="mt-2 text-gray-600">
                  Pre-deploy testing for accessibility, performance, and security
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
