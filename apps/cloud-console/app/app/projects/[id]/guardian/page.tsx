/**
 * Guardian Tests UI
 * Displays test runs with real-time updates
 */

'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from '@/lib/socket-stub';

interface TestRun {
  id: string;
  type: string;
  status: string;
  startedAt: string;
  duration?: number;
  screenshots: string[];
  videos: string[];
}

export default function GuardianPage({ params }: { params: { id: string } }) {
  const [tests, setTests] = useState<TestRun[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    fetchTests();
    
    // Connect to Socket.io for real-time updates
    const newSocket = io(process.env.NEXT_PUBLIC_GUARDIAN_WS_URL || '');
    setSocket(newSocket);

    newSocket.on('test:progress', (data: { testId: string; status: string }) => {
      // Update test status in real-time
      setTests((prev) => 
        prev.map((t) => t.id === data.testId ? { ...t, status: data.status } : t)
      );
    });

    return () => {
      newSocket.close();
    };
  }, [params.id]);

  const fetchTests = async () => {
    const res = await fetch(`/api/projects/${params.id}/guardian/tests`);
    if (res.ok) {
      setTests(await res.json());
    }
  };

  return (
    <div className="guardian-page">
      <h1>Guardian Test Runs</h1>

      <table className="tests-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Status</th>
            <th>Started</th>
            <th>Duration</th>
            <th>Artifacts</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => (
            <tr key={test.id}>
              <td>{test.type}</td>
              <td>{test.status}</td>
              <td>{new Date(test.startedAt).toLocaleString()}</td>
              <td>{test.duration ? `${test.duration}ms` : '-'}</td>
              <td>
                {test.screenshots.length > 0 && <span>📸 {test.screenshots.length}</span>}
                {test.videos.length > 0 && <span>🎥 {test.videos.length}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
