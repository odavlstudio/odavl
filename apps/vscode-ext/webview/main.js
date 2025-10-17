// Simple toast implementation
function showToast(msg) {
  let toast = document.getElementById('odavlToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'odavlToast';
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.right = '2rem';
    toast.style.background = '#222';
    toast.style.color = '#fff';
    toast.style.padding = '0.75rem 1.5rem';
    toast.style.borderRadius = '6px';
    toast.style.zIndex = 9999;
    toast.style.fontSize = '1rem';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2000);
}
/* eslint-env browser */
/* eslint-disable no-undef */
// ODAVL Webview bridge for VS Code extension
// Handles UI events and backend communication

const vscode = acquireVsCodeApi();

function send(type, payload) {
  vscode.postMessage({ type, ...payload });
}

// Example: wire up buttons (assume buttons with IDs exist in real UI)
document.addEventListener('DOMContentLoaded', () => {
  const runBtn = document.getElementById('runCycleBtn');
  if (runBtn) runBtn.onclick = () => send('runCycle');
  const verifyBtn = document.getElementById('verifyBtn');
  if (verifyBtn) verifyBtn.onclick = () => send('verify');
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) analyzeBtn.onclick = () => send('analyze');
  const learnBtn = document.getElementById('learnBtn');
  if (learnBtn) learnBtn.onclick = () => send('learn');
  const refreshBtn = document.getElementById('refreshIntelligenceBtn');
  if (refreshBtn) refreshBtn.onclick = () => send('refreshIntelligence');
});

// Listen for messages from extension
window.addEventListener('message', (e) => {
  const msg = e.data;
  if (msg.type === 'status') {
    // Update status bar, show toast, etc.
    updateStatus(msg.status, msg.data);
  }
  if (msg.type === 'update') {
    // Update UI with new data
    updateData(msg.payload);
  }
  if (msg.type === 'insightsReport' && msg.file) {
    showInsightsReport(msg.file);
  }
});
// Show a link to the latest Markdown report in the UI
function showInsightsReport(mdFile) {
  let insightsDiv = document.getElementById('insightsReport');
  if (!insightsDiv) {
    insightsDiv = document.createElement('div');
    insightsDiv.id = 'insightsReport';
    insightsDiv.style.marginTop = '1rem';
    document.getElementById('root').appendChild(insightsDiv);
  }
  // VS Code webview cannot open local files directly, so show the path and a copy button
  insightsDiv.innerHTML = `<b>Latest Report:</b> <code style="font-size:0.95em;">${mdFile}</code> <button id="copyReportPath">Copy Path</button>`;
  const copyBtn = document.getElementById('copyReportPath');
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(mdFile);
      showToast('Copied report path!');
    };
  }
}

function updateStatus(status, data) {
  const statusText = document.getElementById('statusText');
  if (statusText) {
    statusText.textContent = status + (data && data.phase ? ` (${data.phase})` : '');
  }
  // Show toast for phase transitions
  if (data && data.phase) {
    showToast(`Phase: ${data.phase}`);
  } else if (status === 'error') {
    showToast('❌ Error occurred');
  } else if (status === 'complete') {
    showToast('✅ ODAVL Cycle Complete');
  }
}

function updateData(payload) {
  // Show logs and results
  const logsContent = document.getElementById('logsContent');
  const resultsDiv = document.getElementById('results');
  if (logsContent && payload) {
    logsContent.textContent = JSON.stringify(payload, null, 2);
  }
  if (resultsDiv && payload && payload.learned) {
    resultsDiv.innerHTML = `<b>Learned:</b> <pre>${JSON.stringify(payload.learned, null, 2)}</pre>`;
  }
}
