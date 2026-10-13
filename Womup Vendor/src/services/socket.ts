import io, { Socket } from 'socket.io-client';
import { CollectionRequest } from '../types/vendor';

const getSocketUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://localhost:5050';
    }
  }
  return 'https://womup-app.onrender.com';
};

class VendorSocketService {
  private socket: Socket | null = null;
  private currentVendorId: string | null = null;

  connect(
    vendorId: string,
    onNewRequest: (req: CollectionRequest) => void,
    onRequestCancelled?: (requestId: string) => void,
  ) {
    this.currentVendorId = vendorId;
    if (this.socket) {
      this.socket.disconnect();
    }

    try {
      this.socket = io(`${getSocketUrl()}/tracking`, {
        transports: ['websocket', 'polling'],
        timeout: 8000,
      });

      this.socket.on('connect', () => {
        // Join vendor room using vendor ID / code
        this.socket?.emit('join_vendor', { vendorId });
        console.log(`[Vendor Socket] Connected and joined room: vendor_${vendorId}`);
      });

      this.socket.on('collection_request_received', (data: CollectionRequest) => {
        console.log('[Vendor Socket] Incoming real collection request:', data);
        onNewRequest(data);
      });

      this.socket.on('collection_request_cancelled', (payload: any) => {
        console.log('[Vendor Socket] Request cancelled:', payload);
        if (onRequestCancelled && payload?.requestId) {
          onRequestCancelled(payload.requestId);
        }
      });
    } catch (e) {
      console.warn('Socket connection error:', e);
    }
  }

  disconnect() {
    if (this.socket) {
      if (this.currentVendorId) {
        this.socket.emit('leave_vendor', { vendorId: this.currentVendorId });
      }
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const vendorSocket = new VendorSocketService();
