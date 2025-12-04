// Navigation Link Component
// Handles active state styling for desktop/mobile navigation

import Link from 'next/link';

interface NavLinkProps {
  href: string;
  name: string;
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}

export function NavLink({ href, name, isActive, onClick, className = '' }: NavLinkProps) {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const activeStyles = isActive
    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${baseStyles} ${activeStyles} ${className}`}
    >
      {name}
    </Link>
  );
}
