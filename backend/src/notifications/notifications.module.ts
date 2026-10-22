import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';
import { NotificationDispatcherService } from './dispatcher.service';
import { NotificationsController } from './notifications.controller';
import { TrackingModule } from '../tracking/tracking.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    TrackingModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationService,
    PushService,
    NotificationDispatcherService,
  ],
  exports: [
    NotificationService,
    PushService,
    NotificationDispatcherService,
  ],
})
export class NotificationsModule {}
