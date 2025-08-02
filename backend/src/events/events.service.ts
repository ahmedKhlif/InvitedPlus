import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../common/email/email.service';
import { UploadService } from '../common/upload/upload.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateEventDto, UpdateEventDto, EventQueryDto } from './dto/event.dto';
import { EventStatus } from '@prisma/client';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private uploadService: UploadService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => WebSocketGateway))
    private webSocketGateway: WebSocketGateway,
  ) {}

  async create(createEventDto: CreateEventDto, userId: string) {
    try {
      // Validate required fields
      if (!createEventDto.title || !createEventDto.description) {
        throw new BadRequestException('Title and description are required');
      }

      if (!createEventDto.startDate || !createEventDto.endDate) {
        throw new BadRequestException('Start date and end date are required');
      }

      // Validate dates
      const startDate = new Date(createEventDto.startDate);
      const endDate = new Date(createEventDto.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }

      // Generate unique invite code
      const inviteCode = this.generateInviteCode();

      // Generate QR code for check-in
      const qrCode = this.generateQRCode(inviteCode);

      const event = await this.prisma.event.create({
        data: {
          title: createEventDto.title,
          description: createEventDto.description,
          startDate,
          endDate,
          location: createEventDto.location || null,
          isPublic: createEventDto.isPublic || false,
          maxAttendees: createEventDto.maxAttendees || null,
          organizerId: userId,
          inviteCode,
          qrCode,
          status: createEventDto.status || EventStatus.DRAFT,
          // Handle tags as comma-separated string
          tags: Array.isArray(createEventDto.tags)
            ? createEventDto.tags.join(',')
            : createEventDto.tags || null,
          // Handle images
          imageUrl: createEventDto.imageUrl || null,
          images: createEventDto.images || [],
          // Handle venue
          venue: createEventDto.venue || null,
          category: createEventDto.category || null,
        },
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

      // Create activity log for event creation
      try {
        await this.prisma.activityLog.create({
          data: {
            action: 'EVENT_CREATED',
            description: `Created event "${event.title}"`,
            userId,
            entityType: 'event',
            entityId: event.id,
            metadata: {
              eventTitle: event.title,
              eventId: event.id,
              category: event.category,
              tags: event.tags,
              isPublic: event.isPublic,
              status: event.status,
            },
          },
        });
      } catch (error) {
        console.error('Failed to create activity log for event creation:', error);
      }

      // Trigger notification to admins about new event
      try {
        await this.notificationsService.triggerEventCreated(event.id, userId);
      } catch (error) {
        this.logger.warn('Failed to send notification for event created', error);
      }

      return {
        success: true,
        message: 'Event created successfully',
        ...event,
      };
    } catch (error) {
      console.error('Error creating event:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create event: ' + error.message);
    }
  }

  async findAll(userId: string, query: any = {}) {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get user role to determine access
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    let where: any = {};

    if (user?.role === 'ADMIN') {
      // Admin sees all events
      where = {};
    } else if (user?.role === 'ORGANIZER') {
      // Organizer sees events they created OR events they're attending
      where = {
        OR: [
          { organizerId: userId },
          { attendees: { some: { userId } } },
        ],
      };
    } else {
      // Guest sees only events they're attending
      where = {
        attendees: { some: { userId } },
      };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: parseInt(limit),
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
        orderBy: {
          startDate: 'asc',
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      success: true,
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async findOne(id: string, userId: string) {
    // First check if user is admin - admins have access to all events
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    let whereClause: any = { id };

    // If not admin, apply access restrictions
    if (user?.role !== 'ADMIN') {
      whereClause.OR = [
        { organizerId: userId },
        { attendees: { some: { userId } } },
      ];
    }

    const event = await this.prisma.event.findFirst({
      where: whereClause,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found or you do not have access');
    }

    return {
      success: true,
      ...event,
    };
  }

  async update(id: string, updateEventDto: UpdateEventDto, userId: string) {
    // First check if user is admin - admins can update any event
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    let whereClause: any = { id };

    // If not admin, only allow organizer to update
    if (user?.role !== 'ADMIN') {
      whereClause.organizerId = userId;
    }

    const event = await this.prisma.event.findFirst({
      where: whereClause,
    });

    if (!event) {
      if (user?.role === 'ADMIN') {
        throw new NotFoundException('Event not found');
      } else {
        throw new ForbiddenException('You can only update events you organize');
      }
    }

    // Handle image cleanup if images are being updated
    if (updateEventDto.images !== undefined) {
      const currentImages = event.images as string[] || [];
      const newImages = updateEventDto.images || [];

      // Find images to delete (in current but not in new)
      const imagesToDelete = currentImages.filter(img => !newImages.includes(img));

      // Clean up old images
      if (imagesToDelete.length > 0) {
        await this.uploadService.deleteImages(imagesToDelete);
      }
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        ...updateEventDto,
        startDate: updateEventDto.startDate ? new Date(updateEventDto.startDate) : undefined,
        endDate: updateEventDto.endDate ? new Date(updateEventDto.endDate) : undefined,
        images: updateEventDto.images !== undefined ? updateEventDto.images : undefined,
        // Handle tags as comma-separated string
        tags: updateEventDto.tags !== undefined
          ? (Array.isArray(updateEventDto.tags)
              ? updateEventDto.tags.join(',')
              : updateEventDto.tags)
          : undefined,
      },
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

    // Create activity log for event update
    try {
      await this.prisma.activityLog.create({
        data: {
          action: 'EVENT_UPDATED',
          description: `Updated event "${updatedEvent.title}"`,
          userId,
          entityType: 'event',
          entityId: updatedEvent.id,
          metadata: {
            eventTitle: updatedEvent.title,
            eventId: updatedEvent.id,
            category: updatedEvent.category,
            tags: updatedEvent.tags,
            isPublic: updatedEvent.isPublic,
            status: updatedEvent.status,
            changes: JSON.stringify(updateEventDto),
          },
        },
      });
    } catch (error) {
      console.error('Failed to create activity log for event update:', error);
    }

    return {
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent,
    };
  }

  async remove(id: string, userId: string) {
    // First check if user is admin - admins can delete any event
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    let whereClause: any = { id };

    // If not admin, only allow organizer to delete
    if (user?.role !== 'ADMIN') {
      whereClause.organizerId = userId;
    }

    const event = await this.prisma.event.findFirst({
      where: whereClause,
    });

    if (!event) {
      if (user?.role === 'ADMIN') {
        throw new NotFoundException('Event not found');
      } else {
        throw new ForbiddenException('You can only delete events you organize');
      }
    }

    // Clean up event images before deletion
    const eventImages = event.images as string[] || [];
    if (eventImages.length > 0) {
      await this.uploadService.deleteImages(eventImages);
    }

    // Create activity log for event deletion before deleting
    try {
      await this.prisma.activityLog.create({
        data: {
          action: 'EVENT_DELETED',
          description: `Deleted event "${event.title}"`,
          userId,
          entityType: 'event',
          entityId: event.id,
          metadata: {
            eventTitle: event.title,
            eventId: event.id,
            category: event.category,
            tags: event.tags,
            isPublic: event.isPublic,
            status: event.status,
          },
        },
      });
    } catch (error) {
      console.error('Failed to create activity log for event deletion:', error);
    }

    await this.prisma.event.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Event deleted successfully',
    };
  }

  async getAttendees(id: string, userId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id,
        OR: [
          { organizerId: userId },
          { attendees: { some: { userId } } },
        ],
      },
      include: {
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found or you do not have access');
    }

    return {
      success: true,
      attendees: event.attendees,
    };
  }

  async getEligibleAssignees(id: string, userId: string) {
    console.log('🔍 EventsService.getEligibleAssignees called with:', { eventId: id, userId });

    const event = await this.prisma.event.findFirst({
      where: {
        id,
        OR: [
          { organizerId: userId },
          { attendees: { some: { userId } } },
        ],
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      console.log('❌ Event not found or no access for:', { eventId: id, userId });
      throw new NotFoundException('Event not found or you do not have access');
    }

    console.log('✅ Event found:', { eventId: event.id, title: event.title, organizerId: event.organizerId });

    // Combine organizer and attendees, avoiding duplicates
    const eligibleUsers = [];

    // Add organizer
    eligibleUsers.push({
      id: event.organizer.id,
      name: event.organizer.name,
      email: event.organizer.email,
      role: event.organizer.role,
      type: 'organizer',
    });

    // Add attendees (excluding organizer if they're also an attendee)
    event.attendees.forEach(attendee => {
      if (attendee.user.id !== event.organizer.id) {
        eligibleUsers.push({
          id: attendee.user.id,
          name: attendee.user.name,
          email: attendee.user.email,
          role: attendee.user.role,
          type: 'attendee',
        });
      }
    });

    const response = {
      success: true,
      eligibleAssignees: eligibleUsers,
    };

    console.log('✅ Returning eligible assignees:', { count: eligibleUsers.length, users: eligibleUsers });
    return response;
  }

  async joinEvent(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.maxAttendees && event._count.attendees >= event.maxAttendees) {
      throw new ForbiddenException('Event is full');
    }

    // Check if already attending
    const existingAttendee = await this.prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId,
        },
      },
    });

    if (existingAttendee) {
      return {
        success: true,
        message: 'You are already attending this event',
      };
    }

    await this.prisma.eventAttendee.create({
      data: {
        eventId: id,
        userId,
      },
    });

    // Trigger notification to event organizer
    try {
      await this.notificationsService.triggerUserJoinedEvent(id, userId, userId);
    } catch (error) {
      this.logger.warn('Failed to send notification for user joined event', error);
    }

    return {
      success: true,
      message: 'Successfully joined the event',
    };
  }

  async leaveEvent(id: string, userId: string) {
    const attendee = await this.prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId,
        },
      },
    });

    if (!attendee) {
      throw new NotFoundException('You are not attending this event');
    }

    await this.prisma.eventAttendee.delete({
      where: {
        eventId_userId: {
          eventId: id,
          userId,
        },
      },
    });

    return {
      success: true,
      message: 'Successfully left the event',
    };
  }

  async kickUserFromEvent(eventId: string, participantId: string, organizerId: string) {
    // First, verify that the requester is the event organizer
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        organizerId: true,
        organizer: {
          select: { name: true, role: true }
        }
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if the requester is the event organizer or an admin
    const organizer = await this.prisma.user.findUnique({
      where: { id: organizerId },
      select: { role: true }
    });

    if (event.organizerId !== organizerId && organizer?.role !== 'ADMIN') {
      throw new ForbiddenException('Only the event organizer can kick users from this event');
    }

    // Prevent organizer from kicking themselves
    if (participantId === organizerId) {
      throw new BadRequestException('Event organizer cannot kick themselves from their own event');
    }

    // Check if the user is actually attending the event
    const attendee = await this.prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: participantId,
        },
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!attendee) {
      throw new NotFoundException('User is not attending this event');
    }

    // Remove the user from the event
    await this.prisma.eventAttendee.delete({
      where: {
        eventId_userId: {
          eventId,
          userId: participantId,
        },
      },
    });

    // Log the action for audit purposes
    this.logger.log(`User ${attendee.user.name} (${attendee.user.email}) was kicked from event "${event.title}" by organizer ${organizerId}`);

    // Emit WebSocket event to notify all event participants
    try {
      this.webSocketGateway.server.to(`event:${eventId}`).emit('event:user_kicked', {
        eventId,
        kickedUserId: participantId,
        kickedUserName: attendee.user.name,
        organizerId,
        timestamp: new Date().toISOString(),
        message: `${attendee.user.name} was removed from the event`,
      });

      // Notify the kicked user specifically (if they're connected)
      this.webSocketGateway.server.to(`user:${participantId}`).emit('event:kicked_from_event', {
        eventId,
        eventTitle: event.title,
        organizerId,
        timestamp: new Date().toISOString(),
        message: `You have been removed from "${event.title}"`,
      });
    } catch (error) {
      this.logger.warn('Failed to send WebSocket notification for user kick', error);
    }

    // Send notification to the kicked user
    try {
      await this.notificationsService.createNotification({
        userId: participantId,
        type: 'EVENT_KICKED',
        title: 'Removed from Event',
        message: `You have been removed from "${event.title}"`,
        data: { eventId, eventTitle: event.title },
      });
    } catch (error) {
      this.logger.warn('Failed to create notification for kicked user', error);
    }

    return {
      success: true,
      message: `Successfully removed ${attendee.user.name} from the event`,
      kickedUser: {
        id: participantId,
        name: attendee.user.name,
        email: attendee.user.email,
      },
      event: {
        id: eventId,
        title: event.title,
      },
    };
  }

  async getEventInvites(eventId: string, userId: string) {
    // Verify user has access to the event
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: userId, // Only organizer can view invites
      },
    });

    if (!event) {
      throw new ForbiddenException('You can only view invites for events you organize');
    }

    // For now, return basic invite information
    // In a full implementation, you might have a separate Invites table
    return {
      success: true,
      invites: [
        {
          id: event.id,
          eventId: event.id,
          inviteCode: event.inviteCode,
          qrCode: event.qrCode,
          isActive: true,
          createdAt: event.createdAt,
        },
      ],
    };
  }

  async sendEventInvite(eventId: string, email: string, userId: string) {
    // Verify user has access to the event (organizer or attendee)
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
      },
      include: {
        organizer: {
          select: {
            name: true,
          },
        },
        attendees: {
          where: { userId }
        }
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user can send invitations (organizer or attendee)
    const isOrganizer = event.organizerId === userId;
    const isAttendee = event.attendees.length > 0;

    if (!isOrganizer && !isAttendee) {
      throw new ForbiddenException('You can only send invites for events you organize or attend');
    }

    // Verify that the invited email matches a registered user's email
    const invitedUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!invitedUser) {
      throw new BadRequestException('Invitation can only be sent to registered users. The email must match a registered account.');
    }

    // Check if user is already attending the event
    const existingAttendee = await this.prisma.eventAttendee.findFirst({
      where: {
        eventId,
        userId: invitedUser.id
      }
    });

    if (existingAttendee) {
      throw new BadRequestException('User is already attending this event');
    }

    try {
      // Generate secure invitation token
      const invitationToken = this.generateSecureToken();

      // Create invitation record with token
      const invitation = await this.prisma.secureInvitation.create({
        data: {
          email,
          eventId,
          invitedBy: userId,
          token: invitationToken,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      });

      // Send the secure email invitation with token
      await this.emailService.sendSecureEventInvitation(
        email,
        event.title,
        invitationToken,
        event.organizer.name,
        event.id
      );

      return {
        success: true,
        message: 'Secure invitation sent successfully',
        invite: {
          id: invitation.id,
          email,
          eventId: event.id,
          token: invitationToken,
          status: 'PENDING',
          createdAt: invitation.createdAt,
          expiresAt: invitation.expiresAt,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to send invite to ${email}:`, error);
      throw new BadRequestException('Failed to send invitation email');
    }
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateQRCode(inviteCode: string): string {
    // In a real implementation, you would use a QR code library
    // For now, we'll return a placeholder URL
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${inviteCode}`;
  }

  private generateSecureToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  async exportGuestList(eventId: string, userId: string, format: 'csv' | 'json' = 'csv') {
    const event = await this.findOne(eventId, userId);

    const attendees = await this.prisma.eventAttendee.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
    });

    const invitations = await this.prisma.invitation.findMany({
      where: { eventId },
      select: {
        email: true,
        status: true,
        rsvpData: true,
        invitedAt: true,
        respondedAt: true,
      },
    });

    const guestData = {
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        location: event.location,
      },
      attendees: attendees.map(a => ({
        id: a.user.id,
        name: a.user.name,
        email: a.user.email,
        phone: a.user.phone,
        joinedAt: a.joinedAt,
        registeredAt: a.user.createdAt,
      })),
      invitations: invitations.map(i => ({
        email: i.email,
        status: i.status,
        invitedAt: i.invitedAt,
        respondedAt: i.respondedAt,
        rsvpData: i.rsvpData,
      })),
      summary: {
        totalInvited: invitations.length,
        totalAttending: attendees.length,
        pendingResponses: invitations.filter(i => i.status === 'PENDING').length,
        acceptedInvitations: invitations.filter(i => i.status === 'ACCEPTED').length,
        declinedInvitations: invitations.filter(i => i.status === 'DECLINED').length,
      },
    };

    if (format === 'csv') {
      return this.convertToCSV(guestData);
    }

    return guestData;
  }

  private convertToCSV(data: any): string {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Joined At', 'Invited At', 'Responded At'];
    const rows = [];

    // Add attendees
    data.attendees.forEach((attendee: any) => {
      rows.push([
        attendee.name,
        attendee.email,
        attendee.phone || '',
        'ATTENDING',
        attendee.joinedAt,
        '',
        '',
      ]);
    });

    // Add invitations
    data.invitations.forEach((invitation: any) => {
      const attendee = data.attendees.find((a: any) => a.email === invitation.email);
      if (!attendee) {
        rows.push([
          '',
          invitation.email,
          '',
          invitation.status,
          '',
          invitation.invitedAt,
          invitation.respondedAt || '',
        ]);
      }
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    return csvContent;
  }
}
