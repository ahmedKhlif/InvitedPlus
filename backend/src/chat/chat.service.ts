import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageType, NotificationType } from '@prisma/client';
import { UploadService } from '../common/upload/upload.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
    private notificationsService: NotificationsService,
  ) {}

  async getMessages(userId: string, eventId?: string, pagination = { page: 1, limit: 50 }) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Clean eventId - treat empty strings as undefined
    const cleanEventId = eventId && eventId.trim() !== '' ? eventId : undefined;

    // If eventId is provided, check user access to event
    if (cleanEventId) {
      await this.verifyEventAccess(cleanEventId, userId);
    }

    const where: any = {};
    if (cleanEventId) {
      where.eventId = cleanEventId;
    }
    // For now, just get all messages - we'll add proper filtering later

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where,
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              isOnline: true,
              lastSeenAt: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
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
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.chatMessage.count({ where }),
    ]);

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

    return {
      success: true,
      messages: messagesWithGroupedReactions.reverse(), // Show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async sendMessage(sendMessageDto: SendMessageDto, userId: string) {
    const { content, type = MessageType.TEXT, mediaUrl, mediaType, duration, eventId } = sendMessageDto;

    // Clean eventId - treat empty strings as undefined
    const cleanEventId = eventId && eventId.trim() !== '' ? eventId : undefined;

    // If eventId is provided, check user access to event
    if (cleanEventId) {
      await this.verifyEventAccess(cleanEventId, userId);
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        content,
        type,
        mediaUrl,
        mediaType,
        duration,
        senderId: userId,
        eventId: cleanEventId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Create activity log for chat message
    try {
      await this.prisma.activityLog.create({
        data: {
          action: 'MESSAGE_SENT',
          description: eventId
            ? `Sent a message in "${message.event?.title}" chat`
            : 'Sent a message in global chat',
          userId,
          entityType: 'message',
          entityId: message.id,
          metadata: {
            content: content.substring(0, 100), // Store first 100 chars
            eventId,
            eventTitle: message.event?.title,
          },
        },
      });
    } catch (error) {
      console.error('Failed to create activity log for message:', error);
      // Don't fail the message sending if activity log fails
    }

    // Create notifications for chat participants
    try {
      await this.createChatNotifications(message, userId);
    } catch (error) {
      console.error('Failed to create chat notifications:', error);
      // Don't fail the message sending if notifications fail
    }

    return {
      success: true,
      message: 'Message sent successfully',
      data: message,
    };
  }

  async getEventMessages(eventId: string, userId: string, pagination = { page: 1, limit: 50 }) {
    await this.verifyEventAccess(eventId, userId);

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { eventId },
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              isOnline: true,
              lastSeenAt: true,
            },
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
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.chatMessage.count({ where: { eventId } }),
    ]);

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

    return {
      success: true,
      messages: messagesWithGroupedReactions.reverse(), // Show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  private async verifyEventAccess(eventId: string, userId: string) {
    // First check if user is admin - admins have access to all events
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role === 'ADMIN') {
      // Admin users can access any event, just verify the event exists
      const event = await this.prisma.event.findUnique({
        where: { id: eventId }
      });

      if (!event) {
        throw new ForbiddenException('Event not found');
      }

      return event;
    }

    // For non-admin users, check if they're organizer or attendee
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        OR: [
          { organizerId: userId },
          { attendees: { some: { userId } } },
        ],
      },
    });

    if (!event) {
      throw new ForbiddenException('You do not have access to this event');
    }

    return event;
  }

  async uploadChatMedia(file: Express.Multer.File, mediaType: 'image' | 'voice' | 'file', userId: string) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file types
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVoiceTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    const allowedFileTypes = [...allowedImageTypes, ...allowedVoiceTypes, 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    let isValidType = false;
    switch (mediaType) {
      case 'image':
        isValidType = allowedImageTypes.includes(file.mimetype);
        break;
      case 'voice':
        isValidType = allowedVoiceTypes.includes(file.mimetype);
        break;
      case 'file':
        isValidType = allowedFileTypes.includes(file.mimetype);
        break;
    }

    if (!isValidType) {
      throw new BadRequestException(`Invalid file type for ${mediaType}. Allowed types: ${mediaType === 'image' ? allowedImageTypes.join(', ') : mediaType === 'voice' ? allowedVoiceTypes.join(', ') : allowedFileTypes.join(', ')}`);
    }

    // File size limits (in bytes)
    const maxSizes = {
      image: 10 * 1024 * 1024, // 10MB
      voice: 25 * 1024 * 1024, // 25MB
      file: 50 * 1024 * 1024,  // 50MB
    };

    if (file.size > maxSizes[mediaType]) {
      throw new BadRequestException(`File too large. Maximum size for ${mediaType}: ${maxSizes[mediaType] / (1024 * 1024)}MB`);
    }

    try {
      let uploadResult: { url: string; filename: string };

      // Use appropriate upload method based on media type
      if (mediaType === 'image') {
        const url = await this.uploadService.uploadSingleImage(file, 'events');
        uploadResult = { url, filename: file.originalname };
      } else if (mediaType === 'voice') {
        uploadResult = await this.uploadService.uploadAudio(file, 'chat-audio');
      } else {
        // For files (PDFs, documents, etc.), use uploadFile method
        uploadResult = await this.uploadService.uploadFile(file, 'chat-files');
      }

      return {
        success: true,
        message: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully`,
        data: {
          url: uploadResult.url,
          filename: uploadResult.filename,
          mimetype: file.mimetype,
          size: file.size,
          type: mediaType,
        },
      };
    } catch (error) {
      console.error(`Failed to upload ${mediaType}:`, error);
      throw new BadRequestException(`Failed to upload ${mediaType}: ${error.message}`);
    }
  }

  private async createChatNotifications(message: any, senderId: string) {
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, name: true }
    });

    if (!sender) return;

    if (message.eventId) {
      // Event-specific chat - notify all event attendees except the sender
      const attendees = await this.prisma.eventAttendee.findMany({
        where: {
          eventId: message.eventId,
          userId: { not: senderId } // Exclude the sender
        },
        include: { user: true }
      });

      const userIds = attendees.map(attendee => attendee.userId);

      if (userIds.length > 0) {
        await this.notificationsService.createNotification({
          userIds,
          title: 'New Chat Message',
          message: `${sender.name} sent a message in ${message.event?.title || 'event'} chat`,
          type: NotificationType.CHAT_MESSAGE,
          fromUserId: senderId,
          eventId: message.eventId,
          actionUrl: `/events/${message.eventId}/chat`
        });
      }
    } else {
      // Global chat - notify all users except the sender
      // For now, let's limit this to recent chat participants to avoid spam
      const recentParticipants = await this.prisma.chatMessage.findMany({
        where: {
          eventId: null, // Global chat only
          senderId: { not: senderId },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        select: { senderId: true },
        distinct: ['senderId'],
        take: 10 // Limit to 10 recent participants
      });

      const userIds = recentParticipants.map(p => p.senderId);

      if (userIds.length > 0) {
        await this.notificationsService.createNotification({
          userIds,
          title: 'New Chat Message',
          message: `${sender.name} sent a message in global chat`,
          type: NotificationType.CHAT_MESSAGE,
          fromUserId: senderId,
          actionUrl: '/chat'
        });
      }
    }
  }
}
