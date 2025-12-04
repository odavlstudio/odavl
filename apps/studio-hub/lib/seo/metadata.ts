import { Metadata } from 'next';

interface SEOConfig {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  authors?: string[];
}

export function generateSEOMetadata(config: SEOConfig): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://odavlstudio.com';
  const {
    title,
    description,
    image = `${baseUrl}/og-image.png`,
    url = baseUrl,
    type = 'website',
    publishedTime,
    authors,
  } = config;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'ODAVL Studio',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type,
      ...(publishedTime && { publishedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@odavlstudio',
    },
    ...(authors && { authors: authors.map((name) => ({ name })) }),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateBlogSEO(post: {
  title: string;
  excerpt: string;
  coverImage?: string;
  publishDate: string;
  author: { name: string };
  slug: string;
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://odavlstudio.com';
  
  return generateSEOMetadata({
    title: `${post.title} - ODAVL Studio Blog`,
    description: post.excerpt,
    image: post.coverImage ? `https:${post.coverImage}` : undefined,
    url: `${baseUrl}/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.publishDate,
    authors: [post.author.name],
  });
}

export function generateDocSEO(doc: {
  title: string;
  category: string;
  slug: string;
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://odavlstudio.com';
  
  return generateSEOMetadata({
    title: `${doc.title} - ODAVL Studio Documentation`,
    description: `Learn about ${doc.title} in the ${doc.category} category`,
    url: `${baseUrl}/docs/${doc.slug}`,
  });
}

export function generateCaseStudySEO(study: {
  title: string;
  company: string;
  excerpt: string;
  coverImage?: string;
  slug: string;
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://odavlstudio.com';
  
  return generateSEOMetadata({
    title: `${study.company} - ${study.title} | ODAVL Studio`,
    description: study.excerpt,
    image: study.coverImage ? `https:${study.coverImage}` : undefined,
    url: `${baseUrl}/case-studies/${study.slug}`,
  });
}
