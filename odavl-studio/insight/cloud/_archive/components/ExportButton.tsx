'use client';

/**
 * Export to PDF/CSV Component
 * Week 11 Day 3 - Dashboard V2 Polish
 * Simplified version for array data export
 */

import { Download, FileText, Table } from 'lucide-react';
import { useState } from 'react';

export function ExportButton({ data, filename = 'odavl-report' }: { data: any[]; filename?: string }) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      // Convert data to CSV
      if (data.length === 0) {
        alert('No data to export');
        return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map((row: any) =>
          headers.map(header => {
            const value = row[header];
            // Handle Date objects
            if (value instanceof Date) {
              return value.toISOString();
            }
            // Escape commas and quotes
            const strValue = String(value ?? '');
            return strValue.includes(',') || strValue.includes('"') 
              ? `"${strValue.replace(/"/g, '""')}"` 
              : strValue;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `${filename}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export to CSV failed:', error);
      alert('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    
    try {
      // @ts-ignore - jsPDF provides its own types but Next.js build struggles
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.text('ODAVL Export Report', 20, 20);

      // Timestamp
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);

      // Data table
      let y = 50;
      doc.setFontSize(12);
      
      const headers = Object.keys(data[0]);
      const maxRows = 20; // Limit for PDF readability
      const displayData = data.slice(0, maxRows);

      displayData.forEach((row: any, index: number) => {
        if (y > 270) { // New page if needed
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10);
        doc.text(`Row ${index + 1}:`, 20, y);
        y += 7;

        headers.forEach(header => {
          const value = row[header];
          const displayValue = value instanceof Date ? value.toLocaleDateString() : String(value ?? 'N/A');
          doc.setFontSize(8);
          doc.text(`  ${header}: ${displayValue}`, 20, y);
          y += 5;
        });

        y += 3;
      });

      if (data.length > maxRows) {
        doc.setFontSize(8);
        doc.text(`... and ${data.length - maxRows} more rows (see CSV for full data)`, 20, y);
      }

      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Export to PDF failed:', error);
      alert('Failed to export PDF. Please try CSV export instead.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => document.getElementById('export-menu')?.classList.toggle('hidden')}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isExporting}
      >
        <Download size={20} />
        {isExporting ? 'Exporting...' : 'Export'}
      </button>
      
      <div
        id="export-menu"
        className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-10"
      >
        <button
          onClick={() => {
            exportToPDF();
            document.getElementById('export-menu')?.classList.add('hidden');
          }}
          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
        >
          <FileText size={18} />
          <span>Export as PDF</span>
        </button>
        <button
          onClick={() => {
            exportToCSV();
            document.getElementById('export-menu')?.classList.add('hidden');
          }}
          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors border-t dark:border-gray-700"
        >
          <Table size={18} />
          <span>Export as CSV</span>
        </button>
      </div>
    </div>
  );
}
