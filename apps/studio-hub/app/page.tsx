import { redirect } from 'next/navigation';

/**
 * Root Page - Redirects to default locale (en)
 * This fixes the "missing homepage" issue
 */
export default function RootPage() {
  // Redirect to English homepage by default
  redirect('/en');
}
