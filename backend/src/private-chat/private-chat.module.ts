import { Module } from '@nestjs/common';
import { PrivateChatController } from './private-chat.controller';
import { PrivateChatService } from './private-chat.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { FriendsModule } from '../friends/friends.module';

@Module({
  imports: [PrismaModule, FriendsModule],
  controllers: [PrivateChatController],
  providers: [PrivateChatService],
  exports: [PrivateChatService],
})
export class PrivateChatModule {}
