import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SecureInvitesService {
  constructor(private prisma: PrismaService) {}

  async verifyInvitationToken(token: string) {
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
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('This invitation has already been processed');
    }

    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await this.prisma.secureInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
      throw new BadRequestException('This invitation has expired');
    }

    return {
      success: true,
      invitation
    };
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.prisma.secureInvitation.findUnique({
      where: { token },
      include: {
        event: true
      }
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('This invitation has already been processed');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('This invitation has expired');
    }

    // Verify the user's email matches the invitation email
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.email !== invitation.email) {
      throw new ForbiddenException('You can only accept invitations sent to your registered email address');
    }

    // Check if user is already attending
    const existingAttendee = await this.prisma.eventAttendee.findFirst({
      where: {
        eventId: invitation.eventId,
        userId
      }
    });

    if (existingAttendee) {
      throw new BadRequestException('You are already attending this event');
    }

    // Accept the invitation
    await this.prisma.$transaction([
      // Update invitation status
      this.prisma.secureInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      }),
      // Add user as attendee
      this.prisma.eventAttendee.create({
        data: {
          eventId: invitation.eventId,
          userId
        }
      })
    ]);

    return {
      success: true,
      message: 'Invitation accepted successfully',
      event: invitation.event
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
