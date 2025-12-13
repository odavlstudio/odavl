/**
 * Socket.IO Server Setup
 * Real-time WebSocket server with JWT authentication
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '@odavl-studio/auth';

export interface SocketUser {
  userId: string;
  email: string;
  name: string;
}

export interface AuthenticatedSocket extends Socket {
  user: SocketUser;
}

/**
 * Initialize Socket.IO server
 */
export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyToken(token);
      
      if (!decoded || typeof decoded === 'string') {
        return next(new Error('Invalid authentication token'));
      }

      // Attach user info to socket
      (socket as AuthenticatedSocket).user = {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name || 'Unknown',
      };

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const { userId, email, name } = authSocket.user;

    console.log(`[Socket] User connected: ${email} (${userId})`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Send welcome event
    socket.emit('connected', {
      message: 'Connected to ODAVL Studio',
      user: { userId, email, name },
      timestamp: new Date().toISOString(),
    });

    // Handle project room joins
    socket.on('project:join', (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`[Socket] User ${email} joined project ${projectId}`);
      
      // Notify other project members
      socket.to(`project:${projectId}`).emit('project:user:joined', {
        userId,
        email,
        name,
        projectId,
      });
    });

    // Handle project room leaves
    socket.on('project:leave', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      console.log(`[Socket] User ${email} left project ${projectId}`);
      
      // Notify other project members
      socket.to(`project:${projectId}`).emit('project:user:left', {
        userId,
        email,
        projectId,
      });
    });

    // Handle user presence updates
    socket.on('presence:update', (status: 'online' | 'away' | 'offline') => {
      // Get all rooms user is in
      const rooms = Array.from(socket.rooms).filter(
        room => room.startsWith('project:')
      );

      // Broadcast presence to all project rooms
      rooms.forEach(room => {
        socket.to(room).emit('presence:changed', {
          userId,
          email,
          status,
          timestamp: new Date().toISOString(),
        });
      });
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User disconnected: ${email} (${reason})`);

      // Get all project rooms user was in
      const rooms = Array.from(socket.rooms).filter(
        room => room.startsWith('project:')
      );

      // Notify project members of user leaving
      rooms.forEach(room => {
        io.to(room).emit('project:user:left', {
          userId,
          email,
          reason,
        });
      });

      // Broadcast offline status
      rooms.forEach(room => {
        io.to(room).emit('presence:changed', {
          userId,
          email,
          status: 'offline',
          timestamp: new Date().toISOString(),
        });
      });
    });

    // Error handler
    socket.on('error', (error) => {
      console.error(`[Socket] Error from ${email}:`, error);
    });
  });

  return io;
}

/**
 * Get Socket.IO instance (singleton)
 */
let ioInstance: SocketIOServer | null = null;

export function getSocketIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return ioInstance;
}

export function setSocketIO(io: SocketIOServer): void {
  ioInstance = io;
}
