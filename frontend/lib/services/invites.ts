import { api } from '../api';
import { Event } from './events';

export interface InviteResponse {
  success: boolean;
  event: Event;
  userRsvpStatus?: string;
}

export interface RsvpData {
  status: 'ACCEPTED' | 'DECLINED';
}

export interface RsvpResponse {
  success: boolean;
  message: string;
  rsvp: {
    id: string;
    userId: string;
    eventId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface RsvpStatusResponse {
  success: boolean;
  rsvp: {
    id: string;
    userId: string;
    eventId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  event: {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
  };
}

export const invitesService = {
  // Get event by invite code
  async getEventByInviteCode(code: string): Promise<InviteResponse> {
    const response = await api.get(`/invites/${code}`);
    return response.data;
  },

  // RSVP to event using invite code
  async rsvpToEvent(code: string, data: RsvpData): Promise<RsvpResponse> {
    const response = await api.post(`/invites/${code}/rsvp`, data);
    return response.data;
  },

  // Get RSVP status for invite code
  async getRsvpStatus(code: string): Promise<RsvpStatusResponse> {
    const response = await api.get(`/invites/${code}/status`);
    return response.data;
  },

  // Get event invites (for event organizers)
  async getEventInvites(eventId: string) {
    const response = await api.get(`/events/${eventId}/invites`);
    return response.data;
  },

  // Create and send invite via email
  async createInvite(data: { email: string; eventId: string }) {
    const response = await api.post(`/events/${data.eventId}/invites`, {
      email: data.email
    });
    return response.data.invite;
  },

  // Delete invite
  async deleteInvite(inviteId: string) {
    const response = await api.delete(`/invites/${inviteId}`);
    return response.data;
  }
};
