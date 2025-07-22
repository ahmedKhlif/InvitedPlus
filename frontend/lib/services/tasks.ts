import { api } from '../api';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assignedToId?: string;
  eventId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  event?: {
    id: string;
    title: string;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assignedToId?: string;
  eventId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assignedToId?: string;
}

export interface TasksResponse {
  success: boolean;
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TaskResponse {
  success: boolean;
  task: Task;
}

export interface CreateTaskResponse {
  success: boolean;
  message: string;
  task: Task;
}

export interface TaskStatsResponse {
  success: boolean;
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    overdue: number;
    byPriority: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      URGENT: number;
    };
    byStatus: {
      TODO: number;
      IN_PROGRESS: number;
      COMPLETED: number;
    };
  };
}

export const tasksService = {
  // Get all tasks
  async getTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    eventId?: string;
    search?: string;
    assignedToId?: string;
  }): Promise<TasksResponse> {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  // Get specific task by ID
  async getTask(id: string): Promise<TaskResponse> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create new task
  async createTask(data: CreateTaskData): Promise<CreateTaskResponse> {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  // Update task
  async updateTask(id: string, data: UpdateTaskData): Promise<TaskResponse> {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },

  // Delete task
  async deleteTask(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Get task statistics for an event
  async getTaskStats(eventId: string): Promise<TaskStatsResponse> {
    const response = await api.get(`/tasks/stats/${eventId}`);
    return response.data;
  }
};
