import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { FriendsService } from '../friends/friends.service';

@Injectable()
export class PrivateChatService {
  constructor(
    private prisma: PrismaService,
    private friendsService: FriendsService
  ) {}

  async sendMessage(senderId: string, receiverId: string, content: string, messageType: string = 'text', fileUrl?: string, fileName?: string) {
    // Check if users are friends
    const areFriends = await this.friendsService.areFriends(senderId, receiverId);
    if (!areFriends) {
      throw new ForbiddenException('You can only send private messages to friends');
    }

    // Check if users exist
    const [sender, receiver] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: senderId } }),
      this.prisma.user.findUnique({ where: { id: receiverId } })
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException('User not found');
    }

    const message = await this.prisma.privateMessage.create({
      data: {
        senderId,
        receiverId,
        content,
        messageType,
        fileUrl,
        fileName,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isOnline: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isOnline: true,
          }
        }
      }
    });

    return {
      success: true,
      message,
    };
  }

  async getConversation(userId: string, otherUserId: string, page: number = 1, limit: number = 50) {
    // Check if users are friends
    const areFriends = await this.friendsService.areFriends(userId, otherUserId);
    if (!areFriends) {
      throw new ForbiddenException('You can only view conversations with friends');
    }

    const skip = (page - 1) * limit;

    const messages = await this.prisma.privateMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isOnline: true,
            lastSeenAt: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isOnline: true,
            lastSeenAt: true,
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Group reactions by emoji for each message
    const messagesWithGroupedReactions = messages.map(message => {
      const groupedReactions = message.reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            users: []
          };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push(reaction.user);
        return acc;
      }, {} as Record<string, any>);

      return {
        ...message,
        reactions: Object.values(groupedReactions)
      };
    });

    // Mark messages as read
    await this.markMessagesAsRead(userId, otherUserId);

    return {
      success: true,
      messages: messagesWithGroupedReactions.reverse(), // Reverse to show oldest first
      hasMore: messages.length === limit,
    };
  }

  async getConversations(userId: string) {
    // Get all conversations for the user
    const conversations = await this.prisma.privateMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isOnline: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isOnline: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by conversation partner
    const conversationMap = new Map();

    conversations.forEach(message => {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      const partner = message.senderId === userId ? message.receiver : message.sender;

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partner,
          lastMessage: message,
          unreadCount: 0,
        });
      }

      // Count unread messages
      if (message.receiverId === userId && !message.isRead) {
        conversationMap.get(partnerId).unreadCount++;
      }
    });

    const conversationsList = Array.from(conversationMap.values());

    return {
      success: true,
      conversations: conversationsList,
    };
  }

  async markMessagesAsRead(userId: string, senderId: string) {
    await this.prisma.privateMessage.updateMany({
      where: {
        senderId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      }
    });

    return {
      success: true,
      message: 'Messages marked as read'
    };
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.privateMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.privateMessage.delete({
      where: { id: messageId }
    });

    return {
      success: true,
      message: 'Message deleted successfully'
    };
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.privateMessage.count({
      where: {
        receiverId: userId,
        isRead: false,
      }
    });

    return {
      success: true,
      unreadCount
    };
  }

  async searchMessages(userId: string, query: string, otherUserId?: string) {
    const whereClause: any = {
      content: {
        contains: query,
      },
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    };

    if (otherUserId) {
      // Check if users are friends
      const areFriends = await this.friendsService.areFriends(userId, otherUserId);
      if (!areFriends) {
        throw new ForbiddenException('You can only search conversations with friends');
      }

      whereClause.OR = [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ];
    }

    const messages = await this.prisma.privateMessage.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      messages
    };
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    // Check if message exists and user has access
    const message = await this.prisma.privateMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if users are friends
    const areFriends = await this.friendsService.areFriends(userId, message.senderId === userId ? message.receiverId : message.senderId);
    if (!areFriends) {
      throw new ForbiddenException('You can only react to messages from friends');
    }

    // Check if user already reacted with this emoji
    const existingReaction = await this.prisma.privateMessageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji
        }
      }
    });

    if (existingReaction) {
      // Remove reaction if it already exists (toggle behavior)
      await this.prisma.privateMessageReaction.delete({
        where: { id: existingReaction.id }
      });

      return {
        success: true,
        action: 'removed',
        message: 'Reaction removed'
      };
    } else {
      // Add new reaction
      const reaction = await this.prisma.privateMessageReaction.create({
        data: {
          messageId,
          userId,
          emoji
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      return {
        success: true,
        action: 'added',
        reaction,
        message: 'Reaction added'
      };
    }
  }

  async getMessageReactions(messageId: string) {
    const reactions = await this.prisma.privateMessageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: []
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user);
      return acc;
    }, {} as Record<string, any>);

    return {
      success: true,
      reactions: Object.values(groupedReactions)
    };
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    const reaction = await this.prisma.privateMessageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji
        }
      }
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.prisma.privateMessageReaction.delete({
      where: { id: reaction.id }
    });

    return {
      success: true,
      message: 'Reaction removed'
    };
  }

  async uploadChatMedia(file: Express.Multer.File, type: 'image' | 'voice' | 'file', userId: string) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file types
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVoiceTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'];
    const allowedFileTypes = [
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'application/zip', 'application/x-rar-compressed'
    ];

    if (type === 'image' && !allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid image file type');
    }
    if (type === 'voice' && !allowedVoiceTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid voice file type');
    }
    if (type === 'file' && ![...allowedImageTypes, ...allowedVoiceTypes, ...allowedFileTypes].includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    // File size limits (in bytes)
    const maxSizes = {
      image: 10 * 1024 * 1024, // 10MB
      voice: 25 * 1024 * 1024, // 25MB
      file: 50 * 1024 * 1024   // 50MB
    };

    if (file.size > maxSizes[type]) {
      throw new BadRequestException(`File size exceeds limit for ${type} files`);
    }

    try {
      // Use the same file saving logic as the main upload service
      const fs = require('fs');
      const path = require('path');

      // Create upload directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'uploads', 'private-chat', `${type}s`);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${timestamp}-${randomString}.${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Generate URL that matches the static file serving
      const fileUrl = `https://invitedplus-production.up.railway.app/uploads/private-chat/${type}s/${fileName}`;

      return {
        success: true,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        type
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }
}
