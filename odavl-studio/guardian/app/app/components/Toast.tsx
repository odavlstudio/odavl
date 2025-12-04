import { ReactNode, useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      bg: 'bg-green-500',
      icon: '✅',
      border: 'border-green-600',
    },
    error: {
      bg: 'bg-red-500',
      icon: '❌',
      border: 'border-red-600',
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: '⚠️',
      border: 'border-yellow-600',
    },
    info: {
      bg: 'bg-blue-500',
      icon: 'ℹ️',
      border: 'border-blue-600',
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`fixed top-4 right-4 ${config.bg} text-white px-6 py-4 rounded-lg shadow-lg border-2 ${config.border} max-w-md animate-slide-in z-50`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{config.icon}</span>
        <p className="flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-white hover:text-slate-200 text-xl font-bold"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
