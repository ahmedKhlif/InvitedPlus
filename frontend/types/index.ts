// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'ORGANIZER' | 'GUEST';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Event types
export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  isPublic: boolean;
  maxAttendees?: number;
  organizerId: string;
  organizer: User;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

// Invitation types
export interface Invitation {
  id: string;
  eventId: string;
  event: Event;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  invitedBy: string;
  invitedAt: string;
  respondedAt?: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  assigneeId?: string;
  assignee?: User;
  eventId: string;
  event: Event;
  createdById: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  sender: User;
  eventId: string;
  createdAt: string;
}

// Poll types
export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  eventId: string;
  createdById: string;
  createdBy: User;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  pollId: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface EventForm {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  isPublic: boolean;
  maxAttendees?: number;
}

export interface TaskForm {
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  assigneeId?: string;
}
