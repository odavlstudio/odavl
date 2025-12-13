/**
 * useSocket Hook
 * React hook for managing WebSocket connections
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createSocketClient, TypedSocket, getInitialSocketState, type SocketState } from '@/lib/socket/client';

interface UseSocketOptions {
  token: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

interface UseSocketReturn {
  socket: TypedSocket | null;
  state: SocketState;
  connect: () => void;
  disconnect: () => void;
  emit: <E extends keyof import('@/lib/socket/events').ClientToServerEvents>(
    event: E,
    ...args: Parameters<import('@/lib/socket/events').ClientToServerEvents[E]>
  ) => void;
}

/**
 * Hook for managing Socket.IO connection
 */
export function useSocket(options: UseSocketOptions): UseSocketReturn {
  const {
    token,
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [state, setState] = useState<SocketState>(getInitialSocketState());
  const socketRef = useRef<TypedSocket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!token) {
      setState({ connected: false, connecting: false, error: 'No token provided' });
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    const socket = createSocketClient({
      token,
      autoConnect,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      setState({ connected: true, connecting: false, error: null });
      onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      setState({ connected: false, connecting: false, error: reason });
      onDisconnect?.(reason);
    });

    socket.on('connect_error', (error) => {
      setState({ connected: false, connecting: false, error: error.message });
      onError?.(error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, autoConnect, onConnect, onDisconnect, onError]);

  // Manual connect
  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      setState(prev => ({ ...prev, connecting: true }));
      socketRef.current.connect();
    }
  }, []);

  // Manual disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  // Type-safe emit function
  const emit = useCallback<UseSocketReturn['emit']>(
    (event, ...args) => {
      if (socketRef.current?.connected) {
        (socketRef.current.emit as any)(event, ...args);
      } else {
        console.warn(`[Socket] Cannot emit "${event as string}": not connected`);
      }
    },
    []
  );

  return {
    socket: socketRef.current,
    state,
    connect,
    disconnect,
    emit,
  };
}
