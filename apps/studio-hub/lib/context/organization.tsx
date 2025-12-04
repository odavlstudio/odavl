// Organization Context Provider
// Week 2: Multi-Tenancy Architecture

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { Organization, Project } from '@prisma/client';
import { logger } from '@/lib/logger';
import { http } from '@/lib/utils/fetch';

interface OrgContextValue {
  organization: Organization | null;
  projects: Project[];
  isLoading: boolean;
  switchOrg: (orgId: string) => Promise<void>;
  currentProject: Project | null;
  setCurrentProject: (projectId: string) => void;
  refetchOrganization: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function useOrganization() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrgProvider');
  }
  return context;
}

interface OrgProviderProps {
  children: ReactNode;
}

export function OrgProvider({ children }: OrgProviderProps) {
  const { data: session, status } = useSession();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch organization data
  async function fetchOrganization(orgId: string) {
    setIsLoading(true);
    try {
      const response = await http.get(`/api/organizations/${orgId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch organization');
      }

      const data = await response.json();
      setOrganization(data.organization);
      setProjects(data.projects);

      // Set first project as current if available
      if (data.projects.length > 0 && !currentProject) {
        setCurrentProjectState(data.projects[0]);
        localStorage.setItem('currentProjectId', data.projects[0].id);
      }
    } catch (error) {
      logger.error('Error fetching organization', error as Error);
      setOrganization(null);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Switch to different organization
  async function switchOrg(orgId: string) {
    try {
      // Update user's current org in database
      const response = await http.post('/api/user/switch-org', { orgId }, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to switch organization');
      }

      // Refetch organization data
      await fetchOrganization(orgId);

      // Clear current project
      setCurrentProjectState(null);
      localStorage.removeItem('currentProjectId');

      // Reload page to refresh all data
      window.location.href = '/dashboard';
    } catch (error) {
      logger.error('Error switching organization', error as Error);
      throw error;
    }
  }

  // Set current project
  function setCurrentProject(projectId: string) {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProjectState(project);
      localStorage.setItem('currentProjectId', projectId);
    }
  }

  // Refetch organization data
  async function refetchOrganization() {
    if (session?.user?.orgId) {
      await fetchOrganization(session.user.orgId);
    }
  }

  // Load organization on mount or session change
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.orgId) {
      fetchOrganization(session.user.orgId);
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [session?.user?.orgId, status]);

  // Restore current project from localStorage
  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      const savedProjectId = localStorage.getItem('currentProjectId');
      if (savedProjectId) {
        const project = projects.find(p => p.id === savedProjectId);
        if (project) {
          setCurrentProjectState(project);
        }
      }
    }
  }, [projects]);

  const value: OrgContextValue = {
    organization,
    projects,
    isLoading,
    switchOrg,
    currentProject,
    setCurrentProject,
    refetchOrganization,
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}
