import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { InvitesModule } from './invites/invites.module';
import { TasksModule } from './tasks/tasks.module';
import { ChatModule } from './chat/chat.module';
import { PollsModule } from './polls/polls.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadModule } from './common/upload/upload.module';
import { UsersModule } from './users/users.module';
import { FriendsModule } from './friends/friends.module';
import { PrivateChatModule } from './private-chat/private-chat.module';
import { WhiteboardModule } from './whiteboard/whiteboard.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),

    // Static file serving for uploads
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    
    // Database
    PrismaModule,
    
    // Feature modules
    AuthModule,
    EventsModule,
    InvitesModule,
    TasksModule,
    ChatModule,
    PollsModule,
    AdminModule,
    NotificationsModule,
    UploadModule,
    UsersModule,
    FriendsModule,
    PrivateChatModule,
    WhiteboardModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
