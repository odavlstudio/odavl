// Project Menu Item Component

'use client';

import { Check, Folder } from 'lucide-react';

type Project = {
  id: string;
  name: string;
  description?: string | null;
};

type ProjectMenuItemProps = {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
};

export function ProjectMenuItem({ project, isSelected, onSelect }: ProjectMenuItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <Folder className={`w-5 h-5 ${
          isSelected ? 'text-blue-600' : 'text-gray-400'
        }`} />
        <div className="text-left">
          <p className="font-medium">{project.name}</p>
          {project.description && (
            <p className="text-xs text-gray-500 truncate max-w-[180px]">
              {project.description}
            </p>
          )}
        </div>
      </div>
      {isSelected && (
        <Check className="w-5 h-5 text-blue-600" />
      )}
    </button>
  );
}
