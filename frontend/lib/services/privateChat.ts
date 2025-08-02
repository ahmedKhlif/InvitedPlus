import api from '@/lib/api';

export interface PrivateMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: string;
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
  };
  receiver: {
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
  };
  reactions?: Array<{
    id: string;
    emoji: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>;
}

export interface SendPrivateMessageData {
  receiverId: string;
  content: string;
  messageType?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface ConversationResponse {
  success: boolean;
  messages: PrivateMessage[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SendPrivateMessageResponse {
  success: boolean;
  message: PrivateMessage;
}

export const privateChatService = {
  // Send a private message
  async sendMessage(data: SendPrivateMessageData): Promise<SendPrivateMessageResponse> {
    const response = await api.post('/private-chat/send', data);
    return response.data;
  },

  // Get conversation with a user
  async getConversation(userId: string, page = 1, limit = 50): Promise<ConversationResponse> {
    const response = await api.get(`/private-chat/conversation/${userId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Mark messages as read
  async markAsRead(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/private-chat/mark-read/${userId}`);
    return response.data;
  },

  // Get unread message count
  async getUnreadCount(): Promise<{ success: boolean; unreadCount: number }> {
    const response = await api.get('/private-chat/unread-count');
    return response.data;
  },

  // Add reaction to message
  async addReaction(messageId: string, emoji: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/private-chat/messages/${messageId}/react`, { emoji });
    return response.data;
  },

  // Remove reaction from message
  async removeReaction(messageId: string, emoji: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/private-chat/messages/${messageId}/react/${emoji}`);
    return response.data;
  },

  // Delete message
  async deleteMessage(messageId: string): Promise<{ success: boolean; message: string; messageId: string }> {
    const response = await api.delete(`/private-chat/messages/${messageId}`);
    return response.data;
  },

  // Upload image for private chat
  async uploadImage(file: File): Promise<{ success: boolean; data: { url: string; filename: string; type: string } }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/private-chat/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload voice message for private chat
  async uploadVoice(file: File): Promise<{ success: boolean; data: { url: string; filename: string; type: string } }> {
    const formData = new FormData();
    formData.append('voice', file);

    const response = await api.post('/private-chat/upload/voice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload file for private chat
  async uploadFile(file: File): Promise<{ success: boolean; data: { url: string; filename: string; type: string } }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/private-chat/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
