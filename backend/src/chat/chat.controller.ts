import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { MessageReactionsService } from './message-reactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageReactionsService: MessageReactionsService
  ) {}

  @Get('messages')
  @ApiOperation({ summary: 'Get chat messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  getMessages(
    @Query('eventId') eventId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;

    return this.chatService.getMessages(
      userId,
      eventId,
      {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
      }
    );
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a chat message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;

    return this.chatService.sendMessage(sendMessageDto, userId);
  }

  @Post('upload/image')
  @ApiOperation({ summary: 'Upload image for chat' })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.chatService.uploadChatMedia(file, 'image', userId);
  }

  @Post('upload/voice')
  @ApiOperation({ summary: 'Upload voice message for chat' })
  @ApiResponse({ status: 201, description: 'Voice message uploaded successfully' })
  @UseInterceptors(FileInterceptor('voice'))
  async uploadVoice(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.chatService.uploadChatMedia(file, 'voice', userId);
  }

  @Post('upload/file')
  @ApiOperation({ summary: 'Upload file for chat' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.chatService.uploadChatMedia(file, 'file', userId);
  }

  @Get('events/:eventId/messages')
  @ApiOperation({ summary: 'Get messages for specific event' })
  @ApiResponse({ status: 200, description: 'Event messages retrieved successfully' })
  getEventMessages(
    @Param('eventId') eventId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;

    return this.chatService.getEventMessages(
      eventId,
      userId,
      {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
      }
    );
  }

  @Post('messages/:messageId/react')
  @ApiOperation({ summary: 'Add reaction to message' })
  @ApiResponse({ status: 201, description: 'Reaction added successfully' })
  async addReaction(
    @Param('messageId') messageId: string,
    @Body() body: { emoji: string },
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.messageReactionsService.addReaction(messageId, userId, body.emoji);
  }

  @Get('messages/:messageId/reactions')
  @ApiOperation({ summary: 'Get message reactions' })
  @ApiResponse({ status: 200, description: 'Reactions retrieved successfully' })
  async getMessageReactions(@Param('messageId') messageId: string) {
    return this.messageReactionsService.getMessageReactions(messageId);
  }

  @Delete('messages/:messageId/react/:emoji')
  @ApiOperation({ summary: 'Remove reaction from message' })
  @ApiResponse({ status: 200, description: 'Reaction removed successfully' })
  async removeReaction(
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.messageReactionsService.removeReaction(messageId, userId, emoji);
  }

  @Get('popular-emojis')
  @ApiOperation({ summary: 'Get popular emojis' })
  @ApiResponse({ status: 200, description: 'Popular emojis retrieved successfully' })
  async getPopularEmojis() {
    return this.messageReactionsService.getPopularEmojis();
  }
}
