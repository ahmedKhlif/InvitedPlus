import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateNotificationDto, UpdateNotificationDto, GetNotificationsDto } from './dto/create-notification.dto';
import { NotificationType, NotificationPriority, Role } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Create notification for single user
  async createNotification(createNotificationDto: CreateNotificationDto) {
    const { userIds, userId, ...notificationData } = createNotificationDto;
    
    // If userIds array is provided, create multiple notifications
    if (userIds && userIds.length > 0) {
      const notifications = await Promise.all(
        userIds.map(id => 
          this.prisma.notification.create({
            data: {
              ...notificationData,
              userId: id,
            },
            include: {
              user: { select: { id: true, name: true, email: true } },
              event: { select: { id: true, title: true } },
              task: { select: { id: true, title: true } },
              fromUser: { select: { id: true, name: true } }
            }
          })
        )
      );
      return notifications;
    }

    // Single notification
    if (!userId) {
      throw new Error('Either userId or userIds must be provided');
    }

    return this.prisma.notification.create({
      data: {
        ...notificationData,
        userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
        fromUser: { select: { id: true, name: true } }
      }
    });
  }

  // Get notifications for a user with pagination and filters
  async getUserNotifications(userId: string, query: GetNotificationsDto) {
    const { page = 1, limit = 20, isRead, type } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (isRead !== undefined) where.isRead = isRead;
    if (type) where.type = type;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          event: { select: { id: true, title: true } },
          task: { select: { id: true, title: true } },
          fromUser: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where })
    ]);

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only update your own notifications');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      include: {
        event: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
        fromUser: { select: { id: true, name: true } }
      }
    });
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  // Get unread count for a user
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false }
    });
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only delete your own notifications');
    }

    return this.prisma.notification.delete({
      where: { id: notificationId }
    });
  }

  // Role-based notification helpers
  async notifyEventOrganizers(eventId: string, notification: Omit<CreateNotificationDto, 'userId' | 'userIds'>) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { organizer: true }
    });

    if (!event) return null;

    return this.createNotification({
      ...notification,
      userId: event.organizerId,
      eventId
    });
  }

  async notifyEventAttendees(eventId: string, notification: Omit<CreateNotificationDto, 'userId' | 'userIds'>) {
    const attendees = await this.prisma.eventAttendee.findMany({
      where: { eventId },
      include: { user: true }
    });

    const userIds = attendees.map(attendee => attendee.userId);
    
    if (userIds.length === 0) return [];

    return this.createNotification({
      ...notification,
      userIds,
      eventId
    });
  }

  async notifyTaskAssignee(taskId: string, notification: Omit<CreateNotificationDto, 'userId' | 'userIds'>) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true }
    });

    if (!task || !task.assigneeId) return null;

    return this.createNotification({
      ...notification,
      userId: task.assigneeId,
      taskId
    });
  }

  async notifyAdmins(notification: Omit<CreateNotificationDto, 'userId' | 'userIds'>) {
    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN }
    });

    const userIds = admins.map(admin => admin.id);
    
    if (userIds.length === 0) return [];

    return this.createNotification({
      ...notification,
      userIds
    });
  }

  // Trigger notifications based on events
  async triggerUserJoinedEvent(eventId: string, userId: string, fromUserId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { organizer: true }
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!event || !user) return null;

    return this.notifyEventOrganizers(eventId, {
      title: 'New Event Attendee',
      message: `${user.name} has joined your event "${event.title}"`,
      type: NotificationType.USER_JOINED_EVENT,
      fromUserId,
      actionUrl: `/events/${eventId}/attendees`
    });
  }

  async triggerTaskAssigned(taskId: string, assigneeId: string, fromUserId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { event: true }
    });

    if (!task) return null;

    return this.notifyTaskAssignee(taskId, {
      title: 'New Task Assigned',
      message: `You have been assigned a new task: "${task.title}"`,
      type: NotificationType.TASK_ASSIGNED,
      fromUserId,
      priority: task.priority === 'HIGH' ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      actionUrl: `/events/${task.eventId}/tasks/${taskId}`
    });
  }

  async triggerEventCreated(eventId: string, organizerId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) return null;

    return this.notifyAdmins({
      title: 'New Event Created',
      message: `A new event "${event.title}" has been created`,
      type: NotificationType.EVENT_CREATED,
      fromUserId: organizerId,
      actionUrl: `/events/${eventId}`
    });
  }
}
