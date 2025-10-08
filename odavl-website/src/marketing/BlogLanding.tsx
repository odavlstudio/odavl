// ODAVL-WAVE-X9-INJECT: Blog Landing Component
// @odavl-governance: MARKETING-SAFE mode - Blog listing page

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { SAMPLE_POSTS, BLOG_CONFIG } from '../../config/marketing/blog.config';

export function BlogLanding() {
  const featuredPosts = SAMPLE_POSTS.filter(post => post.featured);
  const recentPosts = SAMPLE_POSTS.filter(post => !post.featured).slice(0, 3);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">ODAVL Blog</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Insights on autonomous code quality, AI-powered development tools, and best practices for maintainable software.
          </p>
        </div>

        {/* Featured Posts */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Featured Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPosts.map((post) => (
              <Card key={post.slug} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.publishedAt).toLocaleDateString()}
                    <Clock className="h-4 w-4 ml-2" />
                    {post.readingTime} min read
                  </div>
                  <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-3 mb-4">
                    {post.excerpt}
                  </CardDescription>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
                      <Link href={`/blog/${post.slug}`} className="flex items-center gap-1">
                        Read more <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Posts */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Recent Posts</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPosts.map((post) => (
              <Card key={post.slug} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.publishedAt).toLocaleDateString()}
                    <Clock className="h-4 w-4 ml-2" />
                    {post.readingTime} min read
                  </div>
                  <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-2 mb-4">
                    {post.excerpt}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section>
          <h2 className="text-2xl font-bold mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {BLOG_CONFIG.categories.map((category) => (
              <Button key={category} variant="outline" asChild className="h-auto py-3">
                <Link href={`/blog/category/${category.toLowerCase().replace(/\s+/g, '-')}`}>
                  {category}
                </Link>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}