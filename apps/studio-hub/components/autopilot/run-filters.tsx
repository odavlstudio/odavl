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

type RunFiltersProps = {
  projects: Project[];
};

export function RunFilters({ projects }: RunFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = searchParams?.get('status') ?? null;
  const project = searchParams?.get('project') ?? null;

  const hasActiveFilters = !!(status || project);

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
        value={status || 'all'}
        onValueChange={(value) => updateFilter('status', value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="running">Running</SelectItem>
          <SelectItem value="success">Success</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
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
