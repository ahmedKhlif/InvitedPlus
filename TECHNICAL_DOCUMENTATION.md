# InvitedPlus - Comprehensive Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [Feature Implementation Guide](#feature-implementation-guide)
7. [API Documentation](#api-documentation)
8. [WebSocket Implementation](#websocket-implementation)
9. [Frontend Architecture](#frontend-architecture)
10. [Backend Architecture](#backend-architecture)
11. [Security Implementation](#security-implementation)
12. [Development Workflow](#development-workflow)
13. [Deployment Guide](#deployment-guide)
14. [Troubleshooting](#troubleshooting)

## Architecture Overview

InvitedPlus is a full-stack event management platform built with modern web technologies. The application follows a microservices-inspired architecture with clear separation of concerns.

### System Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│ (PostgreSQL)    │
│                 │    │                 │    │                 │
│ - React 18      │    │ - REST APIs     │    │ - Prisma ORM    │
│ - TypeScript    │    │ - WebSocket     │    │ - Migrations    │
│ - Tailwind CSS  │    │ - JWT Auth      │    │ - Seeding       │
│ - Socket.IO     │    │ - File Upload   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              WebSocket Connection
              (Real-time features)
```

### Core Components
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: NestJS with TypeScript, Prisma ORM, Socket.IO
- **Database**: PostgreSQL with Prisma migrations
- **Authentication**: JWT tokens with refresh mechanism
- **Real-time**: WebSocket connections for live collaboration
- **File Storage**: Local file system with organized directory structure

## Technology Stack

### Frontend Technologies
- **Next.js 14**: React framework with App Router
- **React 18**: UI library with hooks and context
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Socket.IO Client**: Real-time communication
- **Axios**: HTTP client for API requests
- **React Hook Form**: Form handling and validation
- **Lucide React**: Icon library

### Backend Technologies
- **NestJS**: Progressive Node.js framework
- **TypeScript**: Type-safe server-side development
- **Prisma**: Next-generation ORM
- **PostgreSQL**: Relational database
- **Socket.IO**: Real-time bidirectional communication
- **JWT**: JSON Web Tokens for authentication
- **Passport**: Authentication middleware
- **Multer**: File upload handling
- **Sharp**: Image processing
- **Nodemailer**: Email sending
- **Swagger**: API documentation

### DevOps & Deployment
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and load balancer
- **PM2**: Process management (production)

## Project Structure

```
InvitedPlus/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App Router pages and layouts
│   │   ├── (auth)/         # Authentication pages
│   │   ├── admin/          # Admin dashboard
│   │   ├── events/         # Event management
│   │   ├── profile/        # User profile
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Reusable React components
│   │   ├── ui/            # Base UI components
│   │   ├── forms/         # Form components
│   │   └── layout/        # Layout components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── backend/                # NestJS backend application
│   ├── src/               # Source code
│   │   ├── auth/          # Authentication module
│   │   ├── users/         # User management
│   │   ├── events/        # Event management
│   │   ├── tasks/         # Task management
│   │   ├── chat/          # Chat system
│   │   ├── whiteboard/    # Whiteboard collaboration
│   │   ├── notifications/ # Notification system
│   │   ├── websocket/     # WebSocket gateway
│   │   └── common/        # Shared utilities
│   ├── prisma/            # Database schema and migrations
│   ├── uploads/           # File storage
│   └── scripts/           # Utility scripts
├── nginx/                 # Nginx configuration
├── docs/                  # Additional documentation
└── scripts/               # Deployment scripts
```

## Database Schema

The application uses PostgreSQL with Prisma ORM for type-safe database operations.

### Core Entities

#### User Entity
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  avatar      String?
  role        Role     @default(USER)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  organizedEvents    Event[]           @relation("EventOrganizer")
  attendedEvents     EventAttendee[]
  sentInvites        Invite[]          @relation("InviteSender")
  receivedInvites    Invite[]          @relation("InviteReceiver")
  tasks              Task[]
  assignedTasks      Task[]            @relation("TaskAssignee")
  chatMessages       ChatMessage[]
  privateChats       PrivateChat[]     @relation("PrivateChatParticipants")
  notifications      Notification[]
  whiteboardElements WhiteboardElement[]
}
```

#### Event Entity
```prisma
model Event {
  id           String   @id @default(cuid())
  title        String
  description  String?
  location     String?
  startDate    DateTime
  endDate      DateTime?
  maxAttendees Int?
  isPublic     Boolean  @default(false)
  status       EventStatus @default(DRAFT)
  organizerId  String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relationships
  organizer    User            @relation("EventOrganizer", fields: [organizerId], references: [id])
  attendees    EventAttendee[]
  invites      Invite[]
  tasks        Task[]
  chatMessages ChatMessage[]
  whiteboards  Whiteboard[]
  polls        Poll[]
}
```

#### Task Entity
```prisma
model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  dueDate     DateTime?
  eventId     String
  creatorId   String
  assigneeId  String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relationships
  event       Event      @relation(fields: [eventId], references: [id])
  creator     User       @relation(fields: [creatorId], references: [id])
  assignee    User?      @relation("TaskAssignee", fields: [assigneeId], references: [id])
}
```

### Enums
```prisma
enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}

enum EventStatus {
  DRAFT
  PUBLISHED
  ONGOING
  COMPLETED
  CANCELLED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum InviteStatus {
  PENDING
  ACCEPTED
  DECLINED
  CANCELLED
}
```

### Database Relationships
- **One-to-Many**: User → Events (organizer), Event → Tasks, Event → Attendees
- **Many-to-Many**: Users ↔ Events (through EventAttendee), Users ↔ PrivateChats
- **Self-referencing**: User → User (friends), Task → Task (subtasks)

### Indexes and Performance
```sql
-- Frequently queried fields
CREATE INDEX idx_events_organizer ON "Event"("organizerId");
CREATE INDEX idx_events_date ON "Event"("startDate");
CREATE INDEX idx_tasks_event ON "Task"("eventId");
CREATE INDEX idx_tasks_assignee ON "Task"("assigneeId");
CREATE INDEX idx_invites_receiver ON "Invite"("receiverId");
```

## Authentication & Authorization

### JWT Implementation

The application uses a dual-token system for secure authentication:

#### Token Structure
```typescript
// Access Token (15 minutes)
interface AccessTokenPayload {
  sub: string;        // User ID
  email: string;      // User email
  role: Role;         // User role
  iat: number;        // Issued at
  exp: number;        // Expires at
}

// Refresh Token (7 days)
interface RefreshTokenPayload {
  sub: string;        // User ID
  tokenVersion: number; // For token invalidation
  iat: number;
  exp: number;
}
```

#### Authentication Flow
```typescript
// 1. Login Request
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// 2. Response with tokens
{
  "success": true,
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

// 3. Token refresh
POST /auth/refresh
Authorization: Bearer <refreshToken>

// 4. Protected route access
GET /api/protected
Authorization: Bearer <accessToken>
```

### Role-Based Access Control (RBAC)

#### Role Hierarchy
```typescript
enum Role {
  USER = 'USER',           // Basic user permissions
  ADMIN = 'ADMIN',         // Administrative permissions
  SUPER_ADMIN = 'SUPER_ADMIN' // Full system access
}
```

#### Permission Matrix
| Feature | USER | ADMIN | SUPER_ADMIN |
|---------|------|-------|-------------|
| Create Events | ✅ | ✅ | ✅ |
| Manage Own Events | ✅ | ✅ | ✅ |
| Manage All Events | ❌ | ✅ | ✅ |
| User Management | ❌ | ✅ | ✅ |
| System Settings | ❌ | ❌ | ✅ |
| View Analytics | ❌ | ✅ | ✅ |

#### Guards Implementation
```typescript
// JWT Auth Guard
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean {
    return super.canActivate(context);
  }
}

// Role Guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

### Frontend Authentication

#### Auth Context
```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Usage in components
const { user, login, logout, isAuthenticated } = useAuth();
```

#### Protected Routes
```typescript
// Route protection wrapper
export function ProtectedRoute({ children, requiredRole }: {
  children: React.ReactNode;
  requiredRole?: Role;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginPage />;
  if (requiredRole && user?.role !== requiredRole) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
}
```

## Feature Implementation Guide

### 1. Real-time Whiteboard Collaboration

#### Architecture Overview
The whiteboard system uses Canvas API with Socket.IO for real-time synchronization.

#### Frontend Implementation
```typescript
// Whiteboard Component Structure
interface DrawingElement {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'text' | 'image';
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  userId: string;
  userName: string;
  timestamp: number;
}

// Real-time synchronization
const addElement = useCallback((element: DrawingElement) => {
  // Add locally
  setElements(prev => [...prev, element]);

  // Sync with other users
  if (socket?.connected) {
    socket.emit('element-add', {
      roomId: `event-${eventId}`,
      element
    });
  }
}, [socket, eventId]);

// Listen for remote changes
useEffect(() => {
  if (!socket) return;

  socket.on('element-added', (element: DrawingElement) => {
    setElements(prev => {
      if (prev.find(el => el.id === element.id)) return prev;
      return [...prev, element];
    });
  });

  return () => socket.off('element-added');
}, [socket]);
```

#### Backend WebSocket Handlers
```typescript
@SubscribeMessage('join-whiteboard')
handleJoinWhiteboard(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() data: { eventId: string; user: any }
) {
  const roomId = `whiteboard:${data.eventId}`;
  client.join(roomId);

  // Track user in room
  this.whiteboardUsers.get(roomId)?.set(client.userId, {
    id: client.userId,
    name: data.user.name,
    color: this.generateUserColor(client.userId),
    cursor: null,
    isActive: true
  });

  // Notify others
  client.to(roomId).emit('user-joined', userInfo);
}

@SubscribeMessage('element-add')
handleElementAdd(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() data: { roomId: string; element: DrawingElement }
) {
  const roomId = `whiteboard:${data.roomId.replace('event-', '')}`;

  // Store element
  this.whiteboardElements.get(roomId)?.push(data.element);

  // Broadcast to all users
  this.server.to(roomId).emit('element-added', data.element);
}
```

#### Collaborative Features
- **Real-time drawing**: Pen, shapes, text, images
- **User cursors**: Live cursor tracking with avatars
- **Multi-board support**: Multiple whiteboards per event
- **Auto-save**: Periodic saving to database
- **Undo/Redo**: History management
- **Image upload**: Drag & drop with server storage

### 2. Chat System with WebSocket

#### Real-time Chat Implementation
```typescript
// Frontend Chat Hook
export function useChat(eventId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.emit('chat:join', { eventId });

    newSocket.on('chat:new_message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, [eventId]);

  const sendMessage = useCallback((content: string) => {
    if (!socket) return;

    const messageId = uuidv4();
    socket.emit('chat:message', {
      eventId,
      message: content,
      messageId
    });
  }, [socket, eventId]);

  return { messages, sendMessage };
}
```

#### Message Features
- **Real-time messaging**: Instant message delivery
- **Message reactions**: Emoji reactions with counts
- **File attachments**: Image and document sharing
- **Typing indicators**: Live typing status
- **Message history**: Persistent chat history
- **Private messaging**: Direct user-to-user chat

### 3. Task Management with Role-Based Permissions

#### Task Workflow System
```typescript
// Task status transitions
enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Permission matrix for task operations
const TaskPermissions = {
  CREATE: ['ORGANIZER'],
  ASSIGN: ['ORGANIZER', 'CREATOR'],
  UPDATE_STATUS: ['ASSIGNEE', 'ORGANIZER', 'CREATOR'],
  DELETE: ['ORGANIZER', 'CREATOR'],
  CANCEL: ['ORGANIZER', 'CREATOR']
};

// Task service with role validation
@Injectable()
export class TasksService {
  async updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    userId: string
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { event: true }
    });

    // Validate permissions
    const canUpdate = this.canUserUpdateTask(task, userId, newStatus);
    if (!canUpdate) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Validate status transition
    if (!this.isValidStatusTransition(task.status, newStatus)) {
      throw new BadRequestException('Invalid status transition');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    });
  }

  private canUserUpdateTask(task: Task, userId: string, newStatus: TaskStatus): boolean {
    // Assignee can move forward: TODO → IN_PROGRESS → COMPLETED
    if (task.assigneeId === userId) {
      return this.isForwardTransition(task.status, newStatus);
    }

    // Organizer and creator can do anything
    return task.creatorId === userId || task.event.organizerId === userId;
  }
}
```

#### Frontend Task Management
```typescript
// Task component with role-based UI
export function TaskCard({ task, currentUser, onUpdate }: TaskCardProps) {
  const canEdit = useMemo(() => {
    return task.creatorId === currentUser.id ||
           task.event.organizerId === currentUser.id;
  }, [task, currentUser]);

  const canUpdateStatus = useMemo(() => {
    return task.assigneeId === currentUser.id || canEdit;
  }, [task, currentUser, canEdit]);

  const availableStatuses = useMemo(() => {
    if (task.assigneeId === currentUser.id) {
      // Assignees can only move forward
      return getForwardStatuses(task.status);
    }
    return Object.values(TaskStatus);
  }, [task, currentUser]);

  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>

      {canUpdateStatus && (
        <StatusSelector
          currentStatus={task.status}
          availableStatuses={availableStatuses}
          onChange={(status) => onUpdate(task.id, { status })}
        />
      )}

      {canEdit && (
        <TaskActions
          task={task}
          onEdit={() => openEditModal(task)}
          onDelete={() => deleteTask(task.id)}
        />
      )}
    </div>
  );
}
```

### 4. Event Management System

#### Event Lifecycle
```typescript
// Event status workflow
enum EventStatus {
  DRAFT = 'DRAFT',         // Initial creation
  PUBLISHED = 'PUBLISHED', // Open for registration
  ONGOING = 'ONGOING',     // Event in progress
  COMPLETED = 'COMPLETED', // Event finished
  CANCELLED = 'CANCELLED'  // Event cancelled
}

// Event service with comprehensive management
@Injectable()
export class EventsService {
  async createEvent(createEventDto: CreateEventDto, organizerId: string) {
    const event = await this.prisma.event.create({
      data: {
        ...createEventDto,
        organizerId,
        status: EventStatus.DRAFT
      }
    });

    // Create default whiteboard
    await this.whiteboardService.createDefaultWhiteboard(event.id);

    // Set up default tasks
    await this.tasksService.createDefaultTasks(event.id, organizerId);

    return event;
  }

  async publishEvent(eventId: string, organizerId: string) {
    // Validate organizer permissions
    const event = await this.validateEventOwnership(eventId, organizerId);

    // Check event readiness
    if (!this.isEventReadyForPublishing(event)) {
      throw new BadRequestException('Event not ready for publishing');
    }

    // Update status and send notifications
    const publishedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.PUBLISHED }
    });

    // Notify invited users
    await this.notificationService.notifyEventPublished(publishedEvent);

    return publishedEvent;
  }
}
```
```
