/**
 * React Hooks for API Client
 * Type-safe hooks with automatic refetching
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  apiClient,
  Organization,
  Member,
  Project,
  UsageStats,
  ApiError,
} from './api-client';

// ============================================================================
// Hook Types
// ============================================================================

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Organizations
// ============================================================================

export function useOrganizations(): UseQueryResult<Organization[]> {
  const [data, setData] = useState<Organization[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getOrganizations();
      setData(result.organizations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useSwitchOrganization(): UseMutationResult<
  { organizationId: string; organizationSlug: string; role: string },
  string
> {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (organizationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.switchOrganization(organizationId);
      setData(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to switch organization';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, data, loading, error };
}

// ============================================================================
// Members
// ============================================================================

export function useMembers(): UseQueryResult<Member[]> {
  const [data, setData] = useState<Member[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getMembers();
      setData(result.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useInviteMember(): UseMutationResult<
  Member,
  { email: string; role: 'DEVELOPER' | 'VIEWER' }
> {
  const [data, setData] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (variables: { email: string; role: 'DEVELOPER' | 'VIEWER' }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.inviteMember(variables.email, variables.role);
      setData(result.member);
      return result.member;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to invite member';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, data, loading, error };
}

export function useUpdateMemberRole(): UseMutationResult<
  Member,
  { memberId: string; role: 'ADMIN' | 'DEVELOPER' | 'VIEWER' }
> {
  const [data, setData] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (variables: { memberId: string; role: 'ADMIN' | 'DEVELOPER' | 'VIEWER' }) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiClient.updateMemberRole(variables.memberId, variables.role);
        setData(result.member);
        return result.member;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update member role';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { mutate, data, loading, error };
}

export function useRemoveMember(): UseMutationResult<boolean, string> {
  const [data, setData] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (memberId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.removeMember(memberId);
      setData(result.success);
      return result.success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove member';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, data, loading, error };
}

// ============================================================================
// Projects
// ============================================================================

export function useProjects(status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED'): UseQueryResult<Project[]> {
  const [data, setData] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getProjects(status);
      setData(result.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useCreateProject(): UseMutationResult<
  Project,
  {
    name: string;
    slug: string;
    repository?: string;
    branch?: string;
    language?: string;
  }
> {
  const [data, setData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (variables: {
      name: string;
      slug: string;
      repository?: string;
      branch?: string;
      language?: string;
    }) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiClient.createProject(variables);
        setData(result.project);
        return result.project;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create project';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { mutate, data, loading, error };
}

export function useUpdateProject(): UseMutationResult<
  Project,
  {
    projectId: string;
    data: {
      name?: string;
      repository?: string;
      branch?: string;
      language?: string;
      status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
    };
  }
> {
  const [data, setData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (variables: {
      projectId: string;
      data: {
        name?: string;
        repository?: string;
        branch?: string;
        language?: string;
        status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
      };
    }) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiClient.updateProject(variables.projectId, variables.data);
        setData(result.project);
        return result.project;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update project';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { mutate, data, loading, error };
}

export function useDeleteProject(): UseMutationResult<boolean, string> {
  const [data, setData] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.deleteProject(projectId);
      setData(result.success);
      return result.success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete project';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, data, loading, error };
}

// ============================================================================
// Billing
// ============================================================================

export function useUsageStats(): UseQueryResult<UsageStats> {
  const [data, setData] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getUsageStats();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useCreateCheckoutSession(): UseMutationResult<string, 'PRO' | 'ENTERPRISE'> {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (tier: 'PRO' | 'ENTERPRISE') => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.createCheckoutSession(tier);
      setData(result.url);
      return result.url;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create checkout session';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, data, loading, error };
}

export function useCreatePortalSession(): UseMutationResult<string, void> {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.createPortalSession();
      setData(result.url);
      return result.url;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create portal session';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, data, loading, error };
}
