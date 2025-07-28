# WebSocket Implementation Documentation

## Overview
InvitedPlus uses Socket.IO for real-time communication across multiple features including chat, whiteboard collaboration, notifications, and live updates.

## Connection Setup

### Frontend Connection
```typescript
import { io, Socket } from 'socket.io-client';

// Initialize connection with authentication
const socket = io('http://localhost:3001', {
  auth: {
    token: localStorage.getItem('token') // JWT token
  },
  transports: ['websocket', 'polling'],
  timeout: 20000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Connection event handlers
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Backend Gateway
```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, AuthenticatedSocket>();
  private userRooms = new Map<string, Set<string>>();

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Authenticate user
      const token = client.handshake.auth?.token;
      const payload = this.jwtService.verify(token);
      
      client.userId = payload.sub;
      client.userEmail = payload.email;
      
      // Store connection
      this.connectedUsers.set(client.userId, client);
      
      console.log(`User ${client.userEmail} connected`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      // Clean up user from all rooms
      this.cleanupUserRooms(client.userId);
    }
  }
}
```

## Event Categories

### 1. Chat Events

#### Join Chat Room
```typescript
// Frontend
socket.emit('chat:join', { eventId: 'event123' });

// Backend Handler
@SubscribeMessage('chat:join')
handleJoinChat(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() data: { eventId: string }
) {
  const room = `chat:${data.eventId}`;
  client.join(room);
  
  // Notify others
  client.to(room).emit('chat:user_joined', {
    userId: client.userId,
    email: client.userEmail,
    timestamp: new Date().toISOString()
  });
}
```

#### Send Message
```typescript
// Frontend
socket.emit('chat:message', {
  eventId: 'event123',
  message: 'Hello everyone!',
  messageId: 'msg123'
});

// Backend Handler
@SubscribeMessage('chat:message')
handleChatMessage(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() data: { eventId: string; message: string; messageId: string }
) {
  const room = `chat:${data.eventId}`;
  
  // Broadcast to all users in room
  this.server.to(room).emit('chat:new_message', {
    id: data.messageId,
    message: data.message,
    userId: client.userId,
    userEmail: client.userEmail,
    timestamp: new Date().toISOString()
  });
}
```

#### Typing Indicator
```typescript
// Frontend
socket.emit('chat:typing', { eventId: 'event123', isTyping: true });

// Backend Handler
@SubscribeMessage('chat:typing')
handleTyping(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() data: { eventId: string; isTyping: boolean }
) {
  const room = `chat:${data.eventId}`;
  
  // Broadcast to others (not sender)
  client.to(room).emit('chat:user_typing', {
    userId: client.userId,
    isTyping: data.isTyping,
    timestamp: new Date().toISOString()
  });
}
```

### 2. Whiteboard Collaboration Events

#### Join Whiteboard
```typescript
// Frontend
socket.emit('join-whiteboard', {
  eventId: 'event123',
  whiteboardId: 'board123',
  user: currentUser
});

// Backend Handler
@SubscribeMessage('join-whiteboard')
handleJoinWhiteboard(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() data: { eventId: string; whiteboardId?: string; user: any }
) {
  const roomId = `whiteboard:${data.eventId}`;
  client.join(roomId);
  
  // Add user to collaborative users
  const collaborativeUser = {
    id: client.userId,
    name: data.user.name,
    avatar: data.user.avatar,
    color: this.generateUserColor(client.userId),
    cursor: null,
    isActive: true
  };
  
  this.whiteboardUsers.get(roomId)?.set(client.userId, collaborativeUser);
  
  // Send current users to new user
  const currentUsers = Array.from(this.whiteboardUsers.get(roomId)?.values() || []);
  client.emit('current-users', currentUsers.filter(u => u.id !== client.userId));
  
  // Notify others
  client.to(roomId).emit('user-joined', collaborativeUser);
}
```

#### Drawing Elements
```typescript
// Frontend - Add Element
socket.emit('element-add', {
  roomId: `event-${eventId}`,
  element: {
    id: 'elem123',
    type: 'line',
    points: [10, 10, 20, 20],
    stroke: '#000000',
    userId: currentUser.id,
    userName: currentUser.name,
    timestamp: Date.now()
  }
});

// Backend Handler
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

#### Cursor Movement
```typescript
// Frontend
socket.emit('cursor-move', {
  roomId: `event-${eventId}`,
  position: { x: 100, y: 150 }
});

// Backend Handler
@SubscribeMessage('cursor-move')
handleCursorMove(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() data: { roomId: string; position: { x: number; y: number } }
) {
  const roomId = `whiteboard:${data.roomId.replace('event-', '')}`;
  
  // Update user cursor
  const user = this.whiteboardUsers.get(roomId)?.get(client.userId);
  if (user) {
    user.cursor = data.position;
    user.isActive = true;
  }
  
  // Broadcast cursor position
  client.to(roomId).emit('cursor-moved', {
    userId: client.userId,
    position: data.position
  });
}
```

### 3. Notification Events

#### Real-time Notifications
```typescript
// Backend - Send notification to specific user
sendNotificationToUser(userId: string, notification: any) {
  const userSocket = this.connectedUsers.get(userId);
  if (userSocket) {
    userSocket.emit('notification:new', notification);
  }
}

// Backend - Broadcast to event participants
sendNotificationToEvent(eventId: string, notification: any) {
  this.server.to(`event:${eventId}`).emit('notification:new', notification);
}

// Frontend - Listen for notifications
socket.on('notification:new', (notification) => {
  // Show notification in UI
  showNotification(notification);
  
  // Update notification count
  setNotificationCount(prev => prev + 1);
});
```

### 4. Task Update Events

#### Task Status Changes
```typescript
// Backend - Notify task updates
@SubscribeMessage('task:update')
handleTaskUpdate(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() data: { taskId: string; eventId: string; status: string }
) {
  const eventRoom = `event:${data.eventId}`;
  
  // Broadcast to event participants
  this.server.to(eventRoom).emit('task:status_changed', {
    taskId: data.taskId,
    status: data.status,
    updatedBy: client.userId,
    timestamp: new Date().toISOString()
  });
}

// Frontend - Listen for task updates
socket.on('task:status_changed', (update) => {
  // Update task in local state
  setTasks(prev => prev.map(task => 
    task.id === update.taskId 
      ? { ...task, status: update.status }
      : task
  ));
});
```

## Room Management

### Room Naming Convention
- Chat rooms: `chat:${eventId}`
- Whiteboard rooms: `whiteboard:${eventId}`
- Event rooms: `event:${eventId}`
- User rooms: `user:${userId}`
- Poll rooms: `poll:${pollId}`

### Room Lifecycle
```typescript
// Join room
client.join(roomId);
this.userRooms.get(userId)?.add(roomId);

// Leave room
client.leave(roomId);
this.userRooms.get(userId)?.delete(roomId);

// Cleanup on disconnect
handleDisconnect(client: AuthenticatedSocket) {
  const userRooms = this.userRooms.get(client.userId);
  if (userRooms) {
    userRooms.forEach(room => {
      client.leave(room);
      // Notify room about user leaving
      client.to(room).emit('user_left', client.userId);
    });
    this.userRooms.delete(client.userId);
  }
}
```

## Error Handling

### Connection Errors
```typescript
// Frontend error handling
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
  // Show user-friendly error message
  showErrorNotification('Connection failed. Retrying...');
});

socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server initiated disconnect
    showErrorNotification('Server disconnected. Please refresh.');
  } else {
    // Client initiated or network issue
    showErrorNotification('Connection lost. Reconnecting...');
  }
});

// Backend error handling
@SubscribeMessage('any-event')
handleAnyEvent(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
  try {
    // Process event
  } catch (error) {
    client.emit('error', {
      message: 'An error occurred',
      code: 'PROCESSING_ERROR'
    });
  }
}
```

### Rate Limiting
```typescript
// Backend rate limiting
private connectionAttempts = new Map<string, { count: number; lastAttempt: number }>();

async handleConnection(client: AuthenticatedSocket) {
  const userId = this.extractUserId(client);
  const now = Date.now();
  
  // Check rate limit
  const attempts = this.connectionAttempts.get(userId);
  if (attempts && attempts.count > 5 && (now - attempts.lastAttempt) < 60000) {
    client.disconnect();
    return;
  }
  
  // Update attempts
  this.connectionAttempts.set(userId, {
    count: (attempts?.count || 0) + 1,
    lastAttempt: now
  });
}
```
