import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SecureInvitesService {
  constructor(private prisma: PrismaService) {}

  async verifyInvitationToken(token: string, userEmail?: string) {
    const invitation = await this.prisma.secureInvitation.findUnique({
      where: { token },
      include: {
        event: {
          include: {
            organizer: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation token');
    }

    if (invitation.status !== 'PENDING') {
      const statusMessages = {
        'ACCEPTED': 'This invitation has already been accepted',
        'DECLINED': 'This invitation has been declined',
        'EXPIRED': 'This invitation has expired',
        'REVOKED': 'This invitation has been revoked'
      };
      throw new BadRequestException(statusMessages[invitation.status] || 'This invitation is no longer valid');
    }

    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await this.prisma.secureInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
      throw new BadRequestException('This invitation has expired');
    }

    // Enhanced email validation - if user email is provided, verify it matches
    if (userEmail && userEmail.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException(`This invitation is exclusively for ${invitation.email}. Please log in with the correct email address.`);
    }

    return {
      success: true,
      invitation,
      requiresEmailMatch: invitation.email,
      expiresAt: invitation.expiresAt,
      isOneTimeUse: true
    };
  }

  async acceptInvitation(token: string, userId: string) {
    // First verify the token and get invitation details
    const invitation = await this.prisma.secureInvitation.findUnique({
      where: { token },
      include: {
        event: {
          include: {
            organizer: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation token');
    }

    if (invitation.status !== 'PENDING') {
      const statusMessages = {
        'ACCEPTED': 'This invitation has already been accepted',
        'DECLINED': 'This invitation has been declined',
        'EXPIRED': 'This invitation has expired',
        'REVOKED': 'This invitation has been revoked'
      };
      throw new BadRequestException(statusMessages[invitation.status] || 'This invitation is no longer valid');
    }

    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await this.prisma.secureInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
      throw new BadRequestException('This invitation has expired');
    }

    // Enhanced user verification with detailed error messages
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, isVerified: true }
    });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Please verify your email address before accepting invitations');
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException(
        `This invitation is exclusively for ${invitation.email}. ` +
        `You are currently logged in as ${user.email}. ` +
        `Please log in with the correct email address to accept this invitation.`
      );
    }

    // Check if user is already attending
    const existingAttendee = await this.prisma.eventAttendee.findFirst({
      where: {
        eventId: invitation.eventId,
        userId
      }
    });

    if (existingAttendee) {
      // Mark invitation as accepted even if already attending
      await this.prisma.secureInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      });
      throw new BadRequestException('You are already attending this event');
    }

    // Check event capacity
    if (invitation.event.maxAttendees) {
      const currentAttendeeCount = await this.prisma.eventAttendee.count({
        where: { eventId: invitation.eventId }
      });

      if (currentAttendeeCount >= invitation.event.maxAttendees) {
        throw new BadRequestException('This event has reached its maximum capacity');
      }
    }

    // Accept the invitation with enhanced transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update invitation status (one-time use enforcement)
      await tx.secureInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          updatedAt: new Date()
        }
      });

      // Add user as attendee
      const attendee = await tx.eventAttendee.create({
        data: {
          eventId: invitation.eventId,
          userId,
          joinedAt: new Date()
        }
      });

      return attendee;
    });

    return {
      success: true,
      message: `Welcome to ${invitation.event.title}! Your invitation has been accepted.`,
      event: {
        id: invitation.event.id,
        title: invitation.event.title,
        startDate: invitation.event.startDate,
        endDate: invitation.event.endDate,
        location: invitation.event.location,
        organizer: invitation.event.organizer
      },
      attendeeId: result.id,
      joinedAt: result.joinedAt
    };
  }

  async declineInvitation(token: string, userId: string) {
    const invitation = await this.prisma.secureInvitation.findUnique({
      where: { token }
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('This invitation has already been processed');
    }

    // Verify the user's email matches the invitation email
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.email !== invitation.email) {
      throw new ForbiddenException('You can only decline invitations sent to your registered email address');
    }

    // Decline the invitation
    await this.prisma.secureInvitation.update({
      where: { id: invitation.id },
      data: { status: 'DECLINED' }
    });

    return {
      success: true,
      message: 'Invitation declined'
    };
  }

  async getEventInvitations(eventId: string, userId: string) {
    // Verify user has access to view invitations (organizer only)
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: userId
      }
    });

    if (!event) {
      throw new ForbiddenException('You can only view invitations for events you organize');
    }

    const invitations = await this.prisma.secureInvitation.findMany({
      where: { eventId },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      invitations
    };
  }

  async revokeInvitation(invitationId: string, userId: string) {
    const invitation = await this.prisma.secureInvitation.findUnique({
      where: { id: invitationId },
      include: {
        event: true
      }
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Only organizer or the person who sent the invitation can revoke it
    if (invitation.event.organizerId !== userId && invitation.invitedBy !== userId) {
      throw new ForbiddenException('You can only revoke invitations you sent or as event organizer');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Can only revoke pending invitations');
    }

    await this.prisma.secureInvitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' }
    });

    return {
      success: true,
      message: 'Invitation revoked successfully'
    };
  }

  async cleanupExpiredInvitations() {
    const expiredInvitations = await this.prisma.secureInvitation.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: new Date()
        }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    return {
      success: true,
      expiredCount: expiredInvitations.count
    };
  }
}
