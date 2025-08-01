import { Module } from '@nestjs/common';
import { WhiteboardController } from './whiteboard.controller';
import { WhiteboardService } from './whiteboard.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { UploadModule } from '../common/upload/upload.module';

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [WhiteboardController],
  providers: [WhiteboardService],
  exports: [WhiteboardService],
})
export class WhiteboardModule {}
