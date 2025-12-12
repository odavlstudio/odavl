import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';
import LoadingBar from '@/components/LoadingBar';
import Analytics from '@/components/Analytics';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: 'noindex, nofollow', // Block authenticated pages from search engines
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <LoadingBar />
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </div>
      <Analytics />
    </div>
  );
}
