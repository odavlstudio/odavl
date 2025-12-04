import { getTranslations } from 'next-intl/server';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TopBar } from '@/components/dashboard/top-bar';
import { PermissionProvider } from '@/lib/auth/permission-context';
import { Role } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const t = await getTranslations({ locale: resolvedParams.locale, namespace: 'dashboard' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: In production, get user role and ID from session
  // For now, using mock member role for demo
  const mockUserRole = Role.MEMBER;
  const mockUserId = 'user-123';

  return (
    <PermissionProvider userRole={mockUserRole} userId={mockUserId}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar - 256px width */}
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar - 64px height */}
          <TopBar />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </PermissionProvider>
  );
}
