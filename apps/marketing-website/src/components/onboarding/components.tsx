/**
 * Onboarding Flow Components
 * 
 * Reusable UI components for the onboarding wizard
 */

import { ReactNode } from 'react';

interface StepContainerProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function StepContainer({ title, description, children }: StepContainerProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-300 mb-6">{description}</p>
      {children}
    </div>
  );
}

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2 text-sm text-gray-300">
        <span>Step {current} of {total}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-blue to-brand-purple transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface NavigationButtonsProps {
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}

export function NavigationButtons({
  onNext,
  onBack,
  nextLabel = 'Continue',
  backLabel = 'Back',
  nextDisabled = false,
  showBack = true,
}: NavigationButtonsProps) {
  return (
    <div className="flex gap-4">
      {showBack && onBack && (
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-semibold"
        >
          {backLabel}
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="flex-1 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-white font-semibold mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${
          error ? 'border-red-400' : 'border-white/20'
        } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue`}
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
}

interface SuccessMessageProps {
  title: string;
  message: string;
  action: () => void;
  actionLabel: string;
}

export function SuccessMessage({
  title,
  message,
  action,
  actionLabel,
}: SuccessMessageProps) {
  return (
    <div className="text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-300 mb-8">{message}</p>
      <button
        onClick={action}
        className="w-full py-3 bg-gradient-to-r from-brand-blue to-brand-purple text-white rounded-lg hover:opacity-90 transition font-semibold"
      >
        {actionLabel}
      </button>
    </div>
  );
}
