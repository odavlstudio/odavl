// ODAVL Frontend: Loading and Empty states
import React from 'react';

export const Loading: React.FC = () => (
  <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
);

export const Empty: React.FC<{ message?: string }> = ({ message = 'No data available.' }) => (
  <div className="flex items-center justify-center h-full text-gray-400">{message}</div>
);
