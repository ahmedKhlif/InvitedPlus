import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
    @Body() messageDto: { content: string; eventId?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;

    return this.chatService.sendMessage(
      messageDto.content,
      userId,
      messageDto.eventId,
    );
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
}
