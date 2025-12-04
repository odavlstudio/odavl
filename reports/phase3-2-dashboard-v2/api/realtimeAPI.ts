// odavl-studio/insight/cloud/app/api/dashboard/realtime/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

// Global socket.io instance
let io: SocketIOServer | undefined;

export function GET(request: NextRequest) {
  // WebSocket upgrade for real-time collaboration
  const { searchParams } = new URL(request.url);
  const dashboardId = searchParams.get('dashboardId');

  if (!dashboardId) {
    return NextResponse.json({ error: 'Dashboard ID required' }, { status: 400 });
  }

  // Initialize Socket.IO if not already done
  if (!io) {
    const httpServer = (global as any).httpServer as HTTPServer;
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-dashboard', (data) => {
        socket.join(`dashboard:${data.dashboardId}`);
        socket.to(`dashboard:${data.dashboardId}`).emit('user-joined', {
          userId: data.userId,
          userName: data.userName
        });
      });

      socket.on('cursor-move', (data) => {
        socket.to(`dashboard:${data.dashboardId}`).emit('cursor-update', {
          userId: data.userId,
          x: data.x,
          y: data.y
        });
      });

      socket.on('comment-add', (data) => {
        socket.to(`dashboard:${data.dashboardId}`).emit('comment-added', data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  return NextResponse.json({ message: 'WebSocket server ready' });
}