/**
 * Shared TypeScript types for ODAVL Studio
 * @package @odavl/types
 */
type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';
type UsageType = 'detector_runs' | 'projects' | 'team_members' | 'api_calls' | 'storage_mb';
interface ProductTier {
    id: SubscriptionTier;
    name: string;
    price: number;
    interval: 'month' | 'year';
    limits: {
        projects: number;
        detectorRuns: number;
        teamMembers: number;
        apiCalls: number;
        storageMB: number;
    };
    features: string[];
}
declare const PRODUCT_TIERS: Record<SubscriptionTier, ProductTier>;
type UserRole = 'user' | 'admin' | 'owner';
interface User {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    subscriptionTier: SubscriptionTier;
    createdAt: Date;
    updatedAt: Date;
}
interface Project {
    id: string;
    name: string;
    description: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
type Severity = 'critical' | 'high' | 'medium' | 'low';
/**
 * Detector names used across ODAVL products
 * Shared type to avoid cross-product imports
 */
type DetectorName = string;
interface Issue {
    id: string;
    type: string;
    message: string;
    severity: Severity;
    file: string;
    line: number;
    column: number;
    code?: string;
    fix?: string;
}
interface Analysis {
    id: string;
    projectId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    issues: Issue[];
    startedAt: Date;
    completedAt: Date | null;
}
interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export { type Analysis, type ApiResponse, type DetectorName, type Issue, PRODUCT_TIERS, type PaginatedResponse, type ProductTier, type Project, type Severity, type SubscriptionTier, type UsageType, type User, type UserRole };
