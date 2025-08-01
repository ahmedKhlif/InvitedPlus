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

    // Hash password if provided (only for non-OAuth users or when explicitly setting password)
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    // Don't update password field if user is OAuth user and no password provided
    if (!updateUserDto.password && (user.provider === 'google' || user.provider === 'github')) {
      delete updateData.password;
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
        provider: true,
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

    // Build where clause for real database query
    const where: any = {};
    if (action && action !== '') {
      where.action = {
        contains: action,
        mode: 'insensitive'
      };
    }
    if (userId && userId !== '') {
      where.userId = userId;
    }

    try {
      // Get real activity logs from database
      const [logs, total] = await Promise.all([
        this.prisma.activityLog.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.activityLog.count({ where }),
      ]);

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
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);

      // Fallback to empty result if database query fails
      return {
        success: false,
        logs: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
        error: 'Failed to fetch activity logs from database',
      };
    }
  }

  async createTestActivityLogs(adminId: string) {
    try {
      // Get some real users from the database
      const users = await this.prisma.user.findMany({
        take: 5,
        select: { id: true, name: true, email: true }
      });

      if (users.length === 0) {
        return {
          success: false,
          message: 'No users found in database to create test logs'
        };
      }

      // Create test activity logs
      const testLogs = [
        {
          action: 'USER_LOGIN',
          description: 'User logged in successfully',
          userId: users[0]?.id,
          entityType: 'USER',
          entityId: users[0]?.id,
          metadata: { ip: '192.168.1.100', userAgent: 'Chrome/91.0' },
          ipAddress: '192.168.1.100',
          userAgent: 'Chrome/91.0'
        },
        {
          action: 'EVENT_CREATED',
          description: 'New event "Team Building Workshop" was created',
          userId: users[1]?.id || users[0]?.id,
          entityType: 'EVENT',
          entityId: 'event-123',
          metadata: { eventTitle: 'Team Building Workshop', eventType: 'workshop' },
          ipAddress: '192.168.1.101',
          userAgent: 'Firefox/89.0'
        },
        {
          action: 'TASK_COMPLETED',
          description: 'Task "Setup venue decorations" was marked as completed',
          userId: users[2]?.id || users[0]?.id,
          entityType: 'TASK',
          entityId: 'task-456',
          metadata: { taskTitle: 'Setup venue decorations', completionTime: '2 hours' },
          ipAddress: '192.168.1.102',
          userAgent: 'Safari/14.1'
        },
        {
          action: 'MESSAGE_SENT',
          description: 'Message sent in event chat',
          userId: users[3]?.id || users[0]?.id,
          entityType: 'MESSAGE',
          entityId: 'msg-789',
          metadata: { messageLength: 45, eventId: 'event-123' },
          ipAddress: '192.168.1.103',
          userAgent: 'Chrome/91.0'
        },
        {
          action: 'POLL_CREATED',
          description: 'New poll "Venue preference" was created',
          userId: users[4]?.id || users[0]?.id,
          entityType: 'POLL',
          entityId: 'poll-321',
          metadata: { pollTitle: 'Venue preference', optionsCount: 3 },
          ipAddress: '192.168.1.104',
          userAgent: 'Edge/91.0'
        },
        {
          action: 'USER_REGISTERED',
          description: 'New user registered via email',
          userId: adminId,
          entityType: 'USER',
          entityId: adminId,
          metadata: { registrationMethod: 'email', source: 'admin_test' },
          ipAddress: '192.168.1.105',
          userAgent: 'Chrome/91.0'
        }
      ];

      // Create the activity logs in the database
      const createdLogs = await Promise.all(
        testLogs.map(log =>
          this.prisma.activityLog.create({
            data: {
              action: log.action as any,
              description: log.description,
              userId: log.userId,
              entityType: log.entityType,
              entityId: log.entityId,
              metadata: log.metadata,
              ipAddress: log.ipAddress,
              userAgent: log.userAgent
            },
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          })
        )
      );

      return {
        success: true,
        message: `Created ${createdLogs.length} test activity logs`,
        logs: createdLogs
      };
    } catch (error) {
      console.error('Failed to create test activity logs:', error);
      return {
        success: false,
        message: 'Failed to create test activity logs',
        error: error.message
      };
    }
  }

  async generateReport(
    generateReportDto: { type: string; startDate?: string; endDate?: string },
    adminId: string
  ) {
    try {
      const { type, startDate, endDate } = generateReportDto;

      // Set default date range if not provided
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      let reportData: any = {};
      let recordCount = 0;

      switch (type) {
        case 'users':
          reportData = await this.generateUserReport(start, end);
          recordCount = reportData.users?.length || 0;
          break;
        case 'events':
          reportData = await this.generateEventReport(start, end);
          recordCount = reportData.events?.length || 0;
          break;
        case 'tasks':
          reportData = await this.generateTaskReport(start, end);
          recordCount = reportData.tasks?.length || 0;
          break;
        case 'messages':
          reportData = await this.generateMessageReport(start, end);
          recordCount = reportData.messages?.length || 0;
          break;
        case 'analytics':
          reportData = await this.generateAnalyticsReport(start, end);
          recordCount = Object.keys(reportData).length;
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Create report record with type in ID
      const reportId = `${type}_report_${Date.now()}`;
      const report = {
        id: reportId,
        type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        description: `Generated ${type} report from ${start.toDateString()} to ${end.toDateString()}`,
        generatedAt: new Date().toISOString(),
        generatedBy: adminId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        recordCount,
        fileSize: this.calculateFileSize(reportData),
        data: reportData,
        downloadUrl: `/api/admin/reports/${reportId}/download`
      };

      return {
        success: true,
        message: 'Report generated successfully',
        report
      };
    } catch (error) {
      console.error('Failed to generate report:', error);
      return {
        success: false,
        message: 'Failed to generate report',
        error: error.message
      };
    }
  }

  private async generateUserReport(startDate: Date, endDate: Date) {
    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            organizedEvents: true,
            tasks: true,
            chatMessages: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const summary = {
      totalUsers: users.length,
      verifiedUsers: users.filter(u => u.isVerified).length,
      usersByRole: users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return { users, summary };
  }

  private async generateEventReport(startDate: Date, endDate: Date) {
    const events = await this.prisma.event.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        organizer: { select: { name: true, email: true } },
        _count: { select: { attendees: true, tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const summary = {
      totalEvents: events.length,
      activeEvents: events.filter(e => new Date(e.endDate) > new Date()).length,
      completedEvents: events.filter(e => new Date(e.endDate) < new Date()).length,
      totalAttendees: events.reduce((sum, e) => sum + e._count.attendees, 0)
    };

    return { events, summary };
  }

  private async generateTaskReport(startDate: Date, endDate: Date) {
    const tasks = await this.prisma.task.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        assignee: { select: { name: true, email: true } },
        createdBy: { select: { name: true, email: true } },
        event: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const summary = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
      inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      todoTasks: tasks.filter(t => t.status === 'TODO').length,
      completionRate: tasks.length > 0 ? (tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100 : 0
    };

    return { tasks, summary };
  }

  private async generateMessageReport(startDate: Date, endDate: Date) {
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        sender: { select: { name: true, email: true } },
        event: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const summary = {
      totalMessages: messages.length,
      globalMessages: messages.filter(m => !m.eventId).length,
      eventMessages: messages.filter(m => m.eventId).length,
      messagesByUser: messages.reduce((acc, msg) => {
        const userName = msg.sender?.name || 'Unknown';
        acc[userName] = (acc[userName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return { messages, summary };
  }

  private async generateAnalyticsReport(startDate: Date, endDate: Date) {
    const analytics = await this.getAnalytics('custom');

    return {
      dateRange: { startDate, endDate },
      ...analytics.analytics
    };
  }

  private calculateFileSize(data: any): string {
    const jsonString = JSON.stringify(data);
    const sizeInBytes = new Blob([jsonString]).size;
    const sizeInKB = sizeInBytes / 1024;
    const sizeInMB = sizeInKB / 1024;

    if (sizeInMB >= 1) {
      return `${sizeInMB.toFixed(1)} MB`;
    } else {
      return `${sizeInKB.toFixed(1)} KB`;
    }
  }

  async getReports() {
    // For now, return empty array since we don't store reports in database
    // In a real implementation, you would store reports in a database table
    return {
      success: true,
      reports: [],
      message: 'Reports are generated on-demand and not stored permanently'
    };
  }

  async downloadReport(reportId: string, adminId: string) {
    try {
      // Extract report type from reportId (format: "type_report_timestamp")
      const reportType = reportId.split('_')[0]; // Get the first part before underscore

      // Validate report type
      const validTypes = ['users', 'events', 'tasks', 'messages', 'analytics'];
      if (!validTypes.includes(reportType)) {
        throw new Error(`Invalid report type: ${reportType}`);
      }

      // Generate fresh data for the report
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      let csvData = '';

      switch (reportType) {
        case 'users':
          csvData = await this.generateUserCSV(startDate, endDate);
          break;
        case 'events':
          csvData = await this.generateEventCSV(startDate, endDate);
          break;
        case 'tasks':
          csvData = await this.generateTaskCSV(startDate, endDate);
          break;
        case 'messages':
          csvData = await this.generateMessageCSV(startDate, endDate);
          break;
        case 'analytics':
          csvData = await this.generateAnalyticsCSV(startDate, endDate);
          break;
        default:
          throw new Error('Invalid report type');
      }

      return {
        success: true,
        data: csvData,
        filename: `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`,
        contentType: 'text/csv'
      };
    } catch (error) {
      console.error('Failed to download report:', error);
      return {
        success: false,
        message: 'Failed to download report',
        error: error.message
      };
    }
  }

  private async generateUserCSV(startDate: Date, endDate: Date): Promise<string> {
    const reportData = await this.generateUserReport(startDate, endDate);

    let csv = 'ID,Name,Email,Role,Verified,Created At,Events Organized,Tasks Assigned,Messages Sent\n';

    reportData.users.forEach(user => {
      csv += `"${user.id}","${user.name}","${user.email}","${user.role}","${user.isVerified}","${user.createdAt}","${user._count.organizedEvents}","${user._count.tasks}","${user._count.chatMessages}"\n`;
    });

    return csv;
  }

  private async generateEventCSV(startDate: Date, endDate: Date): Promise<string> {
    const reportData = await this.generateEventReport(startDate, endDate);

    let csv = 'ID,Title,Description,Start Date,End Date,Location,Organizer,Attendees,Tasks,Created At\n';

    reportData.events.forEach(event => {
      csv += `"${event.id}","${event.title}","${event.description || ''}","${event.startDate}","${event.endDate}","${event.location || ''}","${event.organizer.name}","${event._count.attendees}","${event._count.tasks}","${event.createdAt}"\n`;
    });

    return csv;
  }

  private async generateTaskCSV(startDate: Date, endDate: Date): Promise<string> {
    const reportData = await this.generateTaskReport(startDate, endDate);

    let csv = 'ID,Title,Description,Status,Priority,Due Date,Assignee,Creator,Event,Created At,Completed At\n';

    reportData.tasks.forEach(task => {
      csv += `"${task.id}","${task.title}","${task.description || ''}","${task.status}","${task.priority}","${task.dueDate || ''}","${task.assignee?.name || ''}","${task.createdBy.name}","${task.event.title}","${task.createdAt}","${task.completedAt || ''}"\n`;
    });

    return csv;
  }

  private async generateMessageCSV(startDate: Date, endDate: Date): Promise<string> {
    const reportData = await this.generateMessageReport(startDate, endDate);

    let csv = 'ID,Content,Sender,Event,Type,Created At\n';

    reportData.messages.forEach(message => {
      csv += `"${message.id}","${message.content}","${message.sender?.name || 'Unknown'}","${message.event?.title || 'Global'}","${message.type}","${message.createdAt}"\n`;
    });

    return csv;
  }

  private async generateAnalyticsCSV(startDate: Date, endDate: Date): Promise<string> {
    const reportData = await this.generateAnalyticsReport(startDate, endDate);

    let csv = 'Metric,Value\n';

    Object.entries(reportData).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          // Handle nested objects properly
          if (typeof subValue === 'object' && subValue !== null) {
            csv += `"${key} - ${subKey}","${JSON.stringify(subValue)}"\n`;
          } else {
            csv += `"${key} - ${subKey}","${subValue}"\n`;
          }
        });
      } else if (Array.isArray(value)) {
        csv += `"${key}","${value.length} items"\n`;
      } else {
        csv += `"${key}","${value}"\n`;
      }
    });

    return csv;
  }
}
