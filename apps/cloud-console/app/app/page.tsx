import { redirect } from 'next/navigation';

export default function AppHomePage() {
  // Redirect /app to /app/dashboard
  redirect('/app/dashboard');
}
