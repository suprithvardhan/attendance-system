// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket;

// Only initialize socket on client side
if (typeof window !== 'undefined') {
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
  
  socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: true,
    timeout: 10000,
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (error: Error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('disconnect', (reason: string) => {
    console.log('Socket disconnected:', reason);
  });
} else {
  // Create a mock socket for SSR
  socket = {
    on: () => {},
    emit: () => {},
    connect: () => {},
    disconnect: () => {}
  } as Socket;
}

export default socket;