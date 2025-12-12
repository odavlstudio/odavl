/**
 * Socket.io Server for Real-time Guardian Updates
 * Emits test progress, results, and status changes
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { logger } from '@odavl-studio/logger';

export interface TestProgressEvent {
  testId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
}

class GuardianSocketServer {
  private io: SocketServer | null = null;

  initialize(httpServer: HTTPServer): void {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info('Client connected to Guardian socket', { socketId: socket.id });

      socket.on('subscribe:test', (testId: string) => {
        socket.join(`test:${testId}`);
        logger.debug('Client subscribed to test updates', { testId, socketId: socket.id });
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected from Guardian socket', { socketId: socket.id });
      });
    });
  }

  emitTestProgress(testId: string, event: TestProgressEvent): void {
    if (!this.io) {
      logger.warn('Socket.io not initialized');
      return;
    }

    this.io.to(`test:${testId}`).emit('test:progress', event);
    logger.debug('Emitted test progress', { testId, status: event.status });
  }

  emitTestComplete(testId: string, result: unknown): void {
    if (!this.io) return;
    
    this.io.to(`test:${testId}`).emit('test:complete', result);
    logger.info('Test completed', { testId });
  }
}

export const guardianSocket = new GuardianSocketServer();
