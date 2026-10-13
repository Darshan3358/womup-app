import { io, Socket } from 'socket.io-client';

const isLocalWeb =
  typeof window !== 'undefined' &&
  (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1');

const SOCKET_URL = isLocalWeb ? 'http://localhost:5050/tracking' : 'https://womup-app.onrender.com/tracking';

class StoreSocketService {
  private socket: Socket | null = null;
  private currentStoreId: string | null = null;

  connect(storeId?: string) {
    if (this.socket && this.socket.connected) {
      if (storeId && storeId !== this.currentStoreId) {
        this.joinStore(storeId);
      }
      return this.socket;
    }

    this.currentStoreId = storeId || null;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[StoreSocket] Connected to backend gateway. Socket ID:', this.socket?.id);
      if (this.currentStoreId) {
        this.joinStore(this.currentStoreId);
      }
    });

    this.socket.on('reconnect', () => {
      console.log('[StoreSocket] Reconnected to backend gateway.');
      if (this.currentStoreId) {
        this.joinStore(this.currentStoreId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[StoreSocket] Disconnected:', reason);
    });

    return this.socket;
  }

  joinStore(storeId: string) {
    if (!this.socket) return;
    const cleanId = String(storeId).trim();
    this.currentStoreId = cleanId;
    this.socket.emit('join_store', { storeId: cleanId });
    this.socket.emit('join_store', cleanId);
    console.log(`[StoreSocket] Subscribed to room: store_${cleanId}`);
  }

  leaveStore(storeId: string) {
    if (!this.socket) return;
    this.socket.emit('leave_store', { storeId });
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const storeSocket = new StoreSocketService();
