import { api } from '../api';

export interface ChatMessage {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VOICE' | 'FILE';
  mediaUrl?: string;
  mediaType?: string;
  duration?: number;
  senderId: string;
  eventId?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  event?: {
    id: string;
    title: string;
  };
}

export interface SendMessageData {
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'VOICE' | 'FILE';
  mediaUrl?: string;
  mediaType?: string;
  duration?: number;
  eventId?: string;
}

export interface MessagesResponse {
  success: boolean;
  messages: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: ChatMessage;
}

export interface EventMessagesResponse {
  success: boolean;
  messages: ChatMessage[];
  event: {
    id: string;
    title: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const chatService = {
  // Get all messages (global and event-specific)
  async getMessages(params?: {
    eventId?: string;
    page?: number;
    limit?: number;
  }): Promise<MessagesResponse> {
    // Clean up params to avoid sending empty strings
    const cleanParams: any = {};
    if (params?.eventId && params.eventId.trim() !== '') {
      cleanParams.eventId = params.eventId;
    }
    if (params?.page) {
      cleanParams.page = params.page;
    }
    if (params?.limit) {
      cleanParams.limit = params.limit;
    }

    const response = await api.get('/chat/messages', { params: cleanParams });
    return response.data;
  },

  // Send a message
  async sendMessage(data: SendMessageData): Promise<SendMessageResponse> {
    // Clean up data to avoid sending empty eventId
    const cleanData: any = {
      content: data.content
    };

    // Include all media-related fields
    if (data.type) {
      cleanData.type = data.type;
    }
    if (data.mediaUrl) {
      cleanData.mediaUrl = data.mediaUrl;
    }
    if (data.mediaType) {
      cleanData.mediaType = data.mediaType;
    }
    if (data.duration) {
      cleanData.duration = data.duration;
    }
    if (data.eventId && data.eventId.trim() !== '') {
      cleanData.eventId = data.eventId;
    }

    const response = await api.post('/chat/messages', cleanData);
    return response.data;
  },

  // Get messages for a specific event
  async getEventMessages(eventId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<EventMessagesResponse> {
    const response = await api.get(`/chat/events/${eventId}/messages`, { params });
    return response.data;
  },

  // Upload image for chat
  async uploadImage(file: File): Promise<{ success: boolean; data: { url: string; filename: string; type: string } }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/chat/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload voice message for chat
  async uploadVoice(file: File): Promise<{ success: boolean; data: { url: string; filename: string; type: string } }> {
    const formData = new FormData();
    formData.append('voice', file);

    const response = await api.post('/chat/upload/voice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload file for chat
  async uploadFile(file: File): Promise<{ success: boolean; data: { url: string; filename: string; type: string } }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/chat/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
