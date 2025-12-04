/**
 * Cookie Category Component
 * Reusable component for displaying cookie categories
 */

'use client';

interface CookieCategoryProps {
  title: string;
  description: string;
  details: string[];
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export function CookieCategory({
  title,
  description,
  details,
  checked,
  disabled = false,
  onChange,
}: CookieCategoryProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-2">{description}</p>
          <ul className="text-xs text-gray-500 space-y-1">
            {details.map((detail, index) => (
              <li key={index}>• {detail}</li>
            ))}
          </ul>
        </div>
        <div className="ml-4">
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.checked)}
            className="w-5 h-5 text-blue-600"
          />
        </div>
      </div>
    </div>
  );
}
