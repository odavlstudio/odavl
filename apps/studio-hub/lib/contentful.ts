import { createClient, Entry } from 'contentful';
import type { Document } from '@contentful/rich-text-types';

// Contentful asset types
interface ContentfulAsset {
  fields?: {
    file?: {
      url?: string;
    };
  };
}

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
});

// Helper function to safely extract asset URL
function getAssetUrl(asset: unknown): string {
  return (asset as ContentfulAsset)?.fields?.file?.url || '';
}

// Generic helper to map entry fields to typed objects
function mapEntryFields<T>(
  item: Entry,
  mapper: (fields: Record<string, unknown>, sysId: string) => T
): T {
  return mapper(item.fields as Record<string, unknown>, item.sys.id);
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: Document;
  publishDate: string;
  author: {
    name: string;
    image: string;
  };
  coverImage: string;
  tags: string[];
}

export async function getBlogPosts(limit = 10): Promise<BlogPost[]> {
  const entries = await client.getEntries({
    content_type: 'blogPost',
    order: ['-fields.publishDate'],
    limit,
  });

  return entries.items.map((item: Entry) =>
    mapEntryFields<BlogPost>(item, (fields, id) => ({
      id,
      title: fields.title as string,
      slug: fields.slug as string,
      excerpt: fields.excerpt as string,
      content: fields.content as Document,
      publishDate: fields.publishDate as string,
      author: fields.author as { name: string; image: string },
      coverImage: getAssetUrl(fields.coverImage),
      tags: (fields.tags as string[]) || [],
    }))
  );
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const entries = await client.getEntries({
    content_type: 'blogPost',
    'fields.slug': slug,
    limit: 1,
  });

  if (entries.items.length === 0) return null;

  return mapEntryFields<BlogPost>(entries.items[0], (fields, id) => ({
    id,
    title: fields.title as string,
    slug: fields.slug as string,
    excerpt: fields.excerpt as string,
    content: fields.content as Document,
    publishDate: fields.publishDate as string,
    author: fields.author as { name: string; image: string },
    coverImage: getAssetUrl(fields.coverImage),
    tags: (fields.tags as string[]) || [],
  }));
}

export interface DocPage {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: Document;
  order: number;
}

export async function getDocPages(): Promise<DocPage[]> {
  const entries = await client.getEntries({
    content_type: 'docPage',
    order: ['fields.order'],
  });

  return entries.items.map((item: Entry) =>
    mapEntryFields<DocPage>(item, (fields, id) => ({
      id,
      title: fields.title as string,
      slug: fields.slug as string,
      category: fields.category as string,
      content: fields.content as Document,
      order: fields.order as number,
    }))
  );
}

export async function getDocPage(slug: string): Promise<DocPage | null> {
  const entries = await client.getEntries({
    content_type: 'docPage',
    'fields.slug': slug,
    limit: 1,
  });

  if (entries.items.length === 0) return null;

  return mapEntryFields<DocPage>(entries.items[0], (fields, id) => ({
    id,
    title: fields.title as string,
    slug: fields.slug as string,
    category: fields.category as string,
    content: fields.content as Document,
    order: fields.order as number,
  }));
}

export interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  company: string;
  industry: string;
  logo: string;
  coverImage: string;
  excerpt: string;
  content: Document;
  results: {
    metric: string;
    value: string;
  }[];
}

export async function getCaseStudies(): Promise<CaseStudy[]> {
  const entries = await client.getEntries({
    content_type: 'caseStudy',
    order: ['-sys.createdAt'],
  });

  return entries.items.map((item: Entry) =>
    mapEntryFields<CaseStudy>(item, (fields, id) => ({
      id,
      title: fields.title as string,
      slug: fields.slug as string,
      company: fields.company as string,
      industry: fields.industry as string,
      logo: getAssetUrl(fields.logo),
      coverImage: getAssetUrl(fields.coverImage),
      excerpt: fields.excerpt as string,
      content: fields.content as Document,
      results: fields.results as Array<{ metric: string; value: string }>,
    }))
  );
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  const entries = await client.getEntries({
    content_type: 'caseStudy',
    'fields.slug': slug,
    limit: 1,
  });

  if (entries.items.length === 0) return null;

  return mapEntryFields<CaseStudy>(entries.items[0], (fields, id) => ({
    id,
    title: fields.title as string,
    slug: fields.slug as string,
    company: fields.company as string,
    industry: fields.industry as string,
    logo: getAssetUrl(fields.logo),
    coverImage: getAssetUrl(fields.coverImage),
    excerpt: fields.excerpt as string,
    content: fields.content as Document,
    results: fields.results as Array<{ metric: string; value: string }>,
  }));
}
