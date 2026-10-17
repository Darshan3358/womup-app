import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrackingGateway } from './tracking.gateway';
import { ChatController } from './chat.controller';
import { TrackingController } from './tracking.controller';
import { ChatMessage, ChatMessageSchema } from './schemas/chat-message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
  ],
  controllers: [ChatController, TrackingController],
  providers: [TrackingGateway],
  exports: [TrackingGateway],
})
export class TrackingModule {}

