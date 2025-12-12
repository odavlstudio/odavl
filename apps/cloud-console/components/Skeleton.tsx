/**
 * Loading Skeleton Components for ODAVL Cloud Console
 * Phase 13 Batch 4: Error Boundaries & UX Polish
 * 
 * Reusable loading state components
 */

import React from 'react';

// ============================================================================
// Base Skeleton Component
// ============================================================================

export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      {...props}
    />
  );
}

// ============================================================================
// Stat Card Skeleton
// ============================================================================

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// ============================================================================
// Project Card Skeleton
// ============================================================================

export function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="flex gap-4 text-sm text-gray-600">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

// ============================================================================
// Member Card Skeleton
// ============================================================================

export function MemberCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

// ============================================================================
// Table Row Skeleton
// ============================================================================

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-200">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// ============================================================================
// Issue Card Skeleton
// ============================================================================

export function IssueCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
      <div className="flex items-start gap-3 mb-2">
        <Skeleton className="h-6 w-16 rounded" />
        <div className="flex-1">
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <Skeleton className="h-4 w-48 mt-2" />
    </div>
  );
}

// ============================================================================
// Score Card Skeleton
// ============================================================================

export function ScoreCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 shadow border border-gray-200 text-center">
      <Skeleton className="h-4 w-24 mx-auto mb-3" />
      <Skeleton className="h-12 w-16 mx-auto mb-2" />
      <Skeleton className="h-3 w-20 mx-auto" />
    </div>
  );
}

// ============================================================================
// List Skeleton
// ============================================================================

export function ListSkeleton({ count = 3, itemHeight = 16 }: { count?: number; itemHeight?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton key={idx} className={`h-${itemHeight} w-full`} />
      ))}
    </div>
  );
}

// ============================================================================
// Dashboard Skeleton (Full Page)
// ============================================================================

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg p-6 shadow">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg p-6 shadow">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-2">
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
        </div>
      </div>
    </div>
  );
}
