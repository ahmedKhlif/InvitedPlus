import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { UploadModule } from '../common/upload/upload.module';

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
