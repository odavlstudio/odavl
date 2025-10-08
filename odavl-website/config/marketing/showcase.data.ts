// ODAVL-WAVE-X9-INJECT: Showcase Data Configuration
// @odavl-governance: MARKETING-SAFE mode - Success stories and examples

export interface ShowcaseItem {
  id: string;
  title: string;
  description: string;
  category: 'TypeScript' | 'React' | 'Node.js' | 'ESLint' | 'General';
  metrics: {
    linesChanged: number;
    errorsFixed: number;
    warningsResolved: number;
    timeToComplete: string;
  };
  beforeCode: string;
  afterCode: string;
  explanation: string;
  tags: string[];
}

export const SHOWCASE_CATEGORIES = [
  'TypeScript',
  'React', 
  'Node.js',
  'ESLint',
  'General'
] as const;

export const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 'unused-imports-cleanup',
    title: 'Automatic Unused Imports Removal',
    description: 'ODAVL identifies and safely removes unused imports across TypeScript files',
    category: 'TypeScript',
    metrics: {
      linesChanged: 15,
      errorsFixed: 0,
      warningsResolved: 8,
      timeToComplete: '2.3 seconds'
    },
    beforeCode: `import React, { useState, useEffect, useMemo } from 'react';
import { formatDate, parseDate, validateEmail } from '../utils/helpers';
import { UserService } from '../services/user';
import { CONFIG } from '../config';

export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    UserService.getUser(userId).then(setUser);
  }, [userId]);
  
  return <div>{user?.name}</div>;
}`,
    afterCode: `import React, { useState, useEffect } from 'react';
import { UserService } from '../services/user';

export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    UserService.getUser(userId).then(setUser);
  }, [userId]);
  
  return <div>{user?.name}</div>;
}`,
    explanation: 'ODAVL detected 5 unused imports (useMemo, formatDate, parseDate, validateEmail, CONFIG) and removed them safely while preserving the working functionality.',
    tags: ['imports', 'cleanup', 'TypeScript', 'optimization']
  },
  {
    id: 'eslint-rules-fix',
    title: 'ESLint Warnings Resolution',
    description: 'Systematic resolution of ESLint warnings with safety verification',
    category: 'ESLint',
    metrics: {
      linesChanged: 8,
      errorsFixed: 0, 
      warningsResolved: 4,
      timeToComplete: '1.8 seconds'
    },
    beforeCode: `function processData(items) {
  var results = [];
  for (var i = 0; i < items.length; i++) {
    if (items[i].active == true) {
      results.push(items[i]);
    }
  }
  return results;
}`,
    afterCode: `function processData(items) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].active === true) {
      results.push(items[i]);
    }
  }
  return results;
}`,
    explanation: 'ODAVL applied ESLint auto-fixes: replaced var with const/let, changed == to === for strict equality, following modern JavaScript best practices.',
    tags: ['ESLint', 'best practices', 'modern JavaScript', 'auto-fix']
  }
];