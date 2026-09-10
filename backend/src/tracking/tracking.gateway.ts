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
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'tracking',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TrackingGateway.name);

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
    @MessageBody('orderId') orderId: string,
  ) {
    client.join(`order_${orderId}`);
    this.logger.log(`Client ${client.id} joined tracking room: order_${orderId}`);
    return { event: 'joined', orderId };
  }

  @SubscribeMessage('leave_order')
  handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody('orderId') orderId: string,
  ) {
    client.leave(`order_${orderId}`);
    return { event: 'left', orderId };
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
    },
  ) {
    this.server.to(`order_${data.orderId}`).emit('delivery.location.updated', {
      orderId: data.orderId,
      partnerId: data.partnerId,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: new Date().toISOString(),
    });
  }

  // Server notifies room of status change
  notifyOrderStatus(orderId: string, status: string, additionalData: any = {}) {
    if (this.server) {
      this.server.to(`order_${orderId}`).emit('order.status.updated', {
        orderId,
        status,
        ...additionalData,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(`Emitted order.status.updated (${status}) for order: ${orderId}`);
    }
  }
}
