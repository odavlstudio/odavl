
import { useEffect, useState, useRef } from 'react';
import { ProgressIndicator } from '../components/common/ProgressIndicator';
import { isTrustedMessage } from '../utils/isTrustedMessage';
import { toast } from "../components/ui/use-toast";

type DemoPhase = 'observe' | 'decide' | 'act' | 'verify' | 'learn' | 'complete' | null;

type DemoStatus = {
  phase: DemoPhase;
  progress: number;
  message: string;
  metrics?: Record<string, any>;
};

export default function Intelligence() {
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [cycleComplete, setCycleComplete] = useState(false);
  const lastPhase = useRef<DemoPhase>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!isTrustedMessage(event)) return;
      const { type, phase, progress, message, metrics } = event.data || {};
      if (type === 'demoStatus') {
        setShowDemo(true);
        setDemoStatus({ phase, progress, message, metrics });
        lastPhase.current = phase;
      } else if (type === 'cycleComplete') {
        setDemoStatus({ phase: 'complete', progress: 100, message: 'Demo cycle complete!', metrics });
        setCycleComplete(true);
        toast({
          title: "ODAVL Demo Complete!",
          description: "The simulated cycle finished successfully.",
          variant: "success"
        });
        // Notify VS Code to update the status bar
        window.parent.postMessage({ type: "updateStatusBar", data: { status: "Demo Complete" } }, "*");
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Animate reset after demo
  useEffect(() => {
    if (cycleComplete) {
      const timeout = setTimeout(() => {
        setShowDemo(false);
        setDemoStatus(null);
        setCycleComplete(false);
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [cycleComplete]);

  if (!showDemo || !demoStatus) {
    return <div className="p-8">Intelligence</div>;
  }

  return (
    <div className="p-8 flex flex-col items-center gap-6 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2">ODAVL Demo Mode</h2>
      <div className="w-full max-w-xl">
        <ProgressIndicator progress={demoStatus.progress} />
      </div>
      <div className="text-lg font-medium text-primary mt-2">
        {demoStatus.message}
      </div>
      <div className="w-full max-w-xl mt-4">
        {demoStatus.metrics && (
          <pre className="bg-muted rounded p-4 text-xs overflow-x-auto">
            {JSON.stringify(demoStatus.metrics, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
