import { api } from '../api';

export interface PollOption {
  id: string;
  text: string;
  order: number;
  pollId: string;
  _count?: {
    votes: number;
  };
  votes?: Array<{ id: string }>;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  createdById: string;
  eventId?: string;
  allowMultiple: boolean;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  event?: {
    id: string;
    title: string;
  };
  options: PollOption[];
  _count?: {
    votes: number;
  };
}

export interface CreatePollData {
  title: string;
  description?: string;
  options: string[];
  eventId?: string;
  allowMultiple?: boolean;
  endDate?: string;
}

export interface UpdatePollData {
  title?: string;
  description?: string;
  endDate?: string;
}

export interface VoteData {
  optionId: string;
}

export interface PollsResponse {
  success: boolean;
  polls: Poll[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PollResponse {
  success: boolean;
  poll: Poll;
}

export interface CreatePollResponse {
  success: boolean;
  message: string;
  poll: Poll;
}

export interface VoteResponse {
  success: boolean;
  message: string;
}

export interface PollResultsResponse {
  success: boolean;
  poll: {
    id: string;
    title: string;
    description?: string;
    totalVotes: number;
    endDate?: string;
    allowMultiple: boolean;
  };
  results: Array<{
    id: string;
    text: string;
    votes: number;
    percentage: number;
  }>;
}

export const pollsService = {
  // Get all polls
  async getPolls(params?: {
    eventId?: string;
    page?: number;
    limit?: number;
  }): Promise<PollsResponse> {
    const response = await api.get('/polls', { params });
    return response.data;
  },

  // Get specific poll by ID
  async getPoll(id: string): Promise<PollResponse> {
    const response = await api.get(`/polls/${id}`);
    return response.data;
  },

  // Create new poll
  async createPoll(data: CreatePollData): Promise<CreatePollResponse> {
    const response = await api.post('/polls', data);
    return response.data;
  },

  // Update poll
  async updatePoll(id: string, data: UpdatePollData): Promise<PollResponse> {
    const response = await api.patch(`/polls/${id}`, data);
    return response.data;
  },

  // Delete poll
  async deletePoll(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/polls/${id}`);
    return response.data;
  },

  // Vote on a poll
  async vote(id: string, data: VoteData): Promise<VoteResponse> {
    const response = await api.post(`/polls/${id}/vote`, data);
    return response.data;
  },

  // Get poll results
  async getResults(id: string): Promise<PollResultsResponse> {
    const response = await api.get(`/polls/${id}/results`);
    return response.data;
  }
};
