'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Test {
  id: string;
  url: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
}

export default function DashboardPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/tests');
      const data = await response.json();
      setTests(data.tests || []);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const runTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/tests/${testId}/run`, {
        method: 'POST'
      });
      const data = await response.json();
      console.log('Test result:', data.result);
      fetchTests(); // Refresh list
    } catch (error) {
      console.error('Failed to run test:', error);
    }
  };

  const toggleTest = async (testId: string, enabled: boolean) => {
    try {
      await fetch(`/api/tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      fetchTests(); // Refresh list
    } catch (error) {
      console.error('Failed to toggle test:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Guardian Dashboard</h1>
            <p className="text-gray-600">Pre-deploy testing and monitoring</p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              📊 Analytics
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/ai-results'}>
              🤖 AI Results
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Tests</CardTitle>
            <CardDescription>Scheduled tests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active</CardTitle>
            <CardDescription>Running tests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {tests.filter(t => t.enabled).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inactive</CardTitle>
            <CardDescription>Paused tests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-400">
              {tests.filter(t => !t.enabled).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Tests</CardTitle>
          <CardDescription>Monitor your applications</CardDescription>
        </CardHeader>
        <CardContent>
          {tests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No tests scheduled yet</p>
              <Button>Add Your First Test</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{test.url}</div>
                    <div className="text-sm text-gray-500">
                      Schedule: {test.schedule}
                    </div>
                    {test.lastRun && (
                      <div className="text-xs text-gray-400">
                        Last run: {new Date(test.lastRun).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runTest(test.id)}
                    >
                      Run Now
                    </Button>
                    <Button
                      variant={test.enabled ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => toggleTest(test.id, !test.enabled)}
                    >
                      {test.enabled ? 'Pause' : 'Resume'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
