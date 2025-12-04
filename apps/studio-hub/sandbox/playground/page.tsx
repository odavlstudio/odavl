/**
 * API Playground - Interactive Browser-Based Testing
 *
 * Allows developers to test API endpoints directly from the browser
 * with authentication, request/response inspection, and code generation.
 */

'use client';

export const dynamic = 'force-dynamic'; // Disable static generation

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { http } from '@/lib/utils/fetch';
import { EndpointSelector } from './components/EndpointSelector';
import { AuthenticationPanel } from './components/AuthenticationPanel';
import { RequestEditor } from './components/RequestEditor';
import { ResponseViewer } from './components/ResponseViewer';
import { CodeGenerator } from './components/CodeGenerator';

const API_ENDPOINTS = {
  insight: [
    { name: 'Get Issues', method: 'GET' as const, path: '/api/trpc/insight.getIssues' },
    { name: 'Get Issue', method: 'GET' as const, path: '/api/trpc/insight.getIssue' },
    { name: 'Analyze Project', method: 'POST' as const, path: '/api/trpc/insight.analyze' },
    { name: 'Resolve Issue', method: 'POST' as const, path: '/api/trpc/insight.resolveIssue' },
  ],
  autopilot: [
    { name: 'Run O-D-A-V-L', method: 'POST' as const, path: '/api/trpc/autopilot.run' },
    { name: 'Get Run', method: 'GET' as const, path: '/api/trpc/autopilot.getRun' },
    { name: 'Get Runs', method: 'GET' as const, path: '/api/trpc/autopilot.getRuns' },
    { name: 'Undo Run', method: 'POST' as const, path: '/api/trpc/autopilot.undo' },
  ],
  guardian: [
    { name: 'Run Test', method: 'POST' as const, path: '/api/trpc/guardian.runTest' },
    { name: 'Get Test', method: 'GET' as const, path: '/api/trpc/guardian.getTest' },
    { name: 'Get Tests', method: 'GET' as const, path: '/api/trpc/guardian.getTests' },
    { name: 'Update Gates', method: 'POST' as const, path: '/api/trpc/guardian.updateGates' },
  ],
};

const EXAMPLE_REQUESTS = {
  '/api/trpc/insight.getIssues': {
    method: 'GET',
    params: {
      projectId: 'proj_123',
      severity: 'high',
      limit: 50,
    },
  },
  '/api/trpc/insight.analyze': {
    method: 'POST',
    body: {
      projectId: 'proj_123',
      detectors: ['typescript', 'eslint', 'security'],
    },
  },
  '/api/trpc/autopilot.run': {
    method: 'POST',
    body: {
      projectId: 'proj_123',
      maxFiles: 10,
      maxLinesPerFile: 40,
      dryRun: false,
    },
  },
  '/api/trpc/guardian.runTest': {
    method: 'POST',
    body: {
      projectId: 'proj_123',
      url: 'https://staging.example.com',
      tests: ['accessibility', 'performance', 'security'],
    },
  },
};

export default function APIPlayground() {
  const [selectedProduct, setSelectedProduct] = useState<'insight' | 'autopilot' | 'guardian'>('insight');
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS.insight[0]);
  const [apiKey, setApiKey] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set metadata dynamically for client component
  useEffect(() => {
    document.title = 'API Playground - ODAVL Studio | Interactive API Testing';

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Test ODAVL Studio API endpoints directly in your browser. Explore Insight, Autopilot, and Guardian APIs with authentication, request/response inspection, and code generation.');

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://studio.odavl.com/playground');

    // Open Graph tags
    const ogTags = [
      { property: 'og:title', content: 'API Playground - ODAVL Studio' },
      { property: 'og:description', content: 'Test ODAVL APIs directly in your browser with authentication and code generation' },
      { property: 'og:url', content: 'https://studio.odavl.com/playground' },
      { property: 'og:image', content: 'https://studio.odavl.com/og-playground.png' },
      { property: 'og:type', content: 'website' },
    ];
    ogTags.forEach(({ property, content }) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });

    // Twitter Card tags
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'API Playground - ODAVL Studio' },
      { name: 'twitter:description', content: 'Interactive API testing for ODAVL Insight, Autopilot, and Guardian' },
      { name: 'twitter:image', content: 'https://studio.odavl.com/og-playground.png' },
    ];
    twitterTags.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });

    // Structured Data (JSON-LD)
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'ODAVL Studio API Playground',
      description: 'Interactive API testing platform for ODAVL Studio',
      url: 'https://studio.odavl.com/playground',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
    };
    let scriptTag = document.querySelector('script[type="application/ld+json"]');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(structuredData);
  }, []);

  const handleProductChange = (product: 'insight' | 'autopilot' | 'guardian') => {
    setSelectedProduct(product);
    handleEndpointChange(API_ENDPOINTS[product][0]);
  };

  const handleEndpointChange = (endpoint: typeof selectedEndpoint) => {
    setSelectedEndpoint(endpoint);

    // Load example request
    const example = EXAMPLE_REQUESTS[endpoint.path as keyof typeof EXAMPLE_REQUESTS];
    if (example) {
      if (endpoint.method === 'POST' && 'body' in example && example.body) {
        setRequestBody(JSON.stringify(example.body, null, 2));
      } else if (endpoint.method === 'GET' && 'params' in example && example.params) {
        setRequestBody(JSON.stringify(example.params, null, 2));
      }
    } else {
      setRequestBody('');
    }

    setResponse(null);
    setError(null);
  };

  const handleRun = async () => {
    if (!apiKey) {
      setError('API key required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let url = `https://odavl.studio${selectedEndpoint.path}`;
      let options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      };

      if (selectedEndpoint.method === 'GET' && requestBody) {
        const params = JSON.parse(requestBody);
        const query = new URLSearchParams(params).toString();
        url += `?${query}`;
      }

      const res = selectedEndpoint.method === 'POST' && requestBody
        ? await http.post(url, JSON.parse(requestBody), {
            headers: {
              'X-API-Key': apiKey,
              'Content-Type': 'application/json',
            },
          })
        : await http.get(url, {
            headers: {
              'X-API-Key': apiKey,
              'Content-Type': 'application/json',
            },
          });

      const data = await res.json();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: data,
      });
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">API Playground</h1>
          <p className="text-gray-600">Test API endpoints directly from your browser</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Endpoints */}
          <EndpointSelector
            selectedProduct={selectedProduct}
            selectedEndpoint={selectedEndpoint}
            endpoints={API_ENDPOINTS}
            onProductChange={handleProductChange}
            onEndpointChange={handleEndpointChange}
          />

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <AuthenticationPanel apiKey={apiKey} onApiKeyChange={setApiKey} />

            <RequestEditor
              requestBody={requestBody}
              loading={loading}
              apiKey={apiKey}
              selectedEndpointMethod={selectedEndpoint.method}
              onRequestBodyChange={setRequestBody}
              onRun={handleRun}
            />

            <ResponseViewer response={response} error={error} onCopy={copyToClipboard} />

            <CodeGenerator
              selectedProduct={selectedProduct}
              selectedEndpoint={selectedEndpoint}
              apiKey={apiKey}
              requestBody={requestBody}
              onCopy={copyToClipboard}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
