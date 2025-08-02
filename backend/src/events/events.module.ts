import { Module, forwardRef } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { EmailModule } from '../common/email/email.module';
import { UploadModule } from '../common/upload/upload.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    UploadModule,
    NotificationsModule,
    forwardRef(() => WebSocketModule),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
