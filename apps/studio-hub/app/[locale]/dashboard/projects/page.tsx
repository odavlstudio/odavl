'use client';

import { useState } from 'react';
import { Plus, Search, Filter, FolderOpen, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const projects = [
    {
      id: '1',
      name: 'E-Commerce API',
      language: 'TypeScript',
      status: 'critical',
      issues: 23,
      lastScan: '2h ago',
      description: 'REST API for e-commerce platform',
      repository: 'github.com/company/ecommerce-api',
      branch: 'main'
    },
    {
      id: '2',
      name: 'User Service',
      language: 'Python',
      status: 'healthy',
      issues: 2,
      lastScan: '4h ago',
      description: 'Microservice for user management',
      repository: 'github.com/company/user-service',
      branch: 'develop'
    },
    {
      id: '3',
      name: 'Frontend App',
      language: 'TypeScript',
      status: 'healthy',
      issues: 0,
      lastScan: '6h ago',
      description: 'React-based customer portal',
      repository: 'github.com/company/frontend-app',
      branch: 'main'
    },
    {
      id: '4',
      name: 'Analytics Engine',
      language: 'Java',
      status: 'warning',
      issues: 8,
      lastScan: '1d ago',
      description: 'Real-time analytics processing',
      repository: 'github.com/company/analytics-engine',
      branch: 'main'
    },
    {
      id: '5',
      name: 'Payment Service',
      language: 'TypeScript',
      status: 'healthy',
      issues: 1,
      lastScan: '2d ago',
      description: 'Payment processing microservice',
      repository: 'github.com/company/payment-service',
      branch: 'main'
    },
    {
      id: '6',
      name: 'Admin Dashboard',
      language: 'TypeScript',
      status: 'warning',
      issues: 5,
      lastScan: '3d ago',
      description: 'Internal admin control panel',
      repository: 'github.com/company/admin-dashboard',
      branch: 'develop'
    },
  ];

  const getStatusIcon = (status: string) => {
    if (status === 'healthy') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === 'warning') return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      TypeScript: 'bg-blue-100 text-blue-800',
      Python: 'bg-green-100 text-green-800',
      Java: 'bg-orange-100 text-orange-800',
    };
    return colors[language] || 'bg-gray-100 text-gray-800';
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your development projects</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-5 w-5" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Button */}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="text-gray-700">Filters</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              <p className="text-sm text-gray-600">Total Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter(p => p.status === 'healthy').length}
              </p>
              <p className="text-sm text-gray-600">Healthy</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter(p => p.status === 'warning').length}
              </p>
              <p className="text-sm text-gray-600">Warnings</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter(p => p.status === 'critical').length}
              </p>
              <p className="text-sm text-gray-600">Critical</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Language
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Scan
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(project.status)}
                        <p className="text-sm font-semibold text-gray-900">{project.name}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{project.repository}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLanguageColor(project.language)}`}>
                      {project.language}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{project.issues}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {project.lastScan}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium mr-4">
                      View
                    </button>
                    <button className="text-sm text-gray-600 hover:text-gray-700 font-medium">
                      Scan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
