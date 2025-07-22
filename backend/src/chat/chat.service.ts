import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

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
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.chatMessage.count({ where }),
    ]);

    return {
      success: true,
      messages: messages.reverse(), // Show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async sendMessage(content: string, userId: string, eventId?: string) {
    // Clean eventId - treat empty strings as undefined
    const cleanEventId = eventId && eventId.trim() !== '' ? eventId : undefined;

    // If eventId is provided, check user access to event
    if (cleanEventId) {
      await this.verifyEventAccess(cleanEventId, userId);
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        content,
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
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.chatMessage.count({ where: { eventId } }),
    ]);

    return {
      success: true,
      messages: messages.reverse(), // Show oldest first
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
}
