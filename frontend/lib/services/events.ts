import { api } from '../api';

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxAttendees?: number;
  inviteCode: string;
  organizerId: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  organizer: {
    id: string;
    name: string;
    email: string;
  };
  attendees?: Array<{
    id: string;
    userId: string;
    eventId: string;
    status: string;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  _count?: {
    attendees: number;
  };
}

export interface CreateEventData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxAttendees?: number;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  maxAttendees?: number;
}

export interface EventsResponse {
  success: boolean;
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface EventResponse {
  success: boolean;
  event: Event;
}

export interface AttendeesResponse {
  success: boolean;
  attendees: Array<{
    id: string;
    userId: string;
    eventId: string;
    status: string;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export const eventsService = {
  // Get all events for the user
  async getEvents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<EventsResponse> {
    const response = await api.get('/events', { params });
    return response.data;
  },

  // Get specific event by ID
  async getEvent(id: string): Promise<EventResponse> {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  // Create new event
  async createEvent(data: CreateEventData): Promise<EventResponse> {
    const response = await api.post('/events', data);
    return response.data;
  },

  // Update event
  async updateEvent(id: string, data: UpdateEventData): Promise<EventResponse> {
    const response = await api.patch(`/events/${id}`, data);
    return response.data;
  },

  // Delete event
  async deleteEvent(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  // Get event attendees
  async getAttendees(id: string): Promise<AttendeesResponse> {
    const response = await api.get(`/events/${id}/attendees`);
    return response.data;
  },

  // Join event
  async joinEvent(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/events/${id}/join`);
    return response.data;
  },

  // Leave event
  async leaveEvent(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/events/${id}/leave`);
    return response.data;
  }
};
