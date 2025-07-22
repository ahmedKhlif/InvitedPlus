import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../common/email/email.service';
import { UploadService } from '../common/upload/upload.service';
import { CreateEventDto, UpdateEventDto, EventQueryDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private uploadService: UploadService,
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
          status: createEventDto.status || 'DRAFT',
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
          },
        },
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
      ...event,
    };
  }

  async update(id: string, updateEventDto: UpdateEventDto, userId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id,
        organizerId: userId, // Only organizer can update
      },
    });

    if (!event) {
      throw new ForbiddenException('You can only update events you organize');
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

    return {
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent,
    };
  }

  async remove(id: string, userId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id,
        organizerId: userId, // Only organizer can delete
      },
    });

    if (!event) {
      throw new ForbiddenException('You can only delete events you organize');
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
      throw new NotFoundException('Event not found or you do not have access');
    }

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

    return {
      success: true,
      eligibleAssignees: eligibleUsers,
    };
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
    // Verify user has access to the event (must be organizer)
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: userId,
      },
      include: {
        organizer: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!event) {
      throw new ForbiddenException('You can only send invites for events you organize');
    }

    try {
      // Send the email invitation
      await this.emailService.sendEventInvitation(
        email,
        event.title,
        event.inviteCode,
        event.organizer.name
      );

      return {
        success: true,
        message: 'Invitation sent successfully',
        invite: {
          id: `invite-${Date.now()}`,
          email,
          eventId: event.id,
          code: event.inviteCode,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
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
