// odavl-studio/insight/cloud/components/dashboard-v2/DashboardBuilder.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Save, Share2, Undo, Redo } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface Widget {
  id: string;
  type: string;
  title: string;
  config: any;
}

interface DashboardBuilderProps {
  dashboardId: string;
  initialLayout?: Layout[];
  initialWidgets?: Widget[];
}

export function DashboardBuilder({
  dashboardId,
  initialLayout = [],
  initialWidgets = []
}: DashboardBuilderProps) {
  const [layout, setLayout] = useState<Layout[]>(initialLayout);
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);
  const [history, setHistory] = useState<Layout[][]>([initialLayout]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newLayout);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLayout(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLayout(history[historyIndex + 1]);
    }
  };

  const handleSave = async () => {
    // Save layout and widgets to backend
    console.log('Saving dashboard...', { layout, widgets });
  };

  const handleAddWidget = (type: string) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type,
      title: `New ${type}`,
      config: {}
    };

    const newLayoutItem: Layout = {
      i: newWidget.id,
      x: 0,
      y: Infinity, // Puts it at the bottom
      w: 4,
      h: 4,
      minW: 2,
      minH: 2
    };

    setWidgets([...widgets, newWidget]);
    setLayout([...layout, newLayoutItem]);
  };

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleUndo} disabled={historyIndex === 0}>
                <Undo className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleRedo} disabled={historyIndex === history.length - 1}>
                <Redo className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleAddWidget('chart')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Widget
              </Button>
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button size="sm" variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        isDraggable
        isResizable
      >
        {widgets.map((widget) => (
          <motion.div
            key={widget.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader className="drag-handle cursor-move">
                <CardTitle className="text-sm">{widget.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-full flex items-center justify-center text-gray-400">
                  {widget.type} widget
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </ResponsiveGridLayout>

      {widgets.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 text-gray-400"
        >
          <Plus className="w-12 h-12 mb-4" />
          <p>Click "Add Widget" to start building your dashboard</p>
        </motion.div>
      )}
    </div>
  );
}