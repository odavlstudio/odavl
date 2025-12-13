'use client';

/**
 * Swagger UI Page
 * Interactive API documentation
 */

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ODAVL Insight Cloud API
          </h1>
          <p className="text-gray-600">
            Interactive API documentation powered by OpenAPI/Swagger
          </p>
        </div>

        <SwaggerUI
          url="/api/swagger"
          docExpansion="list"
          defaultModelsExpandDepth={1}
          defaultModelExpandDepth={1}
          displayRequestDuration={true}
          filter={true}
          showExtensions={true}
          showCommonExtensions={true}
          tryItOutEnabled={true}
        />
      </div>
    </div>
  );
}
