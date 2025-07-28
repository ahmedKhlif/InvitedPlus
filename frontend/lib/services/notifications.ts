import api from '../api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  userId: string;
  eventId?: string;
  taskId?: string;
  fromUserId?: string;
  actionUrl?: string;
  priority: NotificationPriority;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  user?: {
    id: string;
    name: string;
    email: string;
  };
  event?: {
    id: string;
    title: string;
  };
  task?: {
    id: string;
    title: string;
  };
  fromUser?: {
    id: string;
    name: string;
  };
}

export enum NotificationType {
  USER_JOINED_EVENT = 'USER_JOINED_EVENT',
  USER_LEFT_EVENT = 'USER_LEFT_EVENT',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_OVERDUE = 'TASK_OVERDUE',
  EVENT_CREATED = 'EVENT_CREATED',
  EVENT_UPDATED = 'EVENT_UPDATED',
  EVENT_CANCELLED = 'EVENT_CANCELLED',
  INVITE_RECEIVED = 'INVITE_RECEIVED',
  INVITE_ACCEPTED = 'INVITE_ACCEPTED',
  INVITE_DECLINED = 'INVITE_DECLINED',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
}

export interface NotificationsResponse {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  userId?: string;
  userIds?: string[];
  eventId?: string;
  taskId?: string;
  fromUserId?: string;
  actionUrl?: string;
}

export const notificationsService = {
  // Get user notifications with pagination and filters
  async getNotifications(params?: GetNotificationsParams): Promise<NotificationsResponse> {
    try {
      console.log('Fetching notifications with params:', params);
      console.log('Token exists:', !!localStorage.getItem('token'));

      const response = await api.get('/notifications', { params });
      console.log('Notifications response:', response.data);

      // Handle different response structures from backend
      const data = response.data;

      // Handle backend response structure
      if (Array.isArray(data)) {
        // Direct array response
        return {
          notifications: data,
          total: data.length,
          page: params?.page || 1,
          limit: params?.limit || 10,
          totalPages: Math.ceil(data.length / (params?.limit || 10)),
          pagination: {
            page: params?.page || 1,
            pages: Math.ceil(data.length / (params?.limit || 10)),
            total: data.length,
            limit: params?.limit || 10
          }
        };
      }

      // Structured response from backend
      const notifications = data.data || data.notifications || [];
      const pagination = data.pagination || {};

      return {
        notifications,
        total: pagination.total || data.total || notifications.length,
        page: pagination.page || data.page || params?.page || 1,
        limit: pagination.limit || data.limit || params?.limit || 10,
        totalPages: pagination.pages || data.totalPages || Math.ceil((pagination.total || notifications.length) / (pagination.limit || 10)),
        pagination: {
          page: pagination.page || data.page || params?.page || 1,
          pages: pagination.pages || data.totalPages || Math.ceil((pagination.total || notifications.length) / (pagination.limit || 10)),
          total: pagination.total || data.total || notifications.length,
          limit: pagination.limit || data.limit || params?.limit || 10
        }
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch notifications:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.config?.url
      });
      // Return empty response if user is not authenticated or other error
      return {
        notifications: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalPages: 0,
        pagination: {
          page: params?.page || 1,
          pages: 0,
          total: 0,
          limit: params?.limit || 10
        }
      };
    }
  },

  // Get unread notifications count
  async getUnreadCount(): Promise<{ count: number }> {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch unread count:', error);
      return { count: 0 };
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ count: number }> {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  },

  // Create notification (admin only)
  async createNotification(data: CreateNotificationData): Promise<Notification | Notification[]> {
    const response = await api.post('/notifications', data);
    return response.data;
  },

  // Trigger notification helpers (for testing)
  async triggerUserJoinedEvent(eventId: string, userId: string): Promise<Notification> {
    const response = await api.post('/notifications/trigger/user-joined-event', {
      eventId,
      userId
    });
    return response.data;
  },

  async triggerTaskAssigned(taskId: string, assigneeId: string): Promise<Notification> {
    const response = await api.post('/notifications/trigger/task-assigned', {
      taskId,
      assigneeId
    });
    return response.data;
  },

  async triggerEventCreated(eventId: string): Promise<Notification[]> {
    const response = await api.post('/notifications/trigger/event-created', {
      eventId
    });
    return response.data;
  },

  // Create test notifications for current user
  async createTestNotifications(): Promise<any> {
    try {
      console.log('🧪 Creating test notifications...');
      console.log('🔑 Token exists:', !!localStorage.getItem('token'));

      const response = await api.post('/notifications/create-test-notifications');
      console.log('✅ Test notifications created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create test notifications:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.config?.url
      });
      throw error;
    }
  }
};

// Utility functions
export const getNotificationIcon = (type: NotificationType): React.ComponentType<{ className?: string }> => {
  switch (type) {
    case NotificationType.USER_JOINED_EVENT:
    case NotificationType.USER_LEFT_EVENT:
      return require('@heroicons/react/24/outline').UsersIcon;
    case NotificationType.TASK_ASSIGNED:
    case NotificationType.TASK_COMPLETED:
    case NotificationType.TASK_OVERDUE:
      return require('@heroicons/react/24/outline').ClipboardDocumentListIcon;
    case NotificationType.EVENT_CREATED:
    case NotificationType.EVENT_UPDATED:
    case NotificationType.EVENT_CANCELLED:
      return require('@heroicons/react/24/outline').CalendarIcon;
    case NotificationType.INVITE_RECEIVED:
    case NotificationType.INVITE_ACCEPTED:
    case NotificationType.INVITE_DECLINED:
      return require('@heroicons/react/24/outline').EnvelopeIcon;
    case NotificationType.CHAT_MESSAGE:
      return require('@heroicons/react/24/outline').ChatBubbleLeftRightIcon;
    case NotificationType.SYSTEM_ANNOUNCEMENT:
      return require('@heroicons/react/24/outline').SpeakerWaveIcon;
    default:
      return require('@heroicons/react/24/outline').BellIcon;
  }
};

export const getNotificationColor = (priority: NotificationPriority): string => {
  switch (priority) {
    case NotificationPriority.LOW:
      return 'text-gray-500';
    case NotificationPriority.NORMAL:
      return 'text-blue-500';
    case NotificationPriority.HIGH:
      return 'text-orange-500';
    case NotificationPriority.URGENT:
      return 'text-red-500';
    default:
      return 'text-blue-500';
  }
};

export const formatNotificationTime = (createdAt: string): string => {
  const now = new Date();
  const notificationTime = new Date(createdAt);
  const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return notificationTime.toLocaleDateString();
};
