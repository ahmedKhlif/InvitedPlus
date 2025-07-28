import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async sendFriendRequest(senderId: string, receiverId: string, message?: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if users exist
    const [sender, receiver] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: senderId } }),
      this.prisma.user.findUnique({ where: { id: receiverId } })
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException('User not found');
    }

    // Check if already friends
    const existingFriendship = await this.areFriends(senderId, receiverId);
    if (existingFriendship) {
      throw new BadRequestException('Users are already friends');
    }

    // Check if request already exists
    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    });

    if (existingRequest) {
      throw new BadRequestException('Friend request already exists');
    }

    const friendRequest = await this.prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        message,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        }
      }
    });

    return {
      success: true,
      friendRequest,
      message: 'Friend request sent successfully'
    };
  }

  async respondToFriendRequest(requestId: string, userId: string, response: 'accepted' | 'declined') {
    const friendRequest = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: true,
        receiver: true
      }
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendRequest.receiverId !== userId) {
      throw new ForbiddenException('You can only respond to friend requests sent to you');
    }

    if (friendRequest.status !== 'pending') {
      throw new BadRequestException('Friend request has already been responded to');
    }

    // Update the friend request status
    const updatedRequest = await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: response }
    });

    // If accepted, create friendship
    if (response === 'accepted') {
      await this.prisma.friendship.create({
        data: {
          user1Id: friendRequest.senderId,
          user2Id: friendRequest.receiverId,
        }
      });
    }

    return {
      success: true,
      friendRequest: updatedRequest,
      message: `Friend request ${response} successfully`
    };
  }

  async getFriendRequests(userId: string, type: 'sent' | 'received' = 'received') {
    const where = type === 'sent' 
      ? { senderId: userId, status: 'pending' }
      : { receiverId: userId, status: 'pending' };

    const requests = await this.prisma.friendRequest.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isOnline: true,
            lastSeenAt: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isOnline: true,
            lastSeenAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      requests
    };
  }

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isOnline: true,
            lastSeenAt: true,
            profilePrivacy: true,
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isOnline: true,
            lastSeenAt: true,
            profilePrivacy: true,
          }
        }
      }
    });

    const friends = friendships.map(friendship => {
      return friendship.user1Id === userId ? friendship.user2 : friendship.user1;
    });

    return {
      success: true,
      friends
    };
  }

  async removeFriend(userId: string, friendId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId }
        ]
      }
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id }
    });

    return {
      success: true,
      message: 'Friend removed successfully'
    };
  }

  async areFriends(user1Id: string, user2Id: string): Promise<boolean> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: user1Id, user2Id: user2Id },
          { user1Id: user2Id, user2Id: user1Id }
        ]
      }
    });

    return !!friendship;
  }

  async updateOnlineStatus(userId: string, isOnline: boolean) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isOnline,
        lastSeenAt: new Date(),
      }
    });

    return {
      success: true,
      message: 'Online status updated'
    };
  }

  async updateProfilePrivacy(userId: string, privacy: 'public' | 'friends' | 'private') {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        profilePrivacy: privacy
      }
    });

    return {
      success: true,
      message: 'Profile privacy updated'
    };
  }

  async canViewProfile(viewerId: string, targetUserId: string): Promise<boolean> {
    if (viewerId === targetUserId) {
      return true; // Can always view own profile
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { profilePrivacy: true }
    });

    if (!targetUser) {
      return false;
    }

    switch (targetUser.profilePrivacy) {
      case 'public':
        return true;
      case 'friends':
        return await this.areFriends(viewerId, targetUserId);
      case 'private':
        return false;
      default:
        return true;
    }
  }
}
