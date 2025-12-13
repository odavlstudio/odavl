/**
 * useRealTimeAnalysis Hook
 * Real-time analysis progress tracking
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { TypedSocket } from '@/lib/socket/client';
import type {
  AnalysisStartedPayload,
  AnalysisProgressPayload,
  AnalysisCompletePayload,
  AnalysisErrorPayload,
} from '@/lib/socket/events';

interface AnalysisState {
  analysisId: string | null;
  projectId: string | null;
  status: 'idle' | 'running' | 'complete' | 'error' | 'cancelled';
  progress: number; // 0-100
  currentDetector: string | null;
  issuesFound: number;
  estimatedTimeRemaining: number | null; // seconds
  detectors: {
    name: string;
    status: 'pending' | 'running' | 'complete' | 'error';
    progress: number;
    issuesFound: number;
  }[];
  error: string | null;
}

interface UseRealTimeAnalysisOptions {
  socket: TypedSocket | null;
  projectId?: string;
  onComplete?: (data: AnalysisCompletePayload) => void;
  onError?: (error: string) => void;
}

/**
 * Create event handlers for real-time analysis
 */
function createAnalysisHandlers(
  projectId: string | undefined,
  setState: React.Dispatch<React.SetStateAction<AnalysisState>>,
  onComplete: ((data: AnalysisCompletePayload) => void) | undefined,
  onError: ((error: string) => void) | undefined
) {
  const handleStarted = (data: AnalysisStartedPayload) => {
    if (projectId && data.projectId !== projectId) return;

    setState({
      analysisId: data.analysisId,
      projectId: data.projectId,
      status: 'running',
      progress: 0,
      currentDetector: null,
      issuesFound: 0,
      estimatedTimeRemaining: null,
      detectors: data.detectors.map(name => ({
        name,
        status: 'pending',
        progress: 0,
        issuesFound: 0,
      })),
      error: null,
    });
  };

  const handleProgress = (data: AnalysisProgressPayload) => {
    if (projectId && data.projectId !== projectId) return;

    setState(prev => {
      const detectors = prev.detectors.map(d =>
        d.name === data.detector
          ? { ...d, status: data.status, progress: data.progress, issuesFound: data.issuesFound || 0 }
          : d
      );

      const totalProgress = detectors.reduce((sum, d) => sum + d.progress, 0);
      const overallProgress = Math.round(totalProgress / detectors.length);
      const totalIssues = detectors.reduce((sum, d) => sum + d.issuesFound, 0);

      return {
        ...prev,
        progress: overallProgress,
        currentDetector: data.detector,
        issuesFound: totalIssues,
        estimatedTimeRemaining: data.estimatedTimeRemaining || null,
        detectors,
      };
    });
  };

  const handleComplete = (data: AnalysisCompletePayload) => {
    if (projectId && data.projectId !== projectId) return;

    setState(prev => ({
      ...prev,
      status: 'complete',
      progress: 100,
      issuesFound: data.totalIssues,
      estimatedTimeRemaining: 0,
    }));

    onComplete?.(data);
  };

  const handleError = (data: AnalysisErrorPayload) => {
    if (projectId && data.projectId !== projectId) return;

    setState(prev => ({
      ...prev,
      status: 'error',
      error: data.error,
    }));

    onError?.(data.error);
  };

  const handleCancelled = () => {
    setState(prev => ({ ...prev, status: 'cancelled' }));
  };

  return { handleStarted, handleProgress, handleComplete, handleError, handleCancelled };
}

/**
 * Hook for tracking real-time analysis progress
 */
export function useRealTimeAnalysis(options: UseRealTimeAnalysisOptions) {
  const { socket, projectId, onComplete, onError } = options;

  const [state, setState] = useState<AnalysisState>({
    analysisId: null,
    projectId: null,
    status: 'idle',
    progress: 0,
    currentDetector: null,
    issuesFound: 0,
    estimatedTimeRemaining: null,
    detectors: [],
    error: null,
  });

  // Listen for analysis events
  useEffect(() => {
    if (!socket) return;

    const handlers = createAnalysisHandlers(projectId, setState, onComplete, onError);

    socket.on('analysis:started', handlers.handleStarted);
    socket.on('analysis:progress', handlers.handleProgress);
    socket.on('analysis:complete', handlers.handleComplete);
    socket.on('analysis:error', handlers.handleError);
    socket.on('analysis:cancelled', handlers.handleCancelled);

    return () => {
      socket.off('analysis:started', handlers.handleStarted);
      socket.off('analysis:progress', handlers.handleProgress);
      socket.off('analysis:complete', handlers.handleComplete);
      socket.off('analysis:error', handlers.handleError);
      socket.off('analysis:cancelled', handlers.handleCancelled);
    };
  }, [socket, projectId, onComplete, onError]);

  // Cancel analysis
  const cancelAnalysis = useCallback(() => {
    if (socket && state.analysisId) {
      socket.emit('analysis:cancel', state.analysisId);
    }
  }, [socket, state.analysisId]);

  return {
    ...state,
    cancelAnalysis,
  };
}
