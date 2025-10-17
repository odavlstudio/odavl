import React, { useState, useEffect } from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import Dashboard from '../views/Dashboard';
import Recipes from '../views/Recipes';
import Activity from '../views/Activity';
import Config from '../views/Config';
import Intelligence from '../views/Intelligence';
import Insights from '../views/Insights';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/recipes', label: 'Recipes' },
  { path: '/activity', label: 'Activity' },
  { path: '/config', label: 'Config' },
  { path: '/intelligence', label: 'AI Advisor' },
  { path: '/insights', label: 'Insights' },
];

const Layout: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<string[]>([]);
  const [active, setActive] = useState('');

  useEffect(() => {
    // Listen for workspace list from backend
    function handleMessage(event: MessageEvent) {
      // Only accept messages from VS Code webview
      if (event.origin !== 'null' && event.origin !== globalThis.origin) return;
      const msg = event.data;
      if (msg?.type === 'workspaceList') {
        setWorkspaces(msg.payload || []);
        if (!active && msg.payload?.length) setActive(msg.payload[0]);
      }
    }
    globalThis.addEventListener('message', handleMessage);
    // Request workspaces on mount
    const vscode = (globalThis as any).acquireVsCodeApi?.();
    if (vscode) {
      vscode.postMessage({ type: 'requestWorkspaces' });
    }
    return () => globalThis.removeEventListener('message', handleMessage);
  }, [active]);

  const handleSwitch = (ws: string) => {
    setActive(ws);
    const vscode = (globalThis as any).acquireVsCodeApi?.();
    if (vscode) {
      vscode.postMessage({ type: 'switchWorkspace', payload: ws });
    }
  };

  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 font-bold text-lg">ODAVL</div>
        <div className="px-4 pb-2">
          <label htmlFor="odavl-ws-select" className="block text-xs mb-1">Workspace</label>
          <select id="odavl-ws-select" className="w-full bg-gray-800 text-white rounded px-2 py-1" value={active} onChange={e => handleSwitch(e.target.value)}>
            {workspaces.map(ws => <option key={ws} value={ws}>{ws}</option>)}
          </select>
        </div>
        <nav className="flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }: { isActive: boolean }) =>
                `block px-4 py-2 hover:bg-gray-800 ${isActive ? 'bg-gray-800 font-semibold' : ''}`
              }
              end={item.path === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-gray-50 dark:bg-black overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/config" element={<Config />} />
          <Route path="/intelligence" element={<Intelligence />} />
          <Route path="/insights" element={<Insights />} />
        </Routes>
      </main>
    </div>
  );
};

export default Layout;
