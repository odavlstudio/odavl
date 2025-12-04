import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Revalidation utilities for on-demand ISR
 * Use when content changes and you need to purge cache
 */

// Revalidate specific paths
export async function revalidateInsightData(projectId: string) {
  revalidatePath(`/dashboard/insight`);
  revalidatePath(`/dashboard/insight/${projectId}`);
  // revalidateTag('insight-issues'); // Removed for Next.js 16 compatibility
}

export async function revalidateAutopilotData(projectId: string) {
  revalidatePath(`/dashboard/autopilot`);
  revalidatePath(`/dashboard/autopilot/${projectId}`);
  // revalidateTag('autopilot-runs'); // Removed for Next.js 16 compatibility
}

export async function revalidateGuardianData(projectId: string) {
  revalidatePath(`/dashboard/guardian`);
  revalidatePath(`/dashboard/guardian/${projectId}`);
  // revalidateTag('guardian-tests'); // Removed for Next.js 16 compatibility
}

export async function revalidateAnalytics(orgId: string) {
  revalidatePath(`/dashboard/analytics`);
  // revalidateTag(`analytics-${orgId}`); // Removed for Next.js 16 compatibility
}

export async function revalidateBlogPost(slug: string) {
  revalidatePath(`/blog/${slug}`);
  revalidatePath('/blog');
  // revalidateTag('blog-posts'); // Removed for Next.js 16 compatibility
}

export async function revalidateDocPage(slug: string) {
  revalidatePath(`/docs/${slug}`);
  revalidatePath('/docs');
  // revalidateTag('documentation'); // Removed for Next.js 16 compatibility
}

// Revalidate entire dashboard for an organization
export async function revalidateOrganization(orgId: string) {
  revalidatePath('/dashboard');
  // revalidateTag(`org-${orgId}`); // Removed for Next.js 16 compatibility
}

// API route for webhook-triggered revalidation
export async function handleRevalidationWebhook(
  type: string,
  identifier: string
): Promise<void> {
  switch (type) {
    case 'insight':
      await revalidateInsightData(identifier);
      break;
    case 'autopilot':
      await revalidateAutopilotData(identifier);
      break;
    case 'guardian':
      await revalidateGuardianData(identifier);
      break;
    case 'blog':
      await revalidateBlogPost(identifier);
      break;
    case 'docs':
      await revalidateDocPage(identifier);
      break;
  }
}
