'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type Project = {
  id: string;
  name: string;
  slug: string;
};

type IssueFiltersProps = {
  projects: Project[];
};

export function IssueFilters({ projects }: IssueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const severity = searchParams?.get('severity') ?? null;
  const detector = searchParams?.get('detector') ?? null;
  const project = searchParams?.get('project') ?? null;

  const hasActiveFilters = !!(severity || detector || project);

  const updateFilter = (key: string, value: string | null) => {
    if (!searchParams || !pathname) return;
    
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    if (!pathname) return;
    router.push(pathname);
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Filters:</span>
      </div>

      <Select
        value={severity || 'all'}
        onValueChange={(value) => updateFilter('severity', value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Severities</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={detector || 'all'}
        onValueChange={(value) => updateFilter('detector', value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Detector" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Detectors</SelectItem>
          <SelectItem value="typescript">TypeScript</SelectItem>
          <SelectItem value="eslint">ESLint</SelectItem>
          <SelectItem value="security">Security</SelectItem>
          <SelectItem value="performance">Performance</SelectItem>
          <SelectItem value="complexity">Complexity</SelectItem>
          <SelectItem value="import">Import</SelectItem>
          <SelectItem value="circular">Circular</SelectItem>
          <SelectItem value="runtime">Runtime</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={project || 'all'}
        onValueChange={(value) => updateFilter('project', value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {projects.map((proj) => (
            <SelectItem key={proj.id} value={proj.id}>
              {proj.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="gap-1"
        >
          <X className="w-4 h-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
