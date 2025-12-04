'use client';

import { useState } from 'react';
import ProductCard from '../components/ProductCard';
import Toast from '../components/Toast';

interface ProductData {
  name: string;
  type: string;
  path: string;
  readinessScore: number;
  status: 'ready' | 'blocked' | 'unstable';
  issues: { critical: number; high: number; medium: number; low: number };
  autoFixableCount: number;
  issueDetails?: Array<{
    id: string;
    severity: string;
    category: string;
    message: string;
    file?: string;
    autoFixable: boolean;
    impact: string;
  }>;
}

interface ScanResponse {
  success: boolean;
  summary: {
    totalProducts: number;
    readyCount: number;
    unstableCount: number;
    blockedCount: number;
    totalAutoFixable: number;
  };
  products: ProductData[];
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function LaunchCenterPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanningProduct] = useState<string | null>(null);
  const [fixing, setFixingProduct] = useState<string | null>(null);
  const [fixingAll, setFixingAll] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [summary, setSummary] = useState({
    readyCount: 0,
    unstableCount: 0,
    blockedCount: 0,
    totalAutoFixable: 0,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const handleScanWorkspace = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/launch/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data: ScanResponse = await response.json();

      if (data.success) {
        setProducts(data.products);
        setSummary(data.summary);
        showToast(
          `Scan complete! Found ${data.products.length} products (${data.summary.totalAutoFixable} auto-fixable issues)`,
          'success'
        );
      } else {
        showToast('Scan failed. Please try again.', 'error');
      }
    } catch {
      showToast('Network error. Please check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleScanProduct = async (productPath: string) => {
    setScanningProduct(productPath);
    try {
      const response = await fetch('/api/launch/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspacePath: productPath }),
      });

      const data: ScanResponse = await response.json();

      if (data.success && data.products.length > 0) {
        // Update this product in the list
        setProducts((prev) =>
          prev.map((p) => (p.path === productPath ? data.products[0] : p))
        );
        showToast(`Product re-scanned successfully`, 'success');
      } else {
        showToast('Product scan failed', 'error');
      }
    } catch {
      showToast('Network error during scan', 'error');
    } finally {
      setScanningProduct(null);
    }
  };

  const handleFixProduct = async (productPath: string, productType: string) => {
    setFixingProduct(productPath);
    try {
      const response = await fetch('/api/launch/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productPath, productType }),
      });

      const data = await response.json();

      if (data.success) {
        // Update product with new status
        const { after, improvement } = data.result;
        setProducts((prev) =>
          prev.map((p) =>
            p.path === productPath
              ? {
                  ...p,
                  readinessScore: after.readinessScore,
                  status: after.status,
                  issues: after.issues,
                  autoFixableCount: 0, // All auto-fixable issues should be fixed
                }
              : p
          )
        );

        // Re-calculate summary
        const updatedProducts = products.map((p) =>
          p.path === productPath
            ? { ...p, readinessScore: after.readinessScore, status: after.status }
            : p
        );
        setSummary({
          readyCount: updatedProducts.filter((p) => p.status === 'ready').length,
          unstableCount: updatedProducts.filter((p) => p.status === 'unstable').length,
          blockedCount: updatedProducts.filter((p) => p.status === 'blocked').length,
          totalAutoFixable: updatedProducts.reduce((sum, p) => sum + p.autoFixableCount, 0),
        });

        showToast(
          `Fixed ${improvement.issuesFixed} issues! Readiness: ${improvement.readinessChange > 0 ? '+' : ''}${improvement.readinessChange}%`,
          'success'
        );
      } else {
        showToast('Fix failed. Please try again.', 'error');
      }
    } catch {
      showToast('Network error during fix', 'error');
    } finally {
      setFixingProduct(null);
    }
  };

  const handleFixAll = async () => {
    const fixableProducts = products.filter((p) => p.autoFixableCount > 0);
    
    if (fixableProducts.length === 0) {
      showToast('No auto-fixable issues found', 'warning');
      return;
    }

    setFixingAll(true);
    let successCount = 0;
    let failCount = 0;

    for (const product of fixableProducts) {
      try {
        const response = await fetch('/api/launch/fix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productPath: product.path, productType: product.type }),
        });

        const data = await response.json();

        if (data.success) {
          successCount++;
          const { after } = data.result;
          setProducts((prev) =>
            prev.map((p) =>
              p.path === product.path
                ? {
                    ...p,
                    readinessScore: after.readinessScore,
                    status: after.status,
                    issues: after.issues,
                    autoFixableCount: 0,
                  }
                : p
            )
          );
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setFixingAll(false);
    
    if (successCount > 0) {
      showToast(
        `Fixed ${successCount} products successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        failCount > 0 ? 'warning' : 'success'
      );
    } else {
      showToast('All fixes failed. Please try again.', 'error');
    }

    // Re-scan to update summary
    handleScanWorkspace();
  };

  const handleExportReport = () => {
    if (products.length === 0) {
      showToast('No data to export. Please scan workspace first.', 'warning');
      return;
    }

    const report = {
      timestamp: new Date().toISOString(),
      workspace: 'c:\\Users\\sabou\\dev\\odavl',
      summary: {
        total: products.length,
        ready: summary.readyCount,
        unstable: summary.unstableCount,
        blocked: summary.blockedCount,
        autoFixable: summary.totalAutoFixable,
      },
      products: products.map((p) => ({
        name: p.name,
        type: p.type,
        path: p.path,
        readinessScore: p.readinessScore,
        status: p.status,
        issues: p.issues,
        autoFixableCount: p.autoFixableCount,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guardian-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Report exported successfully', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🛡️ Launch Center</h1>
          <p className="text-slate-400 text-lg">
            Validate your products before deployment
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800" role="status" aria-label="Ready products count">
            <div className="text-3xl font-bold text-green-500">{summary.readyCount}</div>
            <div className="text-slate-400 text-sm mt-1">Ready to Launch</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800" role="status" aria-label="Unstable products count">
            <div className="text-3xl font-bold text-yellow-500">{summary.unstableCount}</div>
            <div className="text-slate-400 text-sm mt-1">Needs Attention</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800" role="status" aria-label="Blocked products count">
            <div className="text-3xl font-bold text-red-500">{summary.blockedCount}</div>
            <div className="text-slate-400 text-sm mt-1">Blocked</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800" role="status" aria-label="Auto-fixable issues count">
            <div className="text-3xl font-bold text-blue-500">{summary.totalAutoFixable}</div>
            <div className="text-slate-400 text-sm mt-1">Auto-Fixable</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleScanWorkspace}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
            aria-label="Scan workspace for products"
          >
            {loading ? '⏳ Scanning...' : '🔍 Scan Workspace'}
          </button>
          <button
            className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
            disabled={summary.totalAutoFixable === 0 || fixingAll}
            onClick={handleFixAll}
            aria-label={`Fix all ${summary.totalAutoFixable} auto-fixable issues`}
          >
            {fixingAll
              ? '⏳ Fixing All...'
              : `🔧 Fix All Auto-Fixable (${summary.totalAutoFixable})`}
          </button>
          <button 
            className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
            onClick={handleExportReport}
            disabled={products.length === 0}
            aria-label="Export validation report as JSON"
          >
            📋 Export Report
          </button>
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">
            Products ({products.length})
          </h2>
          {products.length === 0 ? (
            <div className="bg-slate-900 rounded-lg p-8 border border-slate-800 text-center">
              <div className="text-slate-500 text-lg">
                Click "Scan Workspace" to detect products
              </div>
            </div>
          ) : (
            products.map((product, index) => (
              <ProductCard
                key={index}
                {...product}
                onScan={() => handleScanProduct(product.path)}
                onFix={() => handleFixProduct(product.path, product.type)}
                isScanning={scanning === product.path}
                isFixing={fixing === product.path}
              />
            ))
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
