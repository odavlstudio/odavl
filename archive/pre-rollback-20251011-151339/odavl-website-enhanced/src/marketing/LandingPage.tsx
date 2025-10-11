// ODAVL-WAVE-X9-INJECT: Landing Page Component
// @odavl-governance: MARKETING-SAFE mode - Hero landing page

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Code2, Zap, Shield, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: Code2,
    title: 'Autonomous Quality',
    description: 'AI-powered system continuously monitors and improves your codebase quality automatically.'
  },
  {
    icon: Zap, 
    title: 'Instant Fixes',
    description: 'Detect and resolve ESLint warnings, unused imports, and type errors in seconds.'
  },
  {
    icon: Shield,
    title: 'Safety First',
    description: 'Built-in safety constraints and verification ensure changes never break your code.'
  },
  {
    icon: TrendingUp,
    title: 'Continuous Learning',
    description: 'System learns from each improvement to make better decisions over time.'
  }
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background"></div>
        <div className="relative max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            Autonomous Code Quality Intelligence
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-blue-500 to-cyan-400 bg-clip-text text-transparent">
            Transform Your Codebase with AI-Powered Quality
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            ODAVL continuously monitors, analyzes, and fixes code quality issues automatically. 
            Experience the future of autonomous development today.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/docs/getting-started">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/showcase">View Examples</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose ODAVL?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for modern development teams who value quality, safety, and efficiency.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Improve Your Code Quality?</h2>
          <p className="text-muted-foreground mb-8">
            Join developers who trust ODAVL to maintain high-quality codebases automatically.
          </p>
          <Button size="lg" asChild>
            <Link href="/docs/installation">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}