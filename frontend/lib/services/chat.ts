import { api } from '../api';

export interface ChatMessage {
  id: string;
  content: string;
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
  }
};
