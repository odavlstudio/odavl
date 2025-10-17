import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Tabs } from '../components/ui/tabs';
import { Tooltip } from '../components/ui/tooltip';
import { Dialog } from '../components/ui/dialog';
import { Toast } from '../components/ui/toast';
import { Skeleton } from '../components/ui/skeleton';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';
import { StatusBar } from '../components/common/StatusBar';
import { ProgressIndicator } from '../components/common/ProgressIndicator';

export default function Preview() {
  const [selectValue, setSelectValue] = useState('option1');
  const [tab, setTab] = useState('tab1');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [progress, setProgress] = useState(40);

  return (
    <div className="flex h-screen">
      <Sidebar currentRoute="/preview" onNavigate={() => {}} />
      <div className="flex-1 flex flex-col">
        <Header title="Component Preview" actions={<Button onClick={() => setToastOpen(true)}>Show Toast</Button>} />
        <main className="flex-1 p-8 space-y-8 overflow-auto bg-background">
          <section>
            <h2 className="font-semibold mb-2">Button</h2>
            <div className="flex gap-4">
              <Button>Default</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="outline">Outline</Button>
              <Button loading>Loading</Button>
            </div>
          </section>
          <section>
            <h2 className="font-semibold mb-2">Input</h2>
            <Input placeholder="Type here..." />
          </section>
          <section>
            <h2 className="font-semibold mb-2">Select</h2>
            <Select
              value={selectValue}
              onValueChange={setSelectValue}
              options={[
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
                { value: 'option3', label: 'Option 3', disabled: true },
              ]}
              placeholder="Choose an option"
            />
          </section>
          <section>
            <h2 className="font-semibold mb-2">Tabs</h2>
            <Tabs
              tabs={[
                { value: 'tab1', label: 'Tab 1' },
                { value: 'tab2', label: 'Tab 2' },
              ]}
              value={tab}
              onValueChange={setTab}
            >
              <div>{tab === 'tab1' ? 'Tab 1 content' : 'Tab 2 content'}</div>
            </Tabs>
          </section>
          <section>
            <h2 className="font-semibold mb-2">Tooltip</h2>
            <Tooltip content="This is a tooltip">
              <Button>Hover me</Button>
            </Tooltip>
          </section>
          <section>
            <h2 className="font-semibold mb-2">Dialog</h2>
            <Button onClick={() => setDialogOpen(true)}>Open Dialog</Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Dialog Title" description="Dialog description." footer={<Button onClick={() => setDialogOpen(false)}>Close</Button>}>
              Dialog content goes here.
            </Dialog>
          </section>
          <section>
            <h2 className="font-semibold mb-2">Toast</h2>
            <Button onClick={() => setToastOpen(true)}>Show Toast</Button>
            <Toast open={toastOpen} onOpenChange={setToastOpen} title="Toast Title" description="Toast description." />
          </section>
          <section>
            <h2 className="font-semibold mb-2">Skeleton</h2>
            <div className="flex gap-4">
              <Skeleton className="w-32 h-8" />
              <Skeleton className="w-16 h-16" />
            </div>
          </section>
          <section>
            <h2 className="font-semibold mb-2">Card</h2>
            <Card>
              <div className="p-4">Card content</div>
            </Card>
          </section>
          <section>
            <h2 className="font-semibold mb-2">Progress Indicator</h2>
            <ProgressIndicator progress={progress} />
            <Button onClick={() => setProgress((p) => (p >= 100 ? 0 : p + 10))}>Increase</Button>
          </section>
        </main>
        <StatusBar left={<span>ODAVL Extension</span>} center={<span>Preview</span>} right={<span>v1.0.0</span>} />
      </div>
    </div>
  );
}
