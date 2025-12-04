/**
 * HTML Report Generator for ODAVL Insight
 * Generates interactive HTML reports with charts and filters
 */

export interface AnalysisResult {
  workspace: string;
  duration: number;
  totalIssues: number;
  timestamp: string;
  detectors: DetectorSummary[];
  issues: EnhancedIssue[];
}

export interface DetectorSummary {
  name: string;
  icon: string;
  count: number;
  severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface EnhancedIssue {
  detector: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export class HTMLReporter {
  generate(result: AnalysisResult): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ODAVL Insight Report - ${result.workspace}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    
    .header .workspace {
      font-size: 1.2em;
      opacity: 0.9;
      font-weight: 300;
    }
    
    .header .meta {
      margin-top: 20px;
      font-size: 0.9em;
      opacity: 0.8;
    }
    
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
    }
    
    .card {
      background: white;
      border-radius: 8px;
      padding: 25px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    
    .card.critical {
      border-left: 4px solid #dc2626;
    }
    
    .card.high {
      border-left: 4px solid #ea580c;
    }
    
    .card.medium {
      border-left: 4px solid #eab308;
    }
    
    .card.low {
      border-left: 4px solid #3b82f6;
    }
    
    .card h3 {
      font-size: 1em;
      color: #666;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .card .count {
      font-size: 3em;
      font-weight: bold;
      color: #333;
    }
    
    .content {
      padding: 40px;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section h2 {
      font-size: 1.8em;
      margin-bottom: 20px;
      color: #667eea;
    }
    
    .chart-container {
      margin: 30px 0;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .filters {
      position: sticky;
      top: 0;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
      z-index: 100;
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }
    
    .filters input,
    .filters select {
      padding: 10px 15px;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      font-size: 1em;
      flex: 1;
      min-width: 200px;
    }
    
    .filters input:focus,
    .filters select:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .issue-list {
      display: grid;
      gap: 15px;
    }
    
    .issue {
      background: white;
      border-left: 4px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: all 0.2s;
    }
    
    .issue:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .issue.critical {
      border-left-color: #dc2626;
    }
    
    .issue.high {
      border-left-color: #ea580c;
    }
    
    .issue.medium {
      border-left-color: #eab308;
    }
    
    .issue.low {
      border-left-color: #3b82f6;
    }
    
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .priority-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .priority-badge.critical {
      background: #fee2e2;
      color: #dc2626;
    }
    
    .priority-badge.high {
      background: #ffedd5;
      color: #ea580c;
    }
    
    .priority-badge.medium {
      background: #fef3c7;
      color: #eab308;
    }
    
    .priority-badge.low {
      background: #dbeafe;
      color: #3b82f6;
    }
    
    .confidence {
      font-size: 0.9em;
      color: #666;
    }
    
    .issue-message {
      font-size: 1.1em;
      color: #333;
      margin: 10px 0;
      line-height: 1.5;
    }
    
    .issue-file {
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #666;
      background: #f3f4f6;
      padding: 8px 12px;
      border-radius: 4px;
      margin: 10px 0;
    }
    
    .issue-suggestion {
      background: #f0fdf4;
      border-left: 3px solid #22c55e;
      padding: 12px;
      border-radius: 4px;
      margin-top: 10px;
      font-size: 0.95em;
      color: #166534;
    }
    
    footer {
      background: #1f2937;
      color: white;
      text-align: center;
      padding: 30px;
      font-size: 0.9em;
    }
    
    .hidden {
      display: none !important;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧠 ODAVL Insight Report</h1>
      <div class="workspace">Workspace: ${result.workspace}</div>
      <div class="meta">
        Generated: ${result.timestamp} | Duration: ${result.duration}s | Total Issues: ${result.totalIssues}
      </div>
    </div>
    
    <div class="summary-cards">
      ${this.generateSummaryCards(result)}
    </div>
    
    <div class="content">
      <div class="section">
        <h2>📊 Issue Distribution</h2>
        <div class="chart-container">
          <canvas id="severityChart" height="80"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="detectorChart" height="80"></canvas>
        </div>
      </div>
      
      <div class="section">
        <h2>🔍 Issues</h2>
        <div class="filters">
          <input type="text" id="searchInput" placeholder="🔎 Search issues...">
          <select id="severityFilter">
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select id="detectorFilter">
            <option value="all">All Detectors</option>
            ${result.detectors.map(d => `<option value="${d.name}">${d.icon} ${d.name}</option>`).join('')}
          </select>
        </div>
        
        <div class="issue-list" id="issueList">
          ${this.generateIssueList(result.issues)}
        </div>
      </div>
    </div>
    
    <footer>
      <p>Generated by <strong>ODAVL Insight v2.0</strong> 🧠</p>
      <p>Professional Code Analysis with Machine Learning</p>
    </footer>
  </div>
  
  <script>
    // Issue data
    const issues = ${JSON.stringify(result.issues)};
    
    // Charts
    const severityCtx = document.getElementById('severityChart').getContext('2d');
    const detectorCtx = document.getElementById('detectorChart').getContext('2d');
    
    const severityCounts = {
      critical: issues.filter(i => i.priority === 'critical').length,
      high: issues.filter(i => i.priority === 'high').length,
      medium: issues.filter(i => i.priority === 'medium').length,
      low: issues.filter(i => i.priority === 'low').length,
    };
    
    new Chart(severityCtx, {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{
          data: [severityCounts.critical, severityCounts.high, severityCounts.medium, severityCounts.low],
          backgroundColor: ['#dc2626', '#ea580c', '#eab308', '#3b82f6']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Issues by Severity',
            font: { size: 16 }
          }
        }
      }
    });
    
    const detectorCounts = {};
    ${result.detectors.map(d => `detectorCounts['${d.name}'] = ${d.count};`).join('\n    ')}
    
    new Chart(detectorCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(detectorCounts),
        datasets: [{
          label: 'Issues',
          data: Object.values(detectorCounts),
          backgroundColor: '#667eea'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Issues by Detector',
            font: { size: 16 }
          }
        }
      }
    });
    
    // Filtering
    const searchInput = document.getElementById('searchInput');
    const severityFilter = document.getElementById('severityFilter');
    const detectorFilter = document.getElementById('detectorFilter');
    
    function filterIssues() {
      const searchTerm = searchInput.value.toLowerCase();
      const severity = severityFilter.value;
      const detector = detectorFilter.value;
      
      document.querySelectorAll('.issue').forEach(issueEl => {
        const issueText = issueEl.textContent.toLowerCase();
        const issueSeverity = issueEl.dataset.severity;
        const issueDetector = issueEl.dataset.detector;
        
        const matchesSearch = searchTerm === '' || issueText.includes(searchTerm);
        const matchesSeverity = severity === 'all' || issueSeverity === severity;
        const matchesDetector = detector === 'all' || issueDetector === detector;
        
        if (matchesSearch && matchesSeverity && matchesDetector) {
          issueEl.classList.remove('hidden');
        } else {
          issueEl.classList.add('hidden');
        }
      });
    }
    
    searchInput.addEventListener('input', filterIssues);
    severityFilter.addEventListener('change', filterIssues);
    detectorFilter.addEventListener('change', filterIssues);
  </script>
</body>
</html>
    `;
    
    return html;
  }
  
  private generateSummaryCards(result: AnalysisResult): string {
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    
    result.issues.forEach(issue => {
      severityCounts[issue.priority]++;
    });
    
    return `
      <div class="card critical">
        <h3>🚨 Critical</h3>
        <div class="count">${severityCounts.critical}</div>
      </div>
      <div class="card high">
        <h3>⚠️ High</h3>
        <div class="count">${severityCounts.high}</div>
      </div>
      <div class="card medium">
        <h3>📊 Medium</h3>
        <div class="count">${severityCounts.medium}</div>
      </div>
      <div class="card low">
        <h3>ℹ️ Low</h3>
        <div class="count">${severityCounts.low}</div>
      </div>
    `;
  }
  
  private generateIssueList(issues: EnhancedIssue[]): string {
    return issues.slice(0, 50).map((issue, i) => `
      <div class="issue ${issue.priority}" data-severity="${issue.priority}" data-detector="${issue.detector}">
        <div class="issue-header">
          <span class="priority-badge ${issue.priority}">${issue.priority}</span>
          <span class="confidence">${issue.confidence}% confident</span>
        </div>
        <div class="issue-message">${this.escapeHtml(issue.message)}</div>
        ${issue.file ? `<div class="issue-file">📄 ${this.escapeHtml(issue.file)}${issue.line ? `:${issue.line}` : ''}</div>` : ''}
        ${issue.suggestion ? `<div class="issue-suggestion">💡 ${this.escapeHtml(issue.suggestion)}</div>` : ''}
      </div>
    `).join('');
  }
  
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}
