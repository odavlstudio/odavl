'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { http } from '@/lib/utils/fetch';

/**
 * Interactive API Documentation with Swagger UI
 *
 * Features:
 * - Interactive API explorer
 * - Try-it-out functionality
 * - Authentication support (JWT bearer tokens)
 * - Request/response examples
 * - Schema validation
 * - Code generation samples
 */
export default function APIDocsPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set metadata via useEffect for client component
    document.title = 'API Docs - ODAVL Studio | REST API Reference';

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Complete REST API documentation for ODAVL Studio platform. Integrate Insight (ML error detection), Autopilot (self-healing), and Guardian (quality testing) with detailed endpoints, authentication, examples, and interactive playground.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Complete REST API documentation for ODAVL Studio platform. Integrate Insight (ML error detection), Autopilot (self-healing), and Guardian (quality testing) with detailed endpoints, authentication, examples, and interactive playground.';
      document.head.appendChild(meta);
    }

    // Add Open Graph tags
    const ogTags = {
      'og:title': 'API Documentation - ODAVL Studio | Complete REST API Reference',
      'og:description': 'Complete REST API documentation for ODAVL Studio. Interactive explorer with authentication, examples, and schema validation for Insight, Autopilot, and Guardian APIs.',
      'og:url': 'https://studio.odavl.com/api-docs',
      'og:image': '/og-api-docs.png',
      'og:type': 'website'
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });

    // Add Twitter Card tags
    const twitterTags = {
      'twitter:card': 'summary_large_image',
      'twitter:title': 'API Documentation - ODAVL Studio',
      'twitter:description': 'Complete REST API documentation with interactive explorer',
      'twitter:image': '/og-api-docs.png'
    };

    Object.entries(twitterTags).forEach(([name, content]) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });

    // Add canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://studio.odavl.com/api-docs');

    async function loadSpec() {
      try {
        const response = await http.get('/api/openapi');

        if (!response.ok) {
          throw new Error('Failed to load API specification');
        }

        setSpec(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadSpec();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center mt-4 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 24px' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">ODAVL Studio API</h1>
          <p className="text-xl text-blue-100">
            Complete REST API documentation for integrating with ODAVL Studio platform
          </p>
          <div className="flex gap-4 mt-6">
            <a
              href="/api/openapi"
              download="openapi.json"
              className="inline-flex items-center justify-center px-6 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
              style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 24px' }}
            >
              Download OpenAPI Spec
            </a>
            <a
              href="/docs/getting-started"
              className="inline-flex items-center justify-center px-6 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium"
              style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 24px' }}
            >
              Getting Started Guide
            </a>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-6 text-sm">
            <a href="#insight" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium" style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 20px' }}>
              Insight API
            </a>
            <a href="#autopilot" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium" style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 20px' }}>
              Autopilot API
            </a>
            <a href="#guardian" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium" style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 20px' }}>
              Guardian API
            </a>
            <a href="#organizations" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium" style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 20px' }}>
              Organizations
            </a>
            <a href="#authentication" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium" style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 20px' }}>
              Authentication
            </a>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="max-w-7xl mx-auto">
        <SwaggerUI
          spec={spec || undefined}
          docExpansion="list"
          defaultModelsExpandDepth={1}
          defaultModelExpandDepth={1}
          displayOperationId={false}
          filter={true}
          showExtensions={true}
          showCommonExtensions={true}
          persistAuthorization={true}
          tryItOutEnabled={true}
          requestSnippetsEnabled={true}
          requestSnippets={{
            generators: {
              curl_bash: {
                title: 'cURL (bash)',
                syntax: 'bash',
              },
              curl_powershell: {
                title: 'cURL (PowerShell)',
                syntax: 'powershell',
              },
              curl_cmd: {
                title: 'cURL (CMD)',
                syntax: 'bash',
              },
            },
            defaultExpanded: true,
            languages: null,
          }}
        />
      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/docs" className="inline-flex items-center hover:text-blue-600" style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 0' }}>Documentation</a></li>
                <li><a href="/docs/tutorials" className="inline-flex items-center hover:text-blue-600" style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 0' }}>Tutorials</a></li>
                <li><a href="/docs/examples" className="inline-flex items-center hover:text-blue-600" style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 0' }}>Code Examples</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="https://github.com/odavl/studio/issues" className="inline-flex items-center hover:text-blue-600" style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 0' }}>GitHub Issues</a></li>
                <li><a href="https://discord.gg/odavl" className="inline-flex items-center hover:text-blue-600" style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 0' }}>Discord Community</a></li>
                <li><a href="mailto:support@odavl.com" className="inline-flex items-center hover:text-blue-600" style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 0' }}>Email Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/terms" className="inline-flex items-center hover:text-blue-600" style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 0' }}>Terms of Service</a></li>
                <li><a href="/privacy" className="inline-flex items-center hover:text-blue-600" style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 0' }}>Privacy Policy</a></li>
                <li><a href="/api-terms" className="inline-flex items-center hover:text-blue-600" style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 0' }}>API Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
            <p>© 2025 ODAVL Studio. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
