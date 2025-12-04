/**
 * Reset Password Page
 * Reset password with token from email link
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SuccessMessage from './components/SuccessMessage';
import PasswordStrength from './components/PasswordStrength';
import { 
  calculatePasswordStrength, 
  validatePasswordMatch, 
  validatePasswordStrength 
} from './utils/passwordValidation';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const matchError = validatePasswordMatch(password, confirmPassword);
    if (matchError) {
      setError(matchError);
      return;
    }

    const strengthError = validatePasswordStrength(passwordStrength.score);
    if (strengthError) {
      setError(strengthError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/auth/login'), 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <SuccessMessage />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* Header */}
        <PageHeader />

        {/* Error Alert */}
        {error && <ErrorAlert message={error} />}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <PasswordInput
            id="password"
            label="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
          />
          
          {password && <PasswordStrength score={passwordStrength.score} feedback={passwordStrength.feedback} />}

          {/* Confirm Password */}
          <PasswordInput
            id="confirmPassword"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            showMismatch={!!(confirmPassword && password !== confirmPassword)}
          />

          {/* Submit Button */}
          <SubmitButton 
            loading={loading} 
            disabled={!token || passwordStrength.score < 5}
          />
        </form>

        {/* Footer */}
        <FormFooter />
      </div>
    </div>
  );
}

// Sub-components to reduce nesting
function PageHeader() {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
      <p className="text-gray-600">Choose a strong password for your account</p>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  showMismatch?: boolean;
}

function PasswordInput({ id, label, value, onChange, placeholder, showMismatch }: PasswordInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
      />
      {showMismatch && (
        <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
      )}
    </div>
  );
}

function SubmitButton({ loading, disabled }: { loading: boolean; disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Resetting...
        </span>
      ) : (
        'Reset Password'
      )}
    </button>
  );
}

function FormFooter() {
  return (
    <div className="mt-6 text-center">
      <p className="text-sm text-gray-600">
        Remember your password?{' '}
        <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
