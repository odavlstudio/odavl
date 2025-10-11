'use client';

import { useEffect, useState } from 'react';

interface BuildInfo {
  environment: string;
  buildTime: string;
  gitCommit?: string;
  nodeEnv: string;
}

export function LaunchMonitor() {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const info: BuildInfo = {
      environment: process.env.NODE_ENV || 'development',
      buildTime: new Date().toISOString(),
      gitCommit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
      nodeEnv: process.env.NODE_ENV || 'development'
    };

    setBuildInfo(info);
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV === 'production' || !buildInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white text-xs p-2 rounded shadow-lg font-mono z-50">
      <div>ENV: {buildInfo.environment}</div>
      <div>BUILD: {buildInfo.buildTime.slice(11, 19)}</div>
      <div>COMMIT: {buildInfo.gitCommit}</div>
    </div>
  );
}