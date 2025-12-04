'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { logger } from '@/lib/logger';
import { http } from '@/lib/utils/fetch';

export function ExportReports({ range }: { range: string }) {
  const [exporting, setExporting] = useState(false);

  async function handleExport(format: 'csv' | 'pdf') {
    setExporting(true);
    try {
      const response = await http.get(`/api/analytics/export?range=${range}&format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `odavl-analytics-${range}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logger.error('Export failed', error as Error);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        disabled={exporting}
        onClick={() => {
          const menu = document.getElementById('export-menu');
          menu?.classList.toggle('hidden');
        }}
      >
        <Download className="h-4 w-4 mr-2" />
        {exporting ? 'Exporting...' : 'Export'}
      </Button>
      <div
        id="export-menu"
        className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10"
      >
        <button
          className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg"
          onClick={() => handleExport('csv')}
        >
          Export as CSV
        </button>
        <button
          className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg"
          onClick={() => handleExport('pdf')}
        >
          Export as PDF
        </button>
      </div>
    </div>
  );
}
