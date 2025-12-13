/**
 * Socket.IO Client Helper
 * Client-side WebSocket connection management
 */

'use client';

import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from './events';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketOptions {
  token: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

/**
 * Create authenticated Socket.IO client
 */
export function createSocketClient(options: SocketOptions): TypedSocket {
  const {
    token,
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001', {
    auth: { token },
    autoConnect,
    reconnection,
    reconnectionAttempts,
    reconnectionDelay,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  }) as TypedSocket;

  // Connection event handlers
  socket.on('connect', () => {
    console.log('[Socket] Connected to server');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    
    if (reason === 'io server disconnect') {
      // Server disconnected us, try to reconnect
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  return socket;
}

/**
 * Socket connection state
 */
export interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

/**
 * Get initial socket state
 */
export function getInitialSocketState(): SocketState {
  return {
    connected: false,
    connecting: false,
    error: null,
  };
}
