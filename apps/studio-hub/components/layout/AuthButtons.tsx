// Auth Buttons Component
// Sign In and Sign Up CTA buttons with optional mobile mode

import Link from 'next/link';

interface AuthButtonsProps {
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
  mobile?: boolean;
}

export function AuthButtons({ onSignInClick, onSignUpClick, mobile = false }: AuthButtonsProps) {
  const containerClass = mobile ? 'flex flex-col gap-2' : 'flex items-center gap-3';
  const signInClass = mobile
    ? 'px-4 py-3 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
    : 'px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors';
  const signUpClass = mobile
    ? 'px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center'
    : 'px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors';

  return (
    <div className={containerClass}>
      <Link href="/auth/signin" onClick={onSignInClick} className={signInClass}>
        Sign In
      </Link>
      <Link href="/auth/signup" onClick={onSignUpClick} className={signUpClass}>
        Start Free Trial
      </Link>
    </div>
  );
}
