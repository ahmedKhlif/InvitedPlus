import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/admin.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(query: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
  }) {
    const { page, limit, search, role } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isVerified: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              organizedEvents: true,
              tasks: true,
              chatMessages: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        organizedEvents: {
          select: {
            id: true,
            title: true,
            startDate: true,
            _count: { select: { attendees: true } },
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
        _count: {
          select: {
            organizedEvents: true,
            tasks: true,
            chatMessages: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { success: true, user };
  }

  async createUser(createUserDto: CreateUserDto, adminId: string) {
    const { email, password, name, role } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role as any, // Type assertion for enum
        isVerified: true, // Admin-created users are auto-verified
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Log admin action
    await this.logAdminAction(adminId, 'CREATE_USER', `Created user: ${email}`);

    return { success: true, user, message: 'User created successfully' };
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = { ...updateUserDto };

    // Hash password if provided
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    // Log admin action
    await this.logAdminAction(adminId, 'UPDATE_USER', `Updated user: ${user.email}`);

    return { success: true, user: updatedUser, message: 'User updated successfully' };
  }

  async updateUserRole(id: string, role: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admin from changing their own role
    if (id === adminId) {
      throw new ForbiddenException('Cannot change your own role');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role: role as any }, // Type assertion for enum
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Log admin action
    await this.logAdminAction(adminId, 'UPDATE_USER_ROLE', `Changed role of ${user.email} to ${role}`);

    return { success: true, user: updatedUser, message: 'User role updated successfully' };
  }

  async deleteUser(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admin from deleting themselves
    if (id === adminId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    await this.prisma.user.delete({ where: { id } });

    // Log admin action
    await this.logAdminAction(adminId, 'DELETE_USER', `Deleted user: ${user.email}`);

    return { success: true, message: 'User deleted successfully' };
  }

  async getPlatformStats() {
    const [
      totalUsers,
      totalEvents,
      totalTasks,
      totalMessages,
      totalPolls,
      recentUsers,
      activeEvents,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.event.count(),
      this.prisma.task.count(),
      this.prisma.chatMessage.count(),
      this.prisma.poll.count(),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      this.prisma.event.count({
        where: {
          startDate: {
            gte: new Date(),
          },
        },
      }),
    ]);

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    return {
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        totalTasks,
        totalMessages,
        totalPolls,
        recentUsers,
        activeEvents,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count.role;
          return acc;
        }, {}),
      },
    };
  }

  async getAnalytics(range?: string) {
    const days = this.getAnalyticsRange(range);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      userGrowth,
      eventMetrics,
      taskMetrics,
      engagementMetrics,
    ] = await Promise.all([
      this.getUserGrowthData(startDate),
      this.getEventMetrics(startDate),
      this.getTaskMetrics(startDate),
      this.getEngagementMetrics(startDate),
    ]);

    return {
      success: true,
      analytics: {
        userGrowth,
        eventMetrics,
        taskMetrics,
        engagementMetrics,
        timeRange: range || '30d',
      },
    };
  }

  async getAllEvents(query: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        include: {
          organizer: { select: { id: true, name: true, email: true } },
          _count: { select: { attendees: true, tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      success: true,
      events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async deleteEvent(id: string, adminId: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.prisma.event.delete({ where: { id } });

    // Log admin action
    await this.logAdminAction(adminId, 'DELETE_EVENT', `Deleted event: ${event.title}`);

    return { success: true, message: 'Event deleted successfully' };
  }

  async getAllTasks(query: { page: number; limit: number }) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        skip,
        take: limit,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          event: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count(),
    ]);

    return {
      success: true,
      tasks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }



  private async logAdminAction(adminId: string, action: string, details: string) {
    // Log to console for now - in production, this would go to a proper logging system
    console.log(`[ADMIN ACTION] ${new Date().toISOString()} - Admin ${adminId}: ${action} - ${details}`);
  }

  private getAnalyticsRange(range?: string): number {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }

  private async getUserGrowthData(startDate: Date) {
    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by day
    const growthData = users.reduce((acc, user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(growthData).map(([date, count]) => ({
      date,
      newUsers: count,
    }));
  }

  private async getEventMetrics(startDate: Date) {
    const [totalEvents, activeEvents, completedEvents] = await Promise.all([
      this.prisma.event.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      this.prisma.event.count({
        where: {
          startDate: {
            gte: new Date(),
          },
          createdAt: {
            gte: startDate,
          },
        },
      }),
      this.prisma.event.count({
        where: {
          endDate: {
            lt: new Date(),
          },
          createdAt: {
            gte: startDate,
          },
        },
      }),
    ]);

    const avgAttendees = await this.prisma.event.aggregate({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _avg: {
        maxAttendees: true,
      },
    });

    return {
      totalEvents,
      activeEvents,
      completedEvents,
      averageAttendees: avgAttendees._avg.maxAttendees || 0,
    };
  }

  private async getTaskMetrics(startDate: Date) {
    const [totalTasks, completedTasks, inProgressTasks] = await Promise.all([
      this.prisma.task.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      this.prisma.task.count({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
          },
        },
      }),
      this.prisma.task.count({
        where: {
          status: 'IN_PROGRESS',
          createdAt: {
            gte: startDate,
          },
        },
      }),
    ]);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }

  private async getEngagementMetrics(startDate: Date) {
    const [totalMessages, totalPolls, totalRsvps] = await Promise.all([
      this.prisma.chatMessage.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      this.prisma.poll.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      this.prisma.eventAttendee.count({
        where: {
          joinedAt: {
            gte: startDate,
          },
        },
      }),
    ]);

    return {
      totalMessages,
      totalPolls,
      totalRsvps,
    };
  }

  async getActivityLogs(filters: {
    action?: string;
    userId?: string;
    page: number;
    limit: number;
  }) {
    const { action, userId, page, limit } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (action && action !== '') {
      where.action = action;
    }
    if (userId && userId !== '') {
      where.userId = userId;
    }

    // For now, we'll create mock activity logs since we don't have an ActivityLog model
    // In a real application, you would have an ActivityLog table
    const mockLogs = [
      {
        id: '1',
        action: 'USER_LOGIN',
        description: 'User logged in successfully',
        userId: 'user1',
        user: { id: 'user1', name: 'John Doe', email: 'john@test.com' },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        metadata: { ip: '192.168.1.1', userAgent: 'Chrome' },
      },
      {
        id: '2',
        action: 'EVENT_CREATED',
        description: 'New event "Team Meeting" created',
        userId: 'user2',
        user: { id: 'user2', name: 'Jane Smith', email: 'jane@test.com' },
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        metadata: { eventId: 'event1', eventTitle: 'Team Meeting' },
      },
      {
        id: '3',
        action: 'TASK_COMPLETED',
        description: 'Task "Setup venue" marked as completed',
        userId: 'user3',
        user: { id: 'user3', name: 'Bob Wilson', email: 'bob@test.com' },
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        metadata: { taskId: 'task1', taskTitle: 'Setup venue' },
      },
      {
        id: '4',
        action: 'USER_REGISTERED',
        description: 'New user registered',
        userId: 'user4',
        user: { id: 'user4', name: 'Alice Brown', email: 'alice@test.com' },
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        metadata: { registrationMethod: 'email' },
      },
      {
        id: '5',
        action: 'POLL_CREATED',
        description: 'New poll "Venue preference" created',
        userId: 'user2',
        user: { id: 'user2', name: 'Jane Smith', email: 'jane@test.com' },
        createdAt: new Date(Date.now() - 18000000).toISOString(),
        metadata: { pollId: 'poll1', pollTitle: 'Venue preference' },
      },
      {
        id: '6',
        action: 'MESSAGE_SENT',
        description: 'Message sent in event chat',
        userId: 'user1',
        user: { id: 'user1', name: 'John Doe', email: 'john@test.com' },
        createdAt: new Date(Date.now() - 21600000).toISOString(),
        metadata: { eventId: 'event1', messageLength: 45 },
      },
    ];

    // Filter logs based on criteria
    let filteredLogs = mockLogs;
    if (action && action !== '') {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }
    if (userId && userId !== '') {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    // Paginate
    const total = filteredLogs.length;
    const logs = filteredLogs.slice(skip, skip + limit);

    return {
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
