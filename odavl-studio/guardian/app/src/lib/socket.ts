import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export function initializeSocketIO(server: HTTPServer): Server {
    if (io) {
        return io;
    }

    io = new Server(server, {
        cors: {
            origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003',
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling']
    });

    io.on('connection', (socket: Socket) => {
        console.log(`[Socket.io] Client connected: ${socket.id}`);

        // Join project rooms for targeted notifications
        socket.on('join-project', (projectId: string) => {
            socket.join(`project:${projectId}`);
            console.log(`[Socket.io] Socket ${socket.id} joined project:${projectId}`);
        });

        socket.on('leave-project', (projectId: string) => {
            socket.leave(`project:${projectId}`);
            console.log(`[Socket.io] Socket ${socket.id} left project:${projectId}`);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket.io] Client disconnected: ${socket.id}`);
        });
    });

    return io;
}

export function getSocketIO(): Server | null {
    return io;
}

// Event emitters for real-time updates
export function emitTestUpdate(projectId: string, testRun: unknown): void {
    if (!io) return;
    io.to(`project:${projectId}`).emit('test:update', testRun);
}

export function emitMonitorUpdate(projectId: string, monitorCheck: unknown): void {
    if (!io) return;
    io.to(`project:${projectId}`).emit('monitor:update', monitorCheck);
}

export function emitAlert(alert: unknown): void {
    if (!io) return;
    io.emit('alert:new', alert);
}
