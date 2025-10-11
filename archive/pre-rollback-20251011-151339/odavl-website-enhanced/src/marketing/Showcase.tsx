// ODAVL-WAVE-X9-INJECT: Showcase Component
// @odavl-governance: MARKETING-SAFE mode - Examples and case studies

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Note: Tabs component will be available after UI setup
import { Clock, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { SHOWCASE_ITEMS, SHOWCASE_CATEGORIES } from '../../config/marketing/showcase.data';

export function Showcase() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredItems = selectedCategory === 'All' 
    ? SHOWCASE_ITEMS 
    : SHOWCASE_ITEMS.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">ODAVL Showcase</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover how ODAVL transforms codebases across different projects. 
            Real examples of autonomous quality improvements.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          <Button
            variant={selectedCategory === 'All' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('All')}
          >
            All
          </Button>
          {SHOWCASE_CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Showcase Items */}
        <div className="grid gap-8">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{item.category}</Badge>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {item.metrics.timeToComplete}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {item.metrics.linesChanged} lines
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {item.metrics.warningsResolved} warnings
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      {item.metrics.errorsFixed} errors
                    </div>
                  </div>
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-4">{item.explanation}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Code Comparison */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Before</h4>
                    <div className="rounded-lg bg-muted p-4 overflow-x-auto">
                      <pre className="text-sm">
                        <code>{item.beforeCode}</code>
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 text-green-600">After</h4>
                    <div className="rounded-lg bg-muted p-4 overflow-x-auto">
                      <pre className="text-sm">
                        <code>{item.afterCode}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 p-8 bg-muted/30 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Ready to See ODAVL in Action?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Start improving your codebase today with autonomous quality enhancements.
          </p>
          <Button size="lg">
            Try ODAVL Now
          </Button>
        </div>
      </div>
    </div>
  );
}