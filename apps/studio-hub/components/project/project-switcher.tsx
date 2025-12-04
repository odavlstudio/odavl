// Project Switcher Component
// Week 2: Multi-Tenancy Project Selection

'use client';

import { useState } from 'react';
import { useOrganization } from '@/lib/context/organization';
import { Button } from '@/components/ui/button';
import { ChevronDown, Folder, Plus } from 'lucide-react';
import { ProjectMenuItem } from './ProjectMenuItem';

export function ProjectSwitcher() {
  const { projects, currentProject, setCurrentProject, isLoading } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="w-48 h-10 bg-gray-200 animate-pulse rounded-lg" />
    );
  }

  if (projects.length === 0) {
    return (
      <Button
        variant="outline"
        onClick={() => window.location.href = '/projects/new'}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Create Project
      </Button>
    );
  }

  const handleProjectSelect = (projectId: string) => {
    setCurrentProject(projectId);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    window.location.href = '/projects/new';
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-gray-500" />
          <span className="font-medium truncate max-w-[140px]">
            {currentProject?.name || 'Select Project'}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full mt-2 z-20 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[280px]">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Projects ({projects.length})
              </p>
            </div>

            <div className="py-1 max-h-[300px] overflow-y-auto">
              {projects.map((project) => (
                <ProjectMenuItem
                  key={project.id}
                  project={project}
                  isSelected={currentProject?.id === project.id}
                  onSelect={() => handleProjectSelect(project.id)}
                />
              ))}
            </div>

            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <div className="w-5 h-5 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Plus className="w-3 h-3 text-gray-400" />
                </div>
                <span>Create New Project</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
