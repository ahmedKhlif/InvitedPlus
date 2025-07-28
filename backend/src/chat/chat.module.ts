import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MessageReactionsService } from './message-reactions.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, UploadModule, NotificationsModule],
  controllers: [ChatController],
  providers: [ChatService, MessageReactionsService],
  exports: [ChatService, MessageReactionsService],
})
export class ChatModule {}
