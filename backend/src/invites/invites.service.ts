import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class InvitesService {
  constructor(private prisma: PrismaService) {}

  async getEventByInviteCode(code: string) {
    const event = await this.prisma.event.findUnique({
      where: { inviteCode: code },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Invalid invite code');
    }

    return {
      success: true,
      event,
    };
  }

  async rsvpToEvent(code: string, status: 'ACCEPTED' | 'DECLINED', userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { inviteCode: code },
      include: {
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Invalid invite code');
    }

    if (status === 'ACCEPTED') {
      // Check if event is full
      if (event.maxAttendees && event._count.attendees >= event.maxAttendees) {
        throw new BadRequestException('Event is full');
      }

      // Check if already attending
      const existingAttendee = await this.prisma.eventAttendee.findUnique({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId,
          },
        },
      });

      if (existingAttendee) {
        return {
          success: true,
          message: 'You are already attending this event',
          status: 'ACCEPTED',
        };
      }

      // Add user as attendee
      await this.prisma.eventAttendee.create({
        data: {
          eventId: event.id,
          userId,
        },
      });

      return {
        success: true,
        message: 'RSVP accepted successfully',
        status: 'ACCEPTED',
      };
    } else {
      // Remove user from attendees if they were attending
      await this.prisma.eventAttendee.deleteMany({
        where: {
          eventId: event.id,
          userId,
        },
      });

      return {
        success: true,
        message: 'RSVP declined',
        status: 'DECLINED',
      };
    }
  }

  async getRsvpStatus(code: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { inviteCode: code },
      include: {
        attendees: {
          where: { userId },
          select: {
            joinedAt: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Invalid invite code');
    }

    const attendee = event.attendees[0];

    return {
      success: true,
      status: attendee ? 'ACCEPTED' : 'PENDING',
      joinedAt: attendee?.joinedAt || null,
    };
  }
}
