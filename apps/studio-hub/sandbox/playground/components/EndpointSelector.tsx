/**
 * EndpointSelector - Product tabs and endpoint list
 */

'use client';

interface Endpoint {
  name: string;
  method: 'GET' | 'POST';
  path: string;
}

interface EndpointSelectorProps {
  selectedProduct: 'insight' | 'autopilot' | 'guardian';
  selectedEndpoint: Endpoint;
  endpoints: Record<string, Endpoint[]>;
  onProductChange: (product: 'insight' | 'autopilot' | 'guardian') => void;
  onEndpointChange: (endpoint: Endpoint) => void;
}

export function EndpointSelector({
  selectedProduct,
  selectedEndpoint,
  endpoints,
  onProductChange,
  onEndpointChange,
}: EndpointSelectorProps) {
  return (
    <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
      <h2 className="font-semibold mb-4">Endpoints</h2>

      {/* Product Tabs */}
      <div className="flex gap-2 mb-4">
        {(['insight', 'autopilot', 'guardian'] as const).map((product) => (
          <button
            key={product}
            onClick={() => onProductChange(product)}
            className={`px-5 py-3 rounded text-base font-medium transition ${
              selectedProduct === product
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{ minHeight: '48px' }}
          >
            {product.charAt(0).toUpperCase() + product.slice(1)}
          </button>
        ))}
      </div>

      {/* Endpoint List */}
      <div className="space-y-2">
        {endpoints[selectedProduct].map((endpoint) => (
          <button
            key={endpoint.path}
            onClick={() => onEndpointChange(endpoint)}
            className={`w-full text-left p-3 rounded transition ${
              selectedEndpoint.path === endpoint.path
                ? 'bg-blue-50 border-2 border-blue-500'
                : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded ${
                  endpoint.method === 'GET'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                {endpoint.method}
              </span>
              <span className="font-medium text-sm">{endpoint.name}</span>
            </div>
            <p className="text-xs text-gray-500 font-mono">{endpoint.path}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
