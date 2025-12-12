'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useOrganizations } from '@/lib/api-hooks';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { generateMetadata } from '@/components/seo/Metadata';

export const metadata = generateMetadata({
  title: 'Settings',
  description: 'Manage your ODAVL organization settings and preferences',
  canonical: '/app/settings',
  noindex: true,
});

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: organizations } = useOrganizations();
  const [saving, setSaving] = useState(false);

  // Find current organization (assuming first one for now)
  const currentOrg = organizations?.[0];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // TODO: Implement organization update API
    setTimeout(() => setSaving(false), 1000);
  };

  const handleDeleteOrg = async () => {
    if (!confirm('Are you sure? This action cannot be undone.')) {
      return;
    }
    // TODO: Implement organization deletion API
    alert('Organization deletion not yet implemented');
  };

  return (
    <div className="px-8 py-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organization Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your organization profile and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">General</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  defaultValue={currentOrg?.name}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization Slug
                </label>
                <input
                  type="text"
                  defaultValue={currentOrg?.slug}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  pattern="[a-z0-9-]+"
                  title="Lowercase letters, numbers, and hyphens only"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used in URLs and API calls</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Plan
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md font-medium">
                    {currentOrg?.tier || 'FREE'}
                  </span>
                  <a href="/app/billing" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                    Manage Billing →
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={saving} variant="primary">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Profile</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  defaultValue={session?.user?.name || ''}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-md font-medium text-sm">
                  {currentOrg?.role || 'VIEWER'}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">API Keys</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Generate API keys to access ODAVL programmatically
            </p>
            <Button variant="secondary">
              Generate New Key
            </Button>
          </CardBody>
        </Card>

        {/* Danger Zone */}
        {currentOrg?.role === 'OWNER' && (
          <Card className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
            <CardBody>
              <h2 className="text-xl font-semibold text-red-900 dark:text-red-400 mb-2">Danger Zone</h2>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                Once you delete an organization, there is no going back. All projects, data, and team members will be permanently removed.
              </p>
              <Button variant="danger" onClick={handleDeleteOrg}>
                Delete Organization
              </Button>
            </CardBody>
          </Card>
        )}

        {currentOrg?.role !== 'OWNER' && (
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <CardBody>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-yellow-800 dark:text-yellow-300">
                  <p className="font-medium">Limited Permissions</p>
                  <p>Only organization owners can modify these settings.</p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
