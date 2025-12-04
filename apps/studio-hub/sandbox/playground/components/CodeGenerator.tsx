/**
 * CodeGenerator - Code examples for TypeScript, cURL, Python
 */

'use client';

interface Endpoint {
  name: string;
  method: 'GET' | 'POST';
  path: string;
}

interface CodeGeneratorProps {
  selectedProduct: 'insight' | 'autopilot' | 'guardian';
  selectedEndpoint: Endpoint;
  apiKey: string;
  requestBody: string;
  onCopy: (text: string) => void;
}

export function CodeGenerator({
  selectedProduct,
  selectedEndpoint,
  apiKey,
  requestBody,
  onCopy,
}: CodeGeneratorProps) {
  const generateCode = (language: 'typescript' | 'curl' | 'python') => {
    const endpoint = selectedEndpoint;

    if (language === 'typescript') {
      return `import { ODAVLClient } from '@odavl-studio/sdk';

const client = new ODAVLClient({
  apiKey: '${apiKey || 'YOUR_API_KEY'}'
});

${
  endpoint.method === 'POST'
    ? `const result = await client.${selectedProduct}.${endpoint.name.toLowerCase().replace(/\s+/g, '')}(${requestBody || '{}'}); `
    : `const result = await client.${selectedProduct}.${endpoint.name.toLowerCase().replace(/\s+/g, '')}(${requestBody || '{}'});`
}

console.log(result);`;
    }

    if (language === 'curl') {
      let url = `https://odavl.studio${endpoint.path}`;
      if (endpoint.method === 'GET' && requestBody) {
        try {
          const params = JSON.parse(requestBody);
          const query = new URLSearchParams(params).toString();
          url += `?${query}`;
        } catch {}
      }

      return `curl -X ${endpoint.method} '${url}' \\
  -H 'X-API-Key: ${apiKey || 'YOUR_API_KEY'}' \\
  -H 'Content-Type: application/json'${endpoint.method === 'POST' && requestBody ? ` \\\n  -d '${requestBody}'` : ''}`;
    }

    if (language === 'python') {
      return `import requests

response = requests.${endpoint.method.toLowerCase()}(
    'https://odavl.studio${endpoint.path}',
    headers={
        'X-API-Key': '${apiKey || 'YOUR_API_KEY'}',
        'Content-Type': 'application/json'
    }${endpoint.method === 'POST' && requestBody ? `,\n    json=${requestBody}` : ''}
)

print(response.json())`;
    }

    return '';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="font-semibold mb-4">Code Example</h2>
      <div className="flex gap-2 mb-4">
        {['typescript', 'curl', 'python'].map((lang) => (
          <button
            key={lang}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 transition"
            style={{ minHeight: '48px' }}
            onClick={() => {
              const code = generateCode(lang as any);
              onCopy(code);
            }}
          >
            Copy {lang.charAt(0).toUpperCase() + lang.slice(1)}
          </button>
        ))}
      </div>
      <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono">
        {generateCode('typescript')}
      </pre>
    </div>
  );
}
