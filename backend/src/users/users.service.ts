import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserCatalog(currentUserId: string, currentUserRole: string, query: any = {}) {
    try {
      let whereClause: any = {
        id: { not: currentUserId }, // Exclude current user
      };

      // Role-based filtering
      if (currentUserRole === 'GUEST') {
        // Guests can only see users from events they attend
        const userEvents = await this.prisma.eventAttendee.findMany({
          where: { userId: currentUserId },
          select: { eventId: true },
        });

        const eventIds = userEvents.map(e => e.eventId);

        if (eventIds.length === 0) {
          return {
            success: true,
            users: [],
            totalUsers: 0,
            currentUserRole,
          };
        }

        // Get users who attend the same events
        const attendeeUserIds = await this.prisma.eventAttendee.findMany({
          where: { eventId: { in: eventIds } },
          select: { userId: true },
          distinct: ['userId'],
        });

        const userIds = attendeeUserIds.map(a => a.userId).filter(id => id !== currentUserId);

        whereClause.id = { in: userIds };
      } else if (currentUserRole === 'ORGANIZER') {
        // Organizers can see all guest users and users from their events
        const organizerEvents = await this.prisma.event.findMany({
          where: { organizerId: currentUserId },
          select: { id: true },
        });

        const eventIds = organizerEvents.map(e => e.id);

        if (eventIds.length > 0) {
          const attendeeUserIds = await this.prisma.eventAttendee.findMany({
            where: { eventId: { in: eventIds } },
            select: { userId: true },
            distinct: ['userId'],
          });

          const userIds = attendeeUserIds.map(a => a.userId).filter(id => id !== currentUserId);

          // Include all guests and users from organizer's events
          whereClause = {
            OR: [
              { role: 'GUEST' },
              { id: { in: userIds } },
            ],
            id: { not: currentUserId },
          };
        } else {
          whereClause.role = 'GUEST';
        }
      }
      // ADMIN can see all users (no additional filtering needed)

      const users = await this.prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          bio: true,
          phone: true,
          isVerified: true,
          isOnline: true,
          lastSeenAt: true,
          createdAt: true,
          _count: {
            select: {
              organizedEvents: true,
              eventAttendees: true,
              tasks: true,
              chatMessages: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' },
          { name: 'asc' },
        ],
      });

      const totalUsers = await this.prisma.user.count({
        where: whereClause,
      });

      return {
        success: true,
        users,
        totalUsers,
        currentUserRole,
      };
    } catch (error) {
      console.error('Failed to get user catalog:', error);
      throw error;
    }
  }

  async getUserProfile(currentUserId: string, targetUserId: string, currentUserRole: string) {
    try {
      // Check if current user has permission to view this profile
      const canView = await this.canViewUserProfile(currentUserId, targetUserId, currentUserRole);
      
      if (!canView) {
        throw new ForbiddenException('You do not have permission to view this profile');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          bio: true,
          phone: true,
          timezone: true,
          isVerified: true,
          isOnline: true,
          lastSeenAt: true,
          createdAt: true,
          _count: {
            select: {
              organizedEvents: true,
              eventAttendees: true,
              tasks: true,
              chatMessages: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get recent events
      const recentEvents = await this.getRecentEvents(targetUserId);
      
      // Get recent tasks
      const recentTasks = await this.getRecentTasks(targetUserId);

      return {
        success: true,
        user: {
          ...user,
          recentEvents,
          recentTasks,
        },
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  private async canViewUserProfile(currentUserId: string, targetUserId: string, currentUserRole: string): Promise<boolean> {
    // Users can always view their own profile
    if (currentUserId === targetUserId) {
      return true;
    }

    // Admins can view all profiles
    if (currentUserRole === 'ADMIN') {
      return true;
    }

    // Organizers can view guest profiles and profiles of users in their events
    if (currentUserRole === 'ORGANIZER') {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: { role: true },
      });

      if (targetUser?.role === 'GUEST') {
        return true;
      }

      // Check if target user is in organizer's events
      const organizerEvents = await this.prisma.event.findMany({
        where: { organizerId: currentUserId },
        select: { id: true },
      });

      const eventIds = organizerEvents.map(e => e.id);

      if (eventIds.length > 0) {
        const isInEvent = await this.prisma.eventAttendee.findFirst({
          where: {
            userId: targetUserId,
            eventId: { in: eventIds },
          },
        });

        return !!isInEvent;
      }

      return false;
    }

    // Guests can only view profiles of users in the same events
    if (currentUserRole === 'GUEST') {
      const currentUserEvents = await this.prisma.eventAttendee.findMany({
        where: { userId: currentUserId },
        select: { eventId: true },
      });

      const eventIds = currentUserEvents.map(e => e.eventId);

      if (eventIds.length === 0) {
        return false;
      }

      const isInSameEvent = await this.prisma.eventAttendee.findFirst({
        where: {
          userId: targetUserId,
          eventId: { in: eventIds },
        },
      });

      return !!isInSameEvent;
    }

    return false;
  }

  private async getRecentEvents(userId: string) {
    const organizedEvents = await this.prisma.event.findMany({
      where: { organizerId: userId },
      select: {
        id: true,
        title: true,
        startDate: true,
      },
      orderBy: { startDate: 'desc' },
      take: 3,
    });

    const attendedEvents = await this.prisma.eventAttendee.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
      },
      orderBy: { event: { startDate: 'desc' } },
      take: 3,
    });

    const events = [
      ...organizedEvents.map(e => ({ ...e, role: 'organizer' as const })),
      ...attendedEvents.map(a => ({ ...a.event, role: 'attendee' as const })),
    ];

    return events
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5);
  }

  private async getRecentTasks(userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          { createdById: userId },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return tasks;
  }
}
