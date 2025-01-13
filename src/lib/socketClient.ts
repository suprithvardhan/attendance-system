import { io, Socket } from 'socket.io-client';

class SocketClient {
  private static instance: Socket | null = null;

  public static async getInstance(): Promise<Socket> {
    if (!SocketClient.instance && typeof window !== 'undefined') {
      try {
        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        
        SocketClient.instance = io(SOCKET_URL, {
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          autoConnect: true,
          timeout: 20000,
          transports: ['websocket', 'polling']
        });

        // Wait for connection
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Socket connection timeout'));
          }, 5000);

          SocketClient.instance!.on('connect', () => {
            clearTimeout(timeout);
            console.log('Socket connected successfully');
            resolve();
          });

          SocketClient.instance!.on('connect_error', (error) => {
            clearTimeout(timeout);
            console.error('Socket connection error:', error);
            reject(error);
          });
        });

        SocketClient.instance.on('disconnect', (reason: string) => {
          console.log('Socket disconnected:', reason);
        });
      } catch (error) {
        console.error('Socket initialization error:', error);
        return {
          on: () => {},
          emit: () => {},
          off: () => {},
          connect: () => {},
          disconnect: () => {}
        } as Socket;
      }
    }

    return SocketClient.instance || {
      on: () => {},
      emit: () => {},
      off: () => {},
      connect: () => {},
      disconnect: () => {}
    } as Socket;
  }

  public static disconnect(): void {
    if (SocketClient.instance) {
      SocketClient.instance.disconnect();
      SocketClient.instance = null;
    }
  }
}

export default SocketClient.getInstance; 