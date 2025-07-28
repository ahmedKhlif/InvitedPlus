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
  Patch,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('friends')
@Controller('friends')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  @ApiOperation({ summary: 'Send friend request' })
  @ApiResponse({ status: 201, description: 'Friend request sent successfully' })
  async sendFriendRequest(
    @Request() req: any,
    @Body() body: { receiverId: string; message?: string }
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.friendsService.sendFriendRequest(userId, body.receiverId, body.message);
  }

  @Patch('request/:requestId/respond')
  @ApiOperation({ summary: 'Respond to friend request' })
  @ApiResponse({ status: 200, description: 'Friend request response processed' })
  async respondToFriendRequest(
    @Request() req: any,
    @Param('requestId') requestId: string,
    @Body() body: { response: 'accepted' | 'declined' }
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.friendsService.respondToFriendRequest(requestId, userId, body.response);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get friend requests' })
  @ApiResponse({ status: 200, description: 'Friend requests retrieved successfully' })
  async getFriendRequests(
    @Request() req: any,
    @Query('type') type: 'sent' | 'received' = 'received'
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.friendsService.getFriendRequests(userId, type);
  }

  @Get()
  @ApiOperation({ summary: 'Get friends list' })
  @ApiResponse({ status: 200, description: 'Friends list retrieved successfully' })
  async getFriends(@Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.friendsService.getFriends(userId);
  }

  @Delete(':friendId')
  @ApiOperation({ summary: 'Remove friend' })
  @ApiResponse({ status: 200, description: 'Friend removed successfully' })
  async removeFriend(
    @Request() req: any,
    @Param('friendId') friendId: string
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.friendsService.removeFriend(userId, friendId);
  }

  @Post('online-status')
  @ApiOperation({ summary: 'Update online status' })
  @ApiResponse({ status: 200, description: 'Online status updated' })
  async updateOnlineStatus(
    @Request() req: any,
    @Body() body: { isOnline: boolean }
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.friendsService.updateOnlineStatus(userId, body.isOnline);
  }

  @Post('privacy')
  @ApiOperation({ summary: 'Update profile privacy' })
  @ApiResponse({ status: 200, description: 'Profile privacy updated' })
  async updateProfilePrivacy(
    @Request() req: any,
    @Body() body: { privacy: 'public' | 'friends' | 'private' }
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.friendsService.updateProfilePrivacy(userId, body.privacy);
  }

  @Get('check/:userId')
  @ApiOperation({ summary: 'Check if users are friends' })
  @ApiResponse({ status: 200, description: 'Friendship status checked' })
  async checkFriendship(
    @Request() req: any,
    @Param('userId') targetUserId: string
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    const areFriends = await this.friendsService.areFriends(userId, targetUserId);
    return {
      success: true,
      areFriends
    };
  }
}
