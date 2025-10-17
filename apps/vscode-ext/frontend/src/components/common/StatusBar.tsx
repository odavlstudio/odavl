// Common StatusBar component
import React from 'react';

interface StatusBarProps {
  status: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ status }) => (
  <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white text-xs py-1 px-4 z-50">
    ODAVL Status: {status}
  </div>
);

export default StatusBar;
