import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'tracking',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TrackingGateway.name);

  constructor(
    @Optional()
    @InjectModel(ChatMessage.name)
    private readonly chatModel?: Model<ChatMessageDocument>,
  ) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to real-time tracking: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from tracking: ${client.id}`);
  }

  @SubscribeMessage('join_order')
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const orderId = typeof payload === 'string' ? payload : payload?.orderId;
    if (orderId) {
      client.join(`order_${orderId}`);
      this.logger.log(`Client ${client.id} joined tracking room: order_${orderId}`);
      return { event: 'joined', orderId };
    }
    return { event: 'error', message: 'Missing orderId' };
  }

  @SubscribeMessage('leave_order')
  handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const orderId = typeof payload === 'string' ? payload : payload?.orderId;
    if (orderId) {
      client.leave(`order_${orderId}`);
      return { event: 'left', orderId };
    }
  }

  @SubscribeMessage('join_store')
  handleJoinStore(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const storeId = typeof payload === 'string' ? payload : payload?.storeId;
    if (storeId) {
      client.join(`store_${storeId}`);
      this.logger.log(`Client ${client.id} joined store room: store_${storeId}`);
      return { event: 'joined', storeId };
    }
    return { event: 'error', message: 'Missing storeId' };
  }

  @SubscribeMessage('leave_store')
  handleLeaveStore(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const storeId = typeof payload === 'string' ? payload : payload?.storeId;
    if (storeId) {
      client.leave(`store_${storeId}`);
      return { event: 'left', storeId };
    }
  }

  // Delivery partner updates GPS location
  @SubscribeMessage('update_delivery_location')
  handleLocationUpdate(
    @MessageBody()
    data: {
      orderId: string;
      partnerId: string;
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
    },
  ) {
    if (!data?.orderId) return;

    const payload = {
      orderId: data.orderId,
      partnerId: data.partnerId,
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      heading: data.heading,
      timestamp: new Date().toISOString(),
    };

    if (this.server) {
      // 1. Emit to customer tracking room
      this.server.to(`order_${data.orderId}`).emit('update_delivery_location', payload);
      this.server.to(`order_${data.orderId}`).emit('delivery.location.updated', payload);

      // 2. Broadcast to Admin Console live fleet
      this.server.emit('update_delivery_location', payload);
    }
  }

  // Broadcast new order to Admin Console, Rider Radar, and Store Hub
  broadcastNewOrder(order: any) {
    if (this.server) {
      const storeId = order.storeId?._id?.toString() || order.storeId?.toString();
      const payload = {
        orderId: order._id?.toString() || order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount: order.items?.length || 0,
        customerName: order.deliveryAddress?.label || 'Customer',
        address: order.deliveryAddress,
        storeId,
        items: order.items,
        createdAt: order.createdAt || new Date().toISOString(),
        order,
      };

      // Emit strictly to specific store room and admin console
      if (storeId) {
        this.server.to(`store_${storeId}`).emit('new_order', payload);
      }
      this.server.to('admin').emit('new_order', payload);
      this.logger.log(`[WebSocket] Dispatched new_order to store_${storeId}: ${order.orderNumber}`);
    }
  }

  // Notify store staff that delivery partner has arrived at counter
  notifyRiderAtStore(storeId: string, payload: any) {
    if (this.server) {
      const data = {
        ...payload,
        timestamp: new Date().toISOString(),
      };
      if (storeId) {
        this.server.to(`store_${storeId}`).emit('rider_at_store', data);
      }
      this.server.to('admin').emit('rider_at_store', data);
      this.logger.log(`[WebSocket] Notified rider_at_store for store_${storeId}`);
    }
  }

  // Server notifies order room and admin of status change
  notifyOrderStatus(orderId: string, status: string, additionalData: any = {}) {
    if (this.server) {
      const rawPartnerName =
        additionalData.partnerName ||
        additionalData.riderName ||
        additionalData.fullName ||
        '';
      const formattedName =
        rawPartnerName.toLowerCase() === 'darshanthanki'
          ? 'DARSHAN THANKI'
          : rawPartnerName;

      const partnerPhone =
        additionalData.partnerPhone ||
        additionalData.phoneNumber ||
        additionalData.phone ||
        '';
      const vehicleNumber = additionalData.vehicleNumber || 'GJ AE 2020';
      const partnerId = additionalData.partnerId || additionalData.riderId || '';

      const riderObj = {
        id: partnerId,
        _id: partnerId,
        name: formattedName,
        fullName: formattedName,
        phone: partnerPhone,
        phoneNumber: partnerPhone,
        vehicleNumber,
        rating: additionalData.rating || 5,
        location: additionalData.currentLocation || additionalData.location,
      };

      const payload = {
        orderId,
        status,
        ...additionalData,
        partnerName: formattedName,
        riderName: formattedName,
        rider: riderObj,
        partner: riderObj,
        deliveryPartner: riderObj,
        riderId: riderObj,
        timestamp: new Date().toISOString(),
      };

      // 1. Emit to customer's specific order room
      this.server.to(`order_${orderId}`).emit('order_status', payload);
      this.server.to(`order_${orderId}`).emit('order.status.updated', payload);
      this.server.to(`order_${orderId}`).emit('orderStatusUpdated', payload);
      this.server.to(`order_${orderId}`).emit('orderUpdate', payload);
      this.server.to(`order_${orderId}`).emit(`orderStatusUpdate_${orderId}`, payload);

      if (additionalData?.orderNumber) {
        const num = additionalData.orderNumber.toString();
        const clean = num.replace(/^#/, '');
        this.server.to(`order_${num}`).emit('order_status', payload);
        this.server.to(`order_${num}`).emit('order.status.updated', payload);
        this.server.to(`order_${num}`).emit('orderStatusUpdated', payload);
        this.server.to(`order_${num}`).emit('orderUpdate', payload);
        this.server.to(`order_${num}`).emit(`orderStatusUpdate_${num}`, payload);
        this.server.to(`order_${num}`).emit(`orderStatusUpdate_${clean}`, payload);

        this.server.to(`order_${clean}`).emit('order_status', payload);
        this.server.to(`order_${clean}`).emit('order.status.updated', payload);
        this.server.to(`order_${clean}`).emit('orderStatusUpdated', payload);
        this.server.to(`order_${clean}`).emit('orderUpdate', payload);
        this.server.to(`order_${clean}`).emit(`orderStatusUpdate_${clean}`, payload);
      }

      // 2. Emit globally to Admin Console Kanban, Rider Radar, and Customer App listeners
      this.server.emit('order_status', payload);
      this.server.emit('order.status.updated', payload);
      this.server.emit('orderStatusUpdated', payload);
      this.server.emit('orderUpdate', payload);
      this.server.emit(`orderStatusUpdate_${orderId}`, payload);
      if (additionalData?.orderNumber) {
        const clean = additionalData.orderNumber.toString().replace(/^#/, '');
        this.server.emit(`orderStatusUpdate_${clean}`, payload);
      }

      this.logger.log(`[WebSocket] Emitted order_status (${status}) for order: ${orderId} (${additionalData?.orderNumber || ''}) with rider: ${formattedName}`);
    }
  }

  // Broadcast low stock alerts to Admin Dashboard
  broadcastInventoryAlert(alert: any) {
    if (this.server) {
      this.server.emit('inventory_alert', {
        ...alert,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(`[WebSocket] Broadcasted inventory_alert: ${alert.productName || 'Item'}`);
    }
  }

  // Broadcast real-time stock update to Admin Dashboard
  broadcastInventoryUpdate(payload: {
    storeId: string;
    productId: string;
    productName?: string;
    availableQty?: number;
    reservedQty?: number;
    newAvailableStock?: number;
    newReservedStock?: number;
    soldQty?: number;
  }) {
    if (this.server) {
      const data = {
        ...payload,
        newAvailableStock: payload.newAvailableStock ?? payload.availableQty ?? 0,
        newReservedStock: payload.newReservedStock ?? payload.reservedQty ?? 0,
        timestamp: new Date().toISOString(),
      };
      this.server.emit('inventory_update', data);
      this.logger.log(`[WebSocket] Broadcasted inventory_update: product=${payload.productId} avail=${data.newAvailableStock} reserved=${data.newReservedStock}`);
    }
  }

  // Real-Time Chat Message Handler
  @SubscribeMessage('chat_send')
  async handleChatSend(
    @MessageBody()
    data: {
      orderId: string;
      senderId: string;
      senderRole?: string;
      senderName?: string;
      receiverId?: string;
      receiverRole?: string;
      message: string;
      attachmentUrl?: string;
    },
  ) {
    if (!data?.orderId || !data?.message) return;

    const cleanId = data.orderId.replace(/^#/, '');
    const now = new Date().toISOString();

    let savedId = `chat_${Date.now()}`;
    if (this.chatModel) {
      try {
        const doc = await this.chatModel.create({
          orderId: cleanId,
          senderId: data.senderId,
          senderRole: data.senderRole || 'CUSTOMER',
          senderName: data.senderName || (data.senderRole === 'RIDER' ? 'Delivery Partner' : 'Customer'),
          receiverId: data.receiverId || '',
          receiverRole: data.receiverRole || 'ALL',
          message: data.message.trim(),
          attachmentUrl: data.attachmentUrl || '',
          isRead: false,
        });
        savedId = doc._id.toString();
      } catch (err) {
        this.logger.error(`Error persisting chat message: ${err}`);
      }
    }

    const payload = {
      _id: savedId,
      orderId: cleanId,
      senderId: data.senderId,
      senderRole: data.senderRole || 'CUSTOMER',
      senderName: data.senderName || (data.senderRole === 'RIDER' ? 'Delivery Partner' : 'Customer'),
      receiverId: data.receiverId || '',
      receiverRole: data.receiverRole || 'ALL',
      message: data.message.trim(),
      attachmentUrl: data.attachmentUrl || '',
      isRead: false,
      createdAt: now,
    };

    this.broadcastChatMessage(cleanId, payload);
    return { event: 'sent', data: payload };
  }

  // Real-Time Typing Indicator Handler
  @SubscribeMessage('chat_typing')
  handleChatTyping(
    @MessageBody()
    data: {
      orderId: string;
      userId: string;
      userRole?: string;
      isTyping: boolean;
    },
  ) {
    if (!data?.orderId) return;
    const cleanId = data.orderId.replace(/^#/, '');

    if (this.server) {
      this.server.to(`order_${cleanId}`).emit('chat_typing_status', data);
      this.server.to(`order_${data.orderId}`).emit('chat_typing_status', data);
      this.server.to(`order_#${cleanId}`).emit('chat_typing_status', data);
    }
  }

  // Broadcast Chat Message to Rooms and Global Admin Listener
  broadcastChatMessage(orderId: string, payload: any) {
    if (this.server) {
      const cleanId = orderId.replace(/^#/, '');

      // Emit to rooms
      this.server.to(`order_${cleanId}`).emit('chat_receive', payload);
      this.server.to(`order_${orderId}`).emit('chat_receive', payload);
      this.server.to(`order_#${cleanId}`).emit('chat_receive', payload);

      // Global broadcast for Admin Console oversight
      this.server.emit('chat_receive', payload);

      this.logger.log(`[WebSocket] Broadcasted chat_receive for order ${cleanId}: from ${payload.senderRole} (${payload.senderName || payload.senderId})`);
    }
  }

  // Broadcast Staff/Store Shift status change to Admin Console & Store Hub
  broadcastStaffShiftChange(payload: {
    storeId: string;
    staffId?: string;
    isOnShift: boolean;
    staffOnShiftCount?: number;
    staffTotal?: number;
    isOnline?: boolean;
  }) {
    if (this.server) {
      const data = {
        ...payload,
        timestamp: new Date().toISOString(),
      };

      // 1. Global event for Admin Console
      this.server.emit('staff_shift_changed', data);
      this.server.emit('store_shift_update', data);

      // 2. Targeted store room
      if (payload.storeId) {
        this.server.to(`store_${payload.storeId}`).emit('staff_shift_changed', data);
        this.server.to(`store_${payload.storeId}`).emit('store_shift_update', data);
      }

      this.logger.log(
        `[WebSocket] Dispatched staff_shift_changed for store ${payload.storeId}: ${
          payload.isOnShift ? 'ON SHIFT' : 'OFF SHIFT'
        } (Active pickers: ${payload.staffOnShiftCount ?? 'N/A'})`
      );
    }
  }
}

