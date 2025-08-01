import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrivateChatService } from './private-chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('private-chat')
@Controller('private-chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrivateChatController {
  constructor(private readonly privateChatService: PrivateChatService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send private message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @Request() req: any,
    @Body() body: {
      receiverId: string;
      content: string;
      messageType?: string;
      fileUrl?: string;
      fileName?: string;
    }
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.privateChatService.sendMessage(
      userId,
      body.receiverId,
      body.content,
      body.messageType,
      body.fileUrl,
      body.fileName
    );
  }

  @Get('conversation/:userId')
  @ApiOperation({ summary: 'Get conversation with user' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
  async getConversation(
    @Request() req: any,
    @Param('userId') otherUserId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50'
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.privateChatService.getConversation(
      userId,
      otherUserId,
      parseInt(page),
      parseInt(limit)
    );
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  async getConversations(@Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.privateChatService.getConversations(userId);
  }

  @Post('mark-read/:senderId')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markMessagesAsRead(
    @Request() req: any,
    @Param('senderId') senderId: string
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.privateChatService.markMessagesAsRead(userId, senderId);
  }

  @Delete('message/:messageId')
  @ApiOperation({ summary: 'Delete message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  async deleteMessage(
    @Request() req: any,
    @Param('messageId') messageId: string
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.privateChatService.deleteMessage(messageId, userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.privateChatService.getUnreadCount(userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search messages' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchMessages(
    @Request() req: any,
    @Query('query') query: string,
    @Query('userId') otherUserId?: string
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.privateChatService.searchMessages(userId, query, otherUserId);
  }

  @Post('messages/:messageId/react')
  @ApiOperation({ summary: 'Add reaction to private message' })
  @ApiResponse({ status: 201, description: 'Reaction added successfully' })
  async addReaction(
    @Param('messageId') messageId: string,
    @Body() body: { emoji: string },
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.privateChatService.addReaction(messageId, userId, body.emoji);
  }

  @Get('messages/:messageId/reactions')
  @ApiOperation({ summary: 'Get private message reactions' })
  @ApiResponse({ status: 200, description: 'Reactions retrieved successfully' })
  async getMessageReactions(@Param('messageId') messageId: string) {
    return this.privateChatService.getMessageReactions(messageId);
  }

  @Delete('messages/:messageId/react/:emoji')
  @ApiOperation({ summary: 'Remove reaction from private message' })
  @ApiResponse({ status: 200, description: 'Reaction removed successfully' })
  async removeReaction(
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.privateChatService.removeReaction(messageId, userId, emoji);
  }

  @Post('upload/image')
  @ApiOperation({ summary: 'Upload image for private chat' })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.privateChatService.uploadChatMedia(file, 'image', userId);
  }

  @Post('upload/voice')
  @ApiOperation({ summary: 'Upload voice message for private chat' })
  @ApiResponse({ status: 201, description: 'Voice message uploaded successfully' })
  @UseInterceptors(FileInterceptor('voice'))
  async uploadVoice(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.privateChatService.uploadChatMedia(file, 'voice', userId);
  }

  @Post('upload/file')
  @ApiOperation({ summary: 'Upload file for private chat' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.privateChatService.uploadChatMedia(file, 'file', userId);
  }

}
