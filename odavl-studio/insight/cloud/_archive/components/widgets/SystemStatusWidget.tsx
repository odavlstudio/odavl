/**
 * System Status Widget
 * Shows health and availability indicators
 */

'use client';

import React from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface SystemService {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: string;
  responseTime?: string;
}

export function SystemStatusWidget() {
  const services: SystemService[] = [
    {
      name: 'Analysis Engine',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '124ms'
    },
    {
      name: 'Database',
      status: 'operational',
      uptime: '100%',
      responseTime: '8ms'
    },
    {
      name: 'API Gateway',
      status: 'operational',
      uptime: '99.8%',
      responseTime: '45ms'
    },
    {
      name: 'WebSocket Server',
      status: 'degraded',
      uptime: '98.2%',
      responseTime: '312ms'
    }
  ];

  const getStatusIcon = (status: SystemService['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'down':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: SystemService['status']) => {
    switch (status) {
      case 'operational': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
    }
  };

  const overallStatus = services.every(s => s.status === 'operational')
    ? 'operational'
    : services.some(s => s.status === 'down')
    ? 'down'
    : 'degraded';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">System Status</h3>
      </div>

      {/* Overall Status */}
      <div className={`mb-4 p-3 rounded-lg ${
        overallStatus === 'operational' ? 'bg-green-50 border border-green-200' :
        overallStatus === 'degraded' ? 'bg-yellow-50 border border-yellow-200' :
        'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center gap-2">
          {getStatusIcon(overallStatus)}
          <span className={`font-medium ${getStatusColor(overallStatus)}`}>
            {overallStatus === 'operational' ? 'All Systems Operational' :
             overallStatus === 'degraded' ? 'Degraded Performance' :
             'System Outage'}
          </span>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {services.map(service => (
          <div key={service.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(service.status)}
              <span className="text-sm text-gray-900">{service.name}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">{service.uptime} uptime</div>
              {service.responseTime && (
                <div className="text-xs text-gray-400">{service.responseTime}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <a href="#" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
          View Status Page →
        </a>
      </div>
    </div>
  );
}
