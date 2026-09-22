import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import { TrackingGateway } from './tracking.gateway';

@Controller('api/v1/chat')
export class ChatController {
  constructor(
    @InjectModel(ChatMessage.name)
    private readonly chatModel: Model<ChatMessageDocument>,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  @Get(':orderId/history')
  async getChatHistory(@Param('orderId') orderId: string) {
    if (!orderId) {
      throw new BadRequestException('orderId is required');
    }

    const cleanId = orderId.replace(/^#/, '');
    const messages = await this.chatModel
      .find({
        $or: [{ orderId }, { orderId: cleanId }, { orderId: `#${cleanId}` }],
      })
      .sort({ createdAt: 1 })
      .limit(100)
      .exec();

    return {
      success: true,
      data: messages,
    };
  }

  @Post(':orderId/send')
  async sendMessage(
    @Param('orderId') orderId: string,
    @Body()
    body: {
      senderId: string;
      senderRole: string;
      senderName?: string;
      receiverId?: string;
      receiverRole?: string;
      message: string;
      attachmentUrl?: string;
    },
  ) {
    if (!orderId || !body.message || !body.senderId) {
      throw new BadRequestException('orderId, senderId, and message are required');
    }

    const cleanId = orderId.replace(/^#/, '');
    const chatDoc = await this.chatModel.create({
      orderId: cleanId,
      senderId: body.senderId,
      senderRole: body.senderRole || 'CUSTOMER',
      senderName: body.senderName || (body.senderRole === 'RIDER' ? 'Delivery Partner' : 'Customer'),
      receiverId: body.receiverId || '',
      receiverRole: body.receiverRole || 'ALL',
      message: body.message.trim(),
      attachmentUrl: body.attachmentUrl || '',
      isRead: false,
    });

    const payload = {
      _id: chatDoc._id.toString(),
      orderId: cleanId,
      senderId: chatDoc.senderId,
      senderRole: chatDoc.senderRole,
      senderName: chatDoc.senderName,
      receiverId: chatDoc.receiverId,
      receiverRole: chatDoc.receiverRole,
      message: chatDoc.message,
      attachmentUrl: chatDoc.attachmentUrl,
      isRead: chatDoc.isRead,
      createdAt: (chatDoc as any).createdAt || new Date().toISOString(),
    };

    // Broadcast via tracking gateway
    this.trackingGateway.broadcastChatMessage(cleanId, payload);

    return {
      success: true,
      data: payload,
    };
  }
}
