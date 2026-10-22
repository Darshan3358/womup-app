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
import { Model, Types } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Store, StoreDocument } from '../stores/schemas/store.schema';

// Centralized real road distance calculation helper (OSRM + Haversine fallback)
async function calculateRealRoadDistance(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<{ distanceKm: number; durationMinutes: number }> {
  try {
    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), 1200);
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(tId);
    if (res.ok) {
      const json: any = await res.json();
      if (json.code === 'Ok' && json.routes?.[0]?.distance !== undefined) {
        const km = Number((json.routes[0].distance / 1000).toFixed(1));
        const mins = Math.max(1, Math.round((km / 22) * 60));
        return { distanceKm: km, durationMinutes: mins };
      }
    }
  } catch {}

  const R = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLon = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = Number((R * c * 1.25).toFixed(1));
  const mins = Math.max(1, Math.round((km / 20) * 60));
  return { distanceKm: km, durationMinutes: mins };
}

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
    @Optional()
    @InjectModel(Order.name)
    private readonly orderModel?: Model<OrderDocument>,
    @Optional()
    @InjectModel(Store.name)
    private readonly storeModel?: Model<StoreDocument>,
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
    const rawId = typeof payload === 'string' ? payload : (payload?.orderId || payload?.id);
    if (rawId) {
      const orderId = String(rawId);
      const cleanId = orderId.replace(/^#/, '');
      client.join(`order_${orderId}`);
      if (cleanId !== orderId) {
        client.join(`order_${cleanId}`);
      }
      this.logger.log(`Client ${client.id} joined tracking room: order_${orderId}`);
      return { event: 'joined', orderId };
    }
    return { event: 'error', message: 'Missing orderId' };
  }

  @SubscribeMessage('join_order_room')
  handleJoinOrderRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    return this.handleJoinOrder(client, payload);
  }

  @SubscribeMessage('leave_order')
  handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const rawId = typeof payload === 'string' ? payload : (payload?.orderId || payload?.id);
    if (rawId) {
      const orderId = String(rawId);
      const cleanId = orderId.replace(/^#/, '');
      client.leave(`order_${orderId}`);
      client.leave(`order_${cleanId}`);
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
      client.join(`store:${storeId}`);
      this.logger.log(`Client ${client.id} joined store room: store_${storeId} / store:${storeId}`);
      return { event: 'joined', storeId };
    }
    return { event: 'error', message: 'Missing storeId' };
  }

  // Hyperlocal Rider Hub geofencing: Riders join their assigned dark store hub room
  @SubscribeMessage('join_hub')
  @SubscribeMessage('register_rider')
  handleJoinHub(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const rawId = typeof payload === 'string' ? payload : (payload?.hubId || payload?.storeId || payload?.areaId);
    if (rawId) {
      const hubId = String(rawId);
      client.join(`store_${hubId}`);
      client.join(`store:${hubId}`);
      client.join(`hub_${hubId}`);
      this.logger.log(`[WebSocket] Rider ${client.id} joined hyperlocal rooms: store_${hubId}, hub_${hubId}`);
      return { event: 'joined_hub', hubId };
    }
    return { event: 'error', message: 'Missing hubId' };
  }

  @SubscribeMessage('leave_hub')
  handleLeaveHub(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const rawId = typeof payload === 'string' ? payload : (payload?.hubId || payload?.storeId || payload?.areaId);
    if (rawId) {
      const hubId = String(rawId);
      client.leave(`store_${hubId}`);
      client.leave(`store:${hubId}`);
      client.leave(`hub_${hubId}`);
      return { event: 'left_hub', hubId };
    }
  }

  @SubscribeMessage('leave_store')
  handleLeaveStore(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const storeId = typeof payload === 'string' ? payload : payload?.storeId;
    if (storeId) {
      client.leave(`store_${storeId}`);
      client.leave(`store:${storeId}`);
      return { event: 'left', storeId };
    }
  }

  // Cross-device synchronization rooms for User Cart & Wishlist & Customer Notifications
  @SubscribeMessage('join_user')
  handleJoinUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const userId = typeof payload === 'string' ? payload : (payload?.userId || payload?.id);
    if (userId) {
      client.join(`user_${userId}`);
      client.join(`user:${userId}`);
      this.logger.log(`Client ${client.id} joined user sync room: user_${userId} / user:${userId}`);
      return { event: 'joined', userId };
    }
    return { event: 'error', message: 'Missing userId' };
  }

  @SubscribeMessage('leave_user')
  handleLeaveUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const userId = typeof payload === 'string' ? payload : (payload?.userId || payload?.id);
    if (userId) {
      client.leave(`user_${userId}`);
      client.leave(`user:${userId}`);
      return { event: 'left', userId };
    }
  }

  // Scoped Room for Rider Personal Notifications
  @SubscribeMessage('join_rider')
  handleJoinRider(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const rawId = typeof payload === 'string' ? payload : (payload?.riderId || payload?.id);
    if (rawId) {
      const riderId = String(rawId);
      client.join(`rider_${riderId}`);
      client.join(`rider:${riderId}`);
      this.logger.log(`Client ${client.id} joined rider room: rider_${riderId} / rider:${riderId}`);
      return { event: 'joined', riderId };
    }
    return { event: 'error', message: 'Missing riderId' };
  }

  @SubscribeMessage('leave_rider')
  handleLeaveRider(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const rawId = typeof payload === 'string' ? payload : (payload?.riderId || payload?.id);
    if (rawId) {
      const riderId = String(rawId);
      client.leave(`rider_${riderId}`);
      client.leave(`rider:${riderId}`);
      return { event: 'left', riderId };
    }
  }

  // Scoped Room for Admin Console Notifications
  @SubscribeMessage('join_admin')
  handleJoinAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    client.join('admin');
    client.join('admin_room');
    this.logger.log(`Client ${client.id} joined admin notification rooms (admin / admin_room)`);
    return { event: 'joined_admin' };
  }

  @SubscribeMessage('leave_admin')
  handleLeaveAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    client.leave('admin');
    client.leave('admin_room');
    return { event: 'left_admin' };
  }

  // Real-time synchronization for Local Shop Vendors
  @SubscribeMessage('join_vendor')
  handleJoinVendor(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const rawId = typeof payload === 'string' ? payload : (payload?.vendorId || payload?.vendorCode || payload?.id);
    if (rawId) {
      const vendorId = String(rawId);
      client.join(`vendor_${vendorId}`);
      this.logger.log(`Client ${client.id} joined vendor room: vendor_${vendorId}`);
      return { event: 'joined', vendorId };
    }
    return { event: 'error', message: 'Missing vendorId' };
  }

  @SubscribeMessage('leave_vendor')
  handleLeaveVendor(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const rawId = typeof payload === 'string' ? payload : (payload?.vendorId || payload?.vendorCode || payload?.id);
    if (rawId) {
      const vendorId = String(rawId);
      client.leave(`vendor_${vendorId}`);
      return { event: 'left', vendorId };
    }
  }


  // Cross-device synchronization for Active Delivery Area & Store (Web <-> Mobile App)
  @SubscribeMessage('location_changed')
  @SubscribeMessage('set_location')
  handleLocationChanged(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const userId = payload?.userId;
    if (userId) {
      this.server?.to(`user_${userId}`).emit('location_updated', payload);
    }
    // Broadcast to all connected clients/tabs so Web and Mobile App sync instantly
    client.broadcast.emit('location_updated', payload);
    this.server?.emit('location_updated', payload);
    this.logger.log(`[WebSocket] Real-time location_updated broadcasted: ${payload?.areaName} -> ${payload?.storeName}`);
    return { event: 'location_synced', payload };
  }

  // Cross-device synchronization for Checkout Configuration (Payment, Tip, Instructions, Coins)
  @SubscribeMessage('checkout_changed')
  handleCheckoutChanged(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const userId = payload?.userId;
    if (userId) {
      this.server?.to(`user_${userId}`).emit('checkout_updated', payload);
    }
    client.broadcast.emit('checkout_updated', payload);
    this.server?.emit('checkout_updated', payload);
    this.logger.log(`[WebSocket] Real-time checkout_updated broadcasted: payment=${payload?.paymentMethod}, tip=${payload?.tip}, instr=${payload?.deliveryInstruction}`);
    return { event: 'checkout_synced', payload };
  }

  // Delivery partner updates GPS location
  @SubscribeMessage('update_delivery_location')
  @SubscribeMessage('location_updated')
  async handleLocationUpdate(
    @MessageBody()
    data: {
      orderId: string;
      partnerId?: string;
      latitude?: number;
      longitude?: number;
      lat?: number;
      lng?: number;
      speed?: number;
      heading?: number;
    },
  ) {
    if (!data?.orderId) return;

    const lat = data.lat ?? data.latitude;
    const lng = data.lng ?? data.longitude;

    // Strict validation: Reject missing or non-numeric coordinates without manufacturing fallbacks
    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180 ||
      (lat === 0 && lng === 0)
    ) {
      return;
    }

    const orderId = String(data.orderId);
    const cleanOrderId = orderId.replace(/^#/, '');

    let distToCustomer = 0;
    let distToStore = 0;
    let etaToCustomer = 0;
    let etaToStore = 0;

    try {
      if (this.orderModel) {
        const orderQuery: any = Types.ObjectId.isValid(cleanOrderId)
          ? { $or: [{ _id: new Types.ObjectId(cleanOrderId) }, { orderNumber: orderId }, { orderNumber: cleanOrderId }] }
          : { orderNumber: { $in: [orderId, cleanOrderId, `#${cleanOrderId}`] } };

        const order = await this.orderModel.findOne(orderQuery).populate('storeId').lean();

        if (order) {
          // Customer Coordinates
          const custCoords = order.deliveryAddress?.coordinates;
          if (Array.isArray(custCoords) && custCoords.length >= 2) {
            const custLng = custCoords[0];
            const custLat = custCoords[1];
            if (custLat && custLng) {
              const res = await calculateRealRoadDistance(lat, lng, custLat, custLng);
              distToCustomer = res.distanceKm;
              etaToCustomer = res.durationMinutes;
            }
          }

          // Store Coordinates
          const storeDoc: any = order.storeId;
          const storeCoords = storeDoc?.location?.coordinates;
          if (Array.isArray(storeCoords) && storeCoords.length >= 2) {
            const sLng = storeCoords[0];
            const sLat = storeCoords[1];
            if (sLat && sLng) {
              const res = await calculateRealRoadDistance(lat, lng, sLat, sLng);
              distToStore = res.distanceKm;
              etaToStore = res.durationMinutes;
            }
          }

          if (distToCustomer > 0) {
            await this.orderModel.updateOne(
              { _id: order._id },
              {
                $set: {
                  currentDistanceKm: Number(distToCustomer.toFixed(1)),
                  currentEtaMinutes: etaToCustomer,
                },
              },
            ).exec().catch(() => {});
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed computing road distance for order ${orderId}: ${err?.message}`);
    }

    const payload = {
      orderId,
      partnerId: data.partnerId || '',
      riderLocation: { lat, lng },
      latitude: lat,
      longitude: lng,
      lat,
      lng,
      distanceToCustomer: distToCustomer > 0 ? distToCustomer.toFixed(1) : undefined,
      distanceToStore: distToStore > 0 ? distToStore.toFixed(1) : undefined,
      distanceKm: distToCustomer > 0 ? Number(distToCustomer.toFixed(1)) : undefined,
      eta: etaToCustomer,
      etaMinutes: etaToCustomer,
      etaToCustomer,
      etaToStore,
      speed: typeof data.speed === 'number' ? data.speed : 0,
      heading: typeof data.heading === 'number' ? data.heading : 0,
      timestamp: new Date().toISOString(),
    };

    if (this.server) {
      // 1. Emit to customer tracking room (both orderId and cleanOrderId)
      this.server.to(`order_${orderId}`).emit('location_updated', payload);
      this.server.to(`order_${orderId}`).emit('rider_location_update', payload);
      this.server.to(`order_${orderId}`).emit('update_delivery_location', payload);
      this.server.to(`order_${orderId}`).emit('delivery.location.updated', payload);

      if (cleanOrderId !== orderId) {
        this.server.to(`order_${cleanOrderId}`).emit('location_updated', payload);
        this.server.to(`order_${cleanOrderId}`).emit('rider_location_update', payload);
        this.server.to(`order_${cleanOrderId}`).emit('update_delivery_location', payload);
        this.server.to(`order_${cleanOrderId}`).emit('delivery.location.updated', payload);
      }

      // 2. Broadcast to Admin Console, Dark Store App, Rider Radar and all connected apps
      this.server.emit('location_updated', payload);
      this.server.emit('rider_location_update', payload);
      this.server.emit('update_delivery_location', payload);
    }
  }

  @SubscribeMessage('update_rider_location')
  handleRiderLocation(
    @MessageBody()
    data: {
      orderId: string;
      partnerId?: string;
      riderId?: string;
      latitude?: number;
      longitude?: number;
      lat?: number;
      lng?: number;
      speed?: number;
      heading?: number;
    },
  ) {
    return this.handleLocationUpdate({
      orderId: data.orderId,
      partnerId: data.partnerId || data.riderId || '',
      latitude: data.latitude,
      longitude: data.longitude,
      lat: data.lat,
      lng: data.lng,
      speed: data.speed,
      heading: data.heading,
    });
  }

  @SubscribeMessage('rider_location_update')
  handleRiderLocationDirect(
    @MessageBody()
    data: any,
  ) {
    return this.handleLocationUpdate(data);
  }

  // Broadcast new order to Admin Console, Rider Radar, and Store Hub
  broadcastNewOrder(order: any) {
    if (this.server) {
      const storeId = order.storeId?._id?.toString() || order.storeId?.toString();
      const broadcastIds = (order.broadcastStoreIds || []).map((b: any) => b?._id?.toString() || b?.toString()).filter(Boolean);
      const payload = {
        orderId: order._id?.toString() || order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount: order.items?.length || 0,
        customerName: order.deliveryAddress?.label || 'Customer',
        address: order.deliveryAddress,
        storeId,
        broadcastStoreIds: broadcastIds,
        items: order.items,
        distanceKm: order.deliveryDistanceKm || order.distanceKm || 0,
        deliveryDistanceKm: order.deliveryDistanceKm || order.distanceKm || 0,
        deliveryFee: order.deliveryFee || 0,
        createdAt: order.createdAt || new Date().toISOString(),
        order,
      };

      // Emit to targeted store room, all broadcast candidate store rooms, and admin console
      // NOTE: global server.emit removed — it caused cross-store order leakage (SRS §13.1)
      if (storeId) {
        this.server.to(`store_${storeId}`).emit('new_order', payload);
        this.server.to(`store:${storeId}`).emit('new_order', payload);
      }
      for (const bId of broadcastIds) {
        if (bId !== storeId) {
          this.server.to(`store_${bId}`).emit('new_order', payload);
          this.server.to(`store:${bId}`).emit('new_order', payload);
        }
      }
      this.server.to('admin').emit('new_order', payload);
      this.logger.log(`[WebSocket] Dispatched new_order to stores [${Array.from(new Set([storeId, ...broadcastIds].filter(Boolean))).join(', ')}]: ${order.orderNumber}`);
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

      // Emit to user device room if userId is present
      if (additionalData?.userId) {
        const uId = additionalData.userId.toString();
        this.server.to(`user_${uId}`).emit('order_status', payload);
        this.server.to(`user_${uId}`).emit('order_status_updated', payload);
        this.server.to(`user_${uId}`).emit('order.status.updated', payload);
      }

      // 2. Emit to store room (scoped) + admin — no global broadcast to prevent cross-store leakage (SRS §13.1)
      const orderStoreId = additionalData?.storeId?.toString?.() || additionalData?.storeId;
      if (orderStoreId) {
        this.server.to(`store_${orderStoreId}`).emit('order_status', payload);
        this.server.to(`store_${orderStoreId}`).emit('order.status.updated', payload);
        this.server.to(`store_${orderStoreId}`).emit('orderStatusUpdated', payload);
      }
      this.server.to('admin').emit('order_status', payload);
      this.server.to('admin').emit('order.status.updated', payload);
      // Per-order room event aliases for backward compat (orderId-specific, not global)
      this.server.to(`order_${orderId}`).emit('orderUpdate', payload);
      this.server.to(`order_${orderId}`).emit(`orderStatusUpdate_${orderId}`, payload);
      if (additionalData?.orderNumber) {
        const clean = additionalData.orderNumber.toString().replace(/^#/, '');
        this.server.to(`order_${clean}`).emit(`orderStatusUpdate_${clean}`, payload);
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

  // Cross-device synchronization for Cart
  emitCartUpdated(userId: string, cartData: any) {
    if (this.server) {
      const payload = {
        userId: userId?.toString(),
        cart: cartData,
        timestamp: new Date().toISOString(),
      };
      // Targeted room for user's devices (Web, Mobile, Tablet)
      this.server.to(`user_${userId}`).emit('cart_updated', payload);
      // Also broadcast with userId metadata for universal listeners
      this.server.emit('cart_updated', payload);
      this.logger.log(`[WebSocket] Emitted cart_updated to room user_${userId}`);
    }
  }

  // Cross-device synchronization for Wishlist
  emitWishlistUpdated(userId: string, wishlistData: any) {
    if (this.server) {
      const payload = {
        userId: userId?.toString(),
        wishlist: wishlistData,
        timestamp: new Date().toISOString(),
      };
      // Targeted room for user's devices (Web, Mobile, Tablet)
      this.server.to(`user_${userId}`).emit('wishlist_updated', payload);
      // Also broadcast with userId metadata for universal listeners
      this.server.emit('wishlist_updated', payload);
      this.logger.log(`[WebSocket] Emitted wishlist_updated to room user_${userId}`);
    }
  }

  // Cross-device synchronization for Orders (Created / Placed)
  emitOrderCreated(userId: string, orderData: any) {
    if (this.server && userId) {
      const payload = {
        userId: userId.toString(),
        order: orderData,
        orderId: orderData?._id?.toString() || orderData?.id,
        orderNumber: orderData?.orderNumber,
        status: orderData?.status,
        timestamp: new Date().toISOString(),
      };
      // Targeted room for user's devices (Web, Mobile, Tablet)
      this.server.to(`user_${userId}`).emit('order_created', payload);
      this.server.to(`user_${userId}`).emit('order_placed', payload);
      this.server.emit('order_created', payload);
      this.logger.log(`[WebSocket] Emitted order_created to room user_${userId}: ${payload.orderNumber || payload.orderId}`);
    }
  }

  // Cross-device notification when order price was auto-adjusted due to store/area pricing
  emitOrderPriceAdjusted(userId: string, payload: {
    orderId: string;
    orderNumber?: string;
    priceAdjustments: any[];
    oldTotal?: number;
    newTotal?: number;
    storeName?: string;
  }) {
    if (this.server && userId) {
      const data = {
        userId: userId.toString(),
        ...payload,
        timestamp: new Date().toISOString(),
      };
      this.server.to(`user_${userId}`).emit('order_price_adjusted', data);
      this.server.to(`order_${payload.orderId}`).emit('order_price_adjusted', data);
      this.server.emit('order_price_adjusted', data);
      this.logger.log(`[WebSocket] Emitted order_price_adjusted to room user_${userId} for order ${payload.orderNumber || payload.orderId}`);
    }
  }

  // Cross-device synchronization for Order Status (Updated / Cancelled / Delivered)
  emitOrderStatusToUser(userId: string, orderId: string, status: string, orderData: any = {}) {
    if (this.server && userId) {
      const payload = {
        userId: userId.toString(),
        orderId: orderId?.toString(),
        status,
        ...orderData,
        timestamp: new Date().toISOString(),
      };
      this.server.to(`user_${userId}`).emit('order_status_updated', payload);
      this.server.to(`user_${userId}`).emit('order_status', payload);
      this.server.to(`order_${orderId}`).emit('order_status_updated', payload);
      this.server.to(`order_${orderId}`).emit('order_status', payload);
      this.logger.log(`[WebSocket] Emitted order_status_updated (${status}) to room user_${userId} for order ${orderId}`);
    }
  }

  // Cross-device synchronization for Shopping Coins, Income & Wallet
  emitWalletUpdated(userId: string, walletData: {
    shoppingCoins?: number;
    walletBalance?: number;
    pendingIncome?: number;
    availableIncome?: number;
    appDownloadIncome?: number;
    verificationStatus?: string;
    aadhaarVerified?: boolean;
    [key: string]: any;
  }) {
    if (this.server && userId) {
      const payload = {
        userId: userId.toString(),
        ...walletData,
        timestamp: new Date().toISOString(),
      };
      this.server.to(`user_${userId}`).emit('wallet_updated', payload);
      this.server.to(`user_${userId}`).emit('coins_updated', payload);
      this.logger.log(`[WebSocket] Emitted wallet_updated to room user_${userId}`);
    }
  }

  // Cross-device synchronization for User Profile
  emitProfileUpdated(userId: string, profileData: any) {
    if (this.server && userId) {
      const payload = {
        userId: userId.toString(),
        profile: profileData,
        timestamp: new Date().toISOString(),
      };
      this.server.to(`user_${userId}`).emit('profile_updated', payload);
      this.logger.log(`[WebSocket] Emitted profile_updated to room user_${userId}`);
    }
  }

  // Cross-device synchronization for User Settings (Privacy & Notifications)
  emitSettingsUpdated(userId: string, settings: any) {
    if (this.server && userId) {
      this.server.to(`user_${userId}`).emit('settings_updated', {
        userId: userId.toString(),
        settings,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(`[WebSocket] Emitted settings_updated to room user_${userId}`);
    }
  }

  // Cross-device synchronization for Payment Methods
  emitPaymentMethodsUpdated(userId: string, methods: any) {
    if (this.server && userId) {
      this.server.to(`user_${userId}`).emit('payment_methods_updated', {
        userId: userId.toString(),
        methods,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(`[WebSocket] Emitted payment_methods_updated to room user_${userId}`);
    }
  }

  // Cross-device synchronization for Gift Card Redemption
  emitGiftCardRedeemed(userId: string, payload: { code: string; amount: number; newWalletBalance: number }) {
    if (this.server && userId) {
      this.server.to(`user_${userId}`).emit('gift_card_redeemed', {
        userId: userId.toString(),
        ...payload,
        timestamp: new Date().toISOString(),
      });
      this.emitWalletUpdated(userId, { walletBalance: payload.newWalletBalance });
      this.logger.log(`[WebSocket] Emitted gift_card_redeemed to room user_${userId}: ₹${payload.amount}`);
    }
  }

  // Cross-device synchronization for Scratch Card Results
  emitScratchResult(userId: string, payload: { coinsEarned: number; newTotal: number; streak: number }) {
    if (this.server && userId) {
      this.server.to(`user_${userId}`).emit('scratch_result', {
        userId: userId.toString(),
        ...payload,
        timestamp: new Date().toISOString(),
      });
      this.emitWalletUpdated(userId, { shoppingCoins: payload.newTotal });
      this.logger.log(`[WebSocket] Emitted scratch_result to room user_${userId}: +${payload.coinsEarned} Coins`);
    }
  }

  // Cross-device synchronization for Rider Reviews
  emitRiderReviewSubmitted(riderId: string, payload: any) {
    if (this.server) {
      if (riderId) {
        this.server.to(`rider_${riderId}`).emit('rider_review_submitted', payload);
      }
      this.server.to('admin').emit('rider_review_submitted', payload);
      this.server.emit('rider_review_submitted', payload);
      if (payload.orderId) {
        this.server.to(`order_${payload.orderId}`).emit('order_reviewed', payload);
      }
      this.logger.log(`[WebSocket] Emitted rider_review_submitted for rider ${riderId}: ${payload.stars} stars`);
    }
  }

  emitReviewPromptRequested(customerId: string, payload: any) {
    if (this.server && customerId) {
      this.server.to(`user_${customerId}`).emit('review_prompt_requested', payload);
      if (payload.orderId) {
        this.server.to(`order_${payload.orderId}`).emit('review_prompt_requested', payload);
      }
      this.logger.log(`[WebSocket] Emitted review_prompt_requested to user_${customerId} for order ${payload.orderNumber}`);
    }
  }

  // Cross-device synchronization for Local Shop Vendor Collection Requests
  emitCollectionRequestToVendor(vendorId: string, payload: any) {
    if (this.server && vendorId) {
      this.server.to(`vendor_${vendorId}`).emit('collection_request_received', payload);
      this.logger.log(`[WebSocket] Emitted collection_request_received to room vendor_${vendorId}`);
    }
  }

  emitCollectionRequestCancelled(vendorId: string, payload: any) {
    if (this.server && vendorId) {
      this.server.to(`vendor_${vendorId}`).emit('collection_request_cancelled', payload);
      this.logger.log(`[WebSocket] Emitted collection_request_cancelled to room vendor_${vendorId}`);
    }
  }

  @SubscribeMessage('join_collection')
  handleJoinCollection(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const rawId = typeof payload === 'string' ? payload : (payload?.requestId || payload?.id);
    if (rawId) {
      const requestId = String(rawId);
      client.join(`collection_${requestId}`);
      this.logger.log(`Client ${client.id} joined collection room: collection_${requestId}`);
      return { event: 'joined', requestId };
    }
    return { event: 'error', message: 'Missing requestId' };
  }

  emitCollectionVerifiedToCustomer(customerId: string, payload: any) {
    if (this.server) {
      if (customerId) {
        this.server.to(`user_${customerId}`).emit('collection_verified', payload);
      }
      if (payload?.requestId) {
        this.server.to(`collection_${payload.requestId}`).emit('collection_verified', payload);
      }
      this.logger.log(`[WebSocket] Emitted collection_verified for request ${payload?.requestId}`);
    }
  }

  emitCollectionRejectedToCustomer(customerId: string, payload: any) {
    if (this.server) {
      if (customerId) {
        this.server.to(`user_${customerId}`).emit('collection_rejected', payload);
      }
      if (payload?.requestId) {
        this.server.to(`collection_${payload.requestId}`).emit('collection_rejected', payload);
      }
      this.logger.log(`[WebSocket] Emitted collection_rejected for request ${payload?.requestId}`);
    }
  }

  emitVendorStatusChanged(vendorId: string, payload: any) {
    if (this.server && vendorId) {
      this.server.to(`vendor_${vendorId}`).emit('vendor_status_changed', payload);
      this.server.emit('admin_vendor_status_changed', { vendorId, ...payload });
      this.logger.log(`[WebSocket] Emitted vendor_status_changed to vendor_${vendorId}`);
    }
  }

  emitCustomerKycApproved(userId: string, payload: any) {
    if (this.server && userId) {
      this.server.to(`user_${userId}`).emit('customer_kyc_approved', payload);
      this.server.to(`user_${userId}`).emit('kyc_approved', payload);
      this.server.emit('admin_customer_verified', { userId, ...payload });
      this.logger.log(`[WebSocket] Emitted customer_kyc_approved to user_${userId}`);
    }
  }

  emitVendorApproved(vendorId: string, payload: any) {
    if (this.server && vendorId) {
      this.server.to(`vendor_${vendorId}`).emit('vendor_approved', payload);
      this.server.emit('new_vendor_available', { vendorId, ...payload });
      this.logger.log(`[WebSocket] Emitted vendor_approved to vendor_${vendorId}`);
    }
  }

  emitStoreApproved(storeId: string, payload: any) {
    if (this.server && storeId) {
      this.server.to(`store_${storeId}`).emit('store_approved', payload);
      this.server.emit('new_store_available', { storeId, ...payload });
      this.logger.log(`[WebSocket] Emitted store_approved to store_${storeId}`);
    }
  }

  emitRiderApproved(riderId: string, payload: any) {
    if (this.server && riderId) {
      this.server.to(`rider_${riderId}`).emit('rider_approved', payload);
      this.server.emit('new_rider_available', { riderId, ...payload });
      this.logger.log(`[WebSocket] Emitted rider_approved to rider_${riderId}`);
    }
  }

  emitKycRejected(entityType: string, entityId: string, payload: any) {
    if (this.server && entityId) {
      const room = `${entityType}_${entityId}`;
      this.server.to(room).emit('kyc_rejected', payload);
      this.server.emit('admin_kyc_rejected', { entityType, entityId, ...payload });
      this.logger.log(`[WebSocket] Emitted kyc_rejected to ${room}`);
    }
  }

  emitScopedNotification(room: string, payload: any) {
    if (!this.server || !room) return;
    const data = {
      ...payload,
      id: payload.id || payload._id || `notif_${Date.now()}`,
      timestamp: payload.createdAt || new Date().toISOString(),
    };

    // 1. Primary unified notification:new event
    this.server.to(room).emit('notification:new', data);
    this.server.to(room).emit('in_app_notification', data);

    // 2. Also emit to complementary alias room (e.g. user:123 and user_123)
    if (room.includes(':')) {
      const alias = room.replace(':', '_');
      this.server.to(alias).emit('notification:new', data);
      this.server.to(alias).emit('in_app_notification', data);
    } else if (room.includes('_')) {
      const alias = room.replace('_', ':');
      this.server.to(alias).emit('notification:new', data);
      this.server.to(alias).emit('in_app_notification', data);
    }

    if (room === 'admin' || room === 'admin_room') {
      this.server.to('admin').emit('notification:new', data);
      this.server.to('admin_room').emit('notification:new', data);
      this.server.to('admin_room').emit('in_app_notification', data);
    }

    this.logger.log(`[WebSocket] Emitted scoped notification:new to [${room}]: "${payload.title}" (${payload.type || 'NOTICE'})`);
  }

  emitInAppNotification(userId: string, payload: any) {
    if (this.server && userId) {
      const data = {
        userId: userId.toString(),
        ...payload,
        id: payload.id || payload._id || `notif_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      // 1. Emit notification:new and in_app_notification to user personal rooms
      this.server.to(`user_${userId}`).emit('notification:new', data);
      this.server.to(`user:${userId}`).emit('notification:new', data);
      this.server.to(`user_${userId}`).emit('in_app_notification', data);
      this.server.to(`user_${userId}`).emit('notification', data);

      // 2. Emit specific event name if present
      if (payload.type) {
        const eventName = payload.type.toLowerCase();
        this.server.to(`user_${userId}`).emit(eventName, data);
      }

      // 3. Emit to role room if provided
      if (payload.role === 'ADMIN') {
        this.server.to('admin').emit('notification:new', data);
        this.server.to('admin_room').emit('notification:new', data);
        this.server.to('admin_room').emit('in_app_notification', data);
        this.server.emit('admin_notification', data);
      } else if (payload.role === 'VENDOR') {
        this.server.to(`vendor_${userId}`).emit('notification:new', data);
        this.server.to(`vendor:${userId}`).emit('notification:new', data);
      } else if (payload.role === 'STORE') {
        this.server.to(`store_${userId}`).emit('notification:new', data);
        this.server.to(`store:${userId}`).emit('notification:new', data);
      } else if (payload.role === 'RIDER') {
        this.server.to(`rider_${userId}`).emit('notification:new', data);
        this.server.to(`rider:${userId}`).emit('notification:new', data);
      }

      this.logger.log(`[WebSocket] Emitted notification to user_${userId}: "${payload.title}" (${payload.type || 'DEFAULT'})`);
    }
  }
}


