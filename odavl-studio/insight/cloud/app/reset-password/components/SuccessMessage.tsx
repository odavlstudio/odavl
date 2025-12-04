/**
 * Success Message Component
 * Displayed after successful password reset
 */

export default function SuccessMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
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
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Password Reset!</h1>
        <p className="text-gray-600 mb-6">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
        <p className="text-sm text-gray-500">Redirecting to login page...</p>
      </div>
    </div>
  );
}
