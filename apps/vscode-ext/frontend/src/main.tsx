
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// VS Code webview bridge
declare global {
  function acquireVsCodeApi(): any;
}
let vscode: any = undefined;
try {
  vscode = acquireVsCodeApi();
  vscode.postMessage({ type: 'ping' });
} catch { }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
