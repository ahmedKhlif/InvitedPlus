import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, UpdateNotificationDto, GetNotificationsDto } from './dto/create-notification.dto';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getUserNotifications(
    @Request() req: any,
    @Query() query: GetNotificationsDto
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    if (!userId) {
      // Return empty response if no user ID
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        }
      };
    }
    return this.notificationsService.getUserNotifications(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    if (!userId) {
      return { count: 0 };
    }
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Param('id') notificationId: string,
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  async deleteNotification(
    @Param('id') notificationId: string,
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.notificationsService.deleteNotification(notificationId, userId);
  }

  // Trigger endpoints for testing
  @Post('trigger/user-joined-event')
  @ApiOperation({ summary: 'Trigger user joined event notification' })
  async triggerUserJoinedEvent(
    @Body() body: { eventId: string; userId: string },
    @Request() req: any
  ) {
    const fromUserId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.notificationsService.triggerUserJoinedEvent(
      body.eventId,
      body.userId,
      fromUserId
    );
  }

  @Post('trigger/task-assigned')
  @ApiOperation({ summary: 'Trigger task assigned notification' })
  async triggerTaskAssigned(
    @Body() body: { taskId: string; assigneeId: string },
    @Request() req: any
  ) {
    const fromUserId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.notificationsService.triggerTaskAssigned(
      body.taskId,
      body.assigneeId,
      fromUserId
    );
  }

  @Post('trigger/event-created')
  @ApiOperation({ summary: 'Trigger event created notification' })
  async triggerEventCreated(
    @Body() body: { eventId: string },
    @Request() req: any
  ) {
    const organizerId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.notificationsService.triggerEventCreated(body.eventId, organizerId);
  }

  @Post('create-test-notifications')
  @ApiOperation({ summary: 'Create test notifications for current user' })
  @ApiResponse({ status: 201, description: 'Test notifications created' })
  async createTestNotifications(@Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    const userRole = req.user?.role || 'GUEST';

    if (!userId) {
      return {
        message: 'User not authenticated',
        count: 0,
        notifications: []
      };
    }

    // Role-specific notifications
    let testNotifications = [];

    if (userRole === 'ADMIN') {
      testNotifications = [
        {
          userId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'Admin: System Maintenance',
          message: 'Scheduled system maintenance will occur tonight at 2 AM. All services will be temporarily unavailable.',
          priority: NotificationPriority.HIGH,
          actionUrl: '/admin/maintenance'
        },
        {
          userId,
          type: NotificationType.USER_JOINED_EVENT,
          title: 'Admin: New User Registration',
          message: 'A new user has registered on the platform. Please review their profile for approval.',
          priority: NotificationPriority.NORMAL,
          actionUrl: '/admin/users'
        },
        {
          userId,
          type: NotificationType.EVENT_CREATED,
          title: 'Admin: Event Requires Approval',
          message: 'A new event "Corporate Team Building" has been created and requires admin approval.',
          priority: NotificationPriority.HIGH,
          actionUrl: '/admin/events'
        }
      ];
    } else if (userRole === 'ORGANIZER') {
      testNotifications = [
        {
          userId,
          type: NotificationType.USER_JOINED_EVENT,
          title: 'New Attendee Joined',
          message: 'Sarah Johnson has joined your "Summer Networking Event". Total attendees: 45',
          priority: NotificationPriority.NORMAL,
          actionUrl: '/events/my-events'
        },
        {
          userId,
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task Assignment Reminder',
          message: 'You have 3 pending task assignments for your upcoming events. Please review and assign.',
          priority: NotificationPriority.HIGH,
          actionUrl: '/tasks'
        },
        {
          userId,
          type: NotificationType.EVENT_UPDATED,
          title: 'Event Budget Update',
          message: 'Your event budget for "Annual Conference 2025" has been approved. You can now proceed with bookings.',
          priority: NotificationPriority.NORMAL,
          actionUrl: '/events/budget'
        }
      ];
    } else { // GUEST
      testNotifications = [
        {
          userId,
          type: NotificationType.USER_JOINED_EVENT,
          title: 'Welcome to Event+!',
          message: 'You have successfully joined the platform. Start exploring events and connecting with others.',
          priority: NotificationPriority.NORMAL,
          actionUrl: '/dashboard'
        },
        {
          userId,
          type: NotificationType.TASK_ASSIGNED,
          title: 'New Task Assigned',
          message: 'You have been assigned a new task: "Setup event decorations". Please check your tasks page.',
          priority: NotificationPriority.HIGH,
          actionUrl: '/tasks'
        },
        {
          userId,
          type: NotificationType.INVITE_RECEIVED,
          title: 'Event Invitation',
          message: 'You have been invited to "Tech Meetup 2025". RSVP by March 15th to secure your spot.',
          priority: NotificationPriority.NORMAL,
          actionUrl: '/invites'
        },
        {
          userId,
          type: NotificationType.CHAT_MESSAGE,
          title: 'New Message',
          message: 'You have a new message from the event organizer about "Summer Networking Event".',
          priority: NotificationPriority.LOW,
          actionUrl: '/chat'
        }
      ];
    }

    const createdNotifications = [];
    for (const notification of testNotifications) {
      const created = await this.notificationsService.createNotification(notification);
      createdNotifications.push(created);
    }

    return {
      message: 'Test notifications created successfully',
      count: createdNotifications.length,
      notifications: createdNotifications
    };
  }
}
