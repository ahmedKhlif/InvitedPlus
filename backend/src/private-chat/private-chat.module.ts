import { Module } from '@nestjs/common';
import { PrivateChatController } from './private-chat.controller';
import { PrivateChatService } from './private-chat.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { FriendsModule } from '../friends/friends.module';
import { UploadModule } from '../common/upload/upload.module';

@Module({
  imports: [PrismaModule, FriendsModule, UploadModule],
  controllers: [PrivateChatController],
  providers: [PrivateChatService],
  exports: [PrivateChatService],
})
export class PrivateChatModule {}
