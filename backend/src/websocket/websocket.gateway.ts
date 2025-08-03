import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

@Injectable()
@WSGateway({
  cors: {
    origin: [
      'https://invited-plus.vercel.app',
      'http://localhost:3000',
      /https:\/\/.*\.vercel\.app$/
    ],
    credentials: true,
  },
  namespace: '/',
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
  transports: ['websocket', 'polling'],
  allowEIO3: true, // Allow Engine.IO v3 clients
  serveClient: false, // Don't serve client files
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, AuthenticatedSocket>();
  private userRooms = new Map<string, Set<string>>();

  // Whiteboard collaboration state
  private whiteboardUsers = new Map<string, Map<string, any>>(); // roomId -> userId -> user data
  private whiteboardElements = new Map<string, any[]>(); // roomId -> elements array

  // Rate limiting for connections
  private connectionAttempts = new Map<string, { count: number; lastAttempt: number }>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token with proper error handling
      let payload: any;
      try {
        payload = this.jwtService.verify(token);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          console.log('WebSocket connection rejected: Token expired');
          client.emit('auth_error', { message: 'Token expired', code: 'TOKEN_EXPIRED' });
        } else if (error.name === 'JsonWebTokenError') {
          console.log('WebSocket connection rejected: Invalid token');
          client.emit('auth_error', { message: 'Invalid token', code: 'INVALID_TOKEN' });
        } else {
          console.log('WebSocket connection rejected: Authentication failed', error.message);
          client.emit('auth_error', { message: 'Authentication failed', code: 'AUTH_FAILED' });
        }
        client.disconnect();
        return;
      }

      client.userId = payload.sub || payload.userId;
      client.userEmail = payload.email;

      // RATE LIMITING: Check connection attempts
      const now = Date.now();
      const userAttempts = this.connectionAttempts.get(client.userId);

      if (userAttempts) {
        // Reset counter if more than 1 minute has passed
        if (now - userAttempts.lastAttempt > 60000) {
          this.connectionAttempts.set(client.userId, { count: 1, lastAttempt: now });
        } else {
          userAttempts.count++;
          userAttempts.lastAttempt = now;

          // Limit to 5 connections per minute
          if (userAttempts.count > 5) {
            console.log(`Rate limiting user ${client.userEmail} - too many connections`);
            client.disconnect();
            return;
          }
        }
      } else {
        this.connectionAttempts.set(client.userId, { count: 1, lastAttempt: now });
      }

      // Check if user already has a connection - prevent duplicates
      const existingConnection = this.connectedUsers.get(client.userId);
      if (existingConnection && existingConnection.connected && existingConnection.id !== client.id) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`User ${client.userEmail} already connected, disconnecting old connection`);
        }
        existingConnection.disconnect(true);
      }

      // Store connected user
      this.connectedUsers.set(client.userId, client);

      // Join user to their personal room
      client.join(`user:${client.userId}`);

      // Reduced logging to prevent rate limits
      if (process.env.NODE_ENV !== 'production') {
        console.log(`User connected: ${client.userEmail}`);
      }

    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      // Remove from connected users
      this.connectedUsers.delete(client.userId);

      // Remove from all rooms and clean up whiteboard state
      const userRooms = this.userRooms.get(client.userId);
      if (userRooms) {
        userRooms.forEach(room => {
          client.leave(room);

          // Clean up whiteboard state if it's a whiteboard room
          if (room.startsWith('whiteboard:')) {
            const whiteboardUsers = this.whiteboardUsers.get(room);
            if (whiteboardUsers) {
              whiteboardUsers.delete(client.userId);

              // Notify others about user leaving
              client.to(room).emit('user-left', client.userId);
            }
          }
        });
        this.userRooms.delete(client.userId);
      }

      // Notify user is offline
      this.server.emit('user:offline', {
        userId: client.userId,
        timestamp: new Date().toISOString(),
      });

      console.log(`User ${client.userEmail} disconnected`);
    }
  }

  // Chat Messages
  @SubscribeMessage('chat:join')
  handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId?: string }
  ) {
    // Handle both global chat and event-specific chat
    const room = data.eventId ? `chat:${data.eventId}` : 'chat:global';
    client.join(room);

    // Track user rooms
    if (!this.userRooms.has(client.userId)) {
      this.userRooms.set(client.userId, new Set());
    }
    this.userRooms.get(client.userId).add(room);

    // Notify others that user joined
    client.to(room).emit('chat:user_joined', {
      userId: client.userId,
      email: client.userEmail,
      eventId: data.eventId || null,
      timestamp: new Date().toISOString(),
    });

    // Reduced logging for production
    if (process.env.NODE_ENV !== 'production') {
      console.log(`User ${client.userEmail} joined ${data.eventId ? `event chat ${data.eventId}` : 'global chat'}`);
    }
  }

  @SubscribeMessage('chat:leave')
  handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId?: string }
  ) {
    // Handle both global chat and event-specific chat
    const room = data.eventId ? `chat:${data.eventId}` : 'chat:global';
    client.leave(room);

    // Remove from user rooms
    const userRooms = this.userRooms.get(client.userId);
    if (userRooms) {
      userRooms.delete(room);
    }

    // Notify others that user left
    client.to(room).emit('chat:user_left', {
      userId: client.userId,
      email: client.userEmail,
      eventId: data.eventId || null,
      timestamp: new Date().toISOString(),
    });

    console.log(`User ${client.userEmail} left ${data.eventId ? `event chat ${data.eventId}` : 'global chat'}`);
  }

  @SubscribeMessage('chat:message')
  handleChatMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId?: string; message: string; messageId: string }
  ) {
    // Handle both global chat and event-specific chat
    const room = data.eventId ? `chat:${data.eventId}` : 'chat:global';

    // Broadcast message to all users in the chat room
    this.server.to(room).emit('chat:new_message', {
      id: data.messageId,
      message: data.message,
      userId: client.userId,
      userEmail: client.userEmail,
      eventId: data.eventId || null,
      timestamp: new Date().toISOString(),
    });

    // Reduced logging for production
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Message sent in ${data.eventId ? `event chat ${data.eventId}` : 'global chat'} by ${client.userEmail}`);
    }
  }

  @SubscribeMessage('private_chat:join')
  handleJoinPrivateChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string }
  ) {
    const room = `private_chat:${data.conversationId}`;
    client.join(room);
    console.log(`User ${client.userId} joined private chat room: ${room}`);
  }

  @SubscribeMessage('private_chat:leave')
  handleLeavePrivateChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string }
  ) {
    const room = `private_chat:${data.conversationId}`;
    client.leave(room);
    console.log(`User ${client.userId} left private chat room: ${room}`);
  }

  @SubscribeMessage('private_chat:message')
  handlePrivateChatMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; message: any }
  ) {
    const room = `private_chat:${data.conversationId}`;

    // Broadcast message to all users in the private chat room
    this.server.to(room).emit('private_chat:new_message', {
      ...data.message,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('private_chat:typing')
  handlePrivateChatTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean }
  ) {
    const room = `private_chat:${data.conversationId}`;

    // Broadcast typing status to other users in the room
    client.to(room).emit('private_chat:user_typing', {
      userId: client.userId,
      userEmail: client.userEmail,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId?: string; isTyping: boolean }
  ) {
    // Handle both global chat and event-specific chat
    const room = data.eventId ? `chat:${data.eventId}` : 'chat:global';

    // Broadcast typing status to others in the room
    client.to(room).emit('chat:user_typing', {
      userId: client.userId,
      userEmail: client.userEmail,
      eventId: data.eventId || null,
      isTyping: data.isTyping,
      timestamp: new Date().toISOString(),
    });
  }

  // Poll Events
  @SubscribeMessage('poll:join')
  handleJoinPoll(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { pollId: string }
  ) {
    const room = `poll:${data.pollId}`;
    client.join(room);
    
    // Track user rooms
    if (!this.userRooms.has(client.userId)) {
      this.userRooms.set(client.userId, new Set());
    }
    this.userRooms.get(client.userId).add(room);
  }

  @SubscribeMessage('poll:vote')
  handlePollVote(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { pollId: string; optionId: string; voteCount: number; totalVotes: number }
  ) {
    const room = `poll:${data.pollId}`;
    
    // Broadcast vote update to all users watching the poll
    this.server.to(room).emit('poll:vote_update', {
      pollId: data.pollId,
      optionId: data.optionId,
      voteCount: data.voteCount,
      totalVotes: data.totalVotes,
      voterId: client.userId,
      timestamp: new Date().toISOString(),
    });
  }

  // Task Updates
  @SubscribeMessage('task:update')
  handleTaskUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { taskId: string; eventId: string; status: string; assigneeId?: string }
  ) {
    const eventRoom = `event:${data.eventId}`;
    
    // Broadcast task update to event participants
    this.server.to(eventRoom).emit('task:status_changed', {
      taskId: data.taskId,
      eventId: data.eventId,
      status: data.status,
      assigneeId: data.assigneeId,
      updatedBy: client.userId,
      timestamp: new Date().toISOString(),
    });
  }

  // Event Updates
  @SubscribeMessage('event:join')
  handleJoinEvent(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId: string }
  ) {
    const room = `event:${data.eventId}`;
    client.join(room);
    
    // Track user rooms
    if (!this.userRooms.has(client.userId)) {
      this.userRooms.set(client.userId, new Set());
    }
    this.userRooms.get(client.userId).add(room);
  }

  @SubscribeMessage('event:checkin')
  handleEventCheckin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId: string; attendeeId: string; attendeeName: string }
  ) {
    const room = `event:${data.eventId}`;
    
    // Broadcast check-in to event organizers and participants
    this.server.to(room).emit('event:attendee_checkin', {
      eventId: data.eventId,
      attendeeId: data.attendeeId,
      attendeeName: data.attendeeName,
      checkedInBy: client.userId,
      timestamp: new Date().toISOString(),
    });
  }

  // Notifications
  @SubscribeMessage('notification:mark_read')
  handleMarkNotificationRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string }
  ) {
    // This would typically update the database
    // For now, just acknowledge the action
    client.emit('notification:marked_read', {
      notificationId: data.notificationId,
      timestamp: new Date().toISOString(),
    });
  }

  // Whiteboard Collaboration
  @SubscribeMessage('join-whiteboard')
  handleJoinWhiteboard(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId: string; whiteboardId?: string; user: any }
  ) {
    const roomId = `whiteboard:${data.eventId}`;

    // CRITICAL: Check if user is already in this room
    if (!this.whiteboardUsers.has(roomId)) {
      this.whiteboardUsers.set(roomId, new Map());
    }

    const existingUser = this.whiteboardUsers.get(roomId).get(client.userId);
    if (existingUser) {
      console.log(`User ${data.user?.name} already in room ${roomId}, updating socket`);
      // Update socket ID for existing user
      existingUser.socketId = client.id;
      this.whiteboardUsers.get(roomId).set(client.userId, existingUser);

      // Send current users to the reconnected user
      const currentUsers = Array.from(this.whiteboardUsers.get(roomId).values());
      client.emit('current-users', currentUsers.filter(u => u.id !== client.userId));
      return;
    }

    client.join(roomId);

    // Track user rooms
    if (!this.userRooms.has(client.userId)) {
      this.userRooms.set(client.userId, new Set());
    }
    this.userRooms.get(client.userId).add(roomId);

    // Add user to whiteboard room with avatar and color
    const userColor = this.generateUserColor(client.userId);
    const collaborativeUser = {
      id: client.userId,
      name: data.user?.name || 'Anonymous',
      email: data.user?.email || '',
      avatar: data.user?.avatar,
      color: userColor,
      isActive: true,
      cursor: null,
      socketId: client.id
    };

    this.whiteboardUsers.get(roomId).set(client.userId, collaborativeUser);

    // Send current users to the new user
    const currentUsers = Array.from(this.whiteboardUsers.get(roomId).values());
    client.emit('current-users', currentUsers.filter(u => u.id !== client.userId));

    // Notify others about new user
    client.to(roomId).emit('user-joined', collaborativeUser);

    console.log(`User ${data.user?.name} joined whiteboard room ${roomId}`);
  }

  @SubscribeMessage('leave-whiteboard')
  handleLeaveWhiteboard(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() whiteboardId?: string
  ) {
    // Find and leave all whiteboard rooms for this user
    const userRooms = this.userRooms.get(client.userId);
    if (userRooms) {
      userRooms.forEach(room => {
        if (room.startsWith('whiteboard:')) {
          client.leave(room);

          // Remove user from whiteboard users
          const whiteboardUsers = this.whiteboardUsers.get(room);
          if (whiteboardUsers) {
            whiteboardUsers.delete(client.userId);

            // Notify others about user leaving
            client.to(room).emit('user-left', client.userId);
          }
        }
      });
    }
  }

  @SubscribeMessage('cursor-move')
  handleCursorMove(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; position: { x: number; y: number } }
  ) {
    // Extract eventId from roomId (handle both "event-123" and "123" formats)
    const eventId = data.roomId.replace('event-', '');
    const roomId = `whiteboard:${eventId}`;

    // Update user cursor position
    const whiteboardUsers = this.whiteboardUsers.get(roomId);
    if (whiteboardUsers && whiteboardUsers.has(client.userId)) {
      const user = whiteboardUsers.get(client.userId);
      user.cursor = data.position;
      user.isActive = true;
      whiteboardUsers.set(client.userId, user);
    }

    // Broadcast cursor position to others
    client.to(roomId).emit('cursor-moved', {
      userId: client.userId,
      position: data.position
    });
  }

  @SubscribeMessage('element-add')
  handleElementAdd(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; element: any }
  ) {
    // Extract eventId from roomId (handle both "event-123" and "123" formats)
    const eventId = data.roomId.replace('event-', '');
    const roomId = `whiteboard:${eventId}`;

    // Reduced logging for production
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Element added by ${client.userId} in room ${roomId}:`, data.element.type);
    }

    // Add element to room state
    if (!this.whiteboardElements.has(roomId)) {
      this.whiteboardElements.set(roomId, []);
    }
    this.whiteboardElements.get(roomId).push(data.element);

    // Broadcast to all users in the room (including sender for confirmation)
    this.server.to(roomId).emit('element-added', data.element);
  }

  @SubscribeMessage('element-update')
  handleElementUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; element: any }
  ) {
    // Extract eventId from roomId (handle both "event-123" and "123" formats)
    const eventId = data.roomId.replace('event-', '');
    const roomId = `whiteboard:${eventId}`;

    console.log(`Element updated by ${client.userId} in room ${roomId}`);

    // Update element in room state
    const elements = this.whiteboardElements.get(roomId);
    if (elements) {
      const index = elements.findIndex(el => el.id === data.element.id);
      if (index !== -1) {
        elements[index] = data.element;
      }
    }

    // Broadcast to all users in the room
    this.server.to(roomId).emit('element-updated', data.element);
  }

  @SubscribeMessage('element-delete')
  handleElementDelete(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; elementId: string }
  ) {
    // Extract eventId from roomId (handle both "event-123" and "123" formats)
    const eventId = data.roomId.replace('event-', '');
    const roomId = `whiteboard:${eventId}`;

    console.log(`Element deleted by ${client.userId} in room ${roomId}`);

    // Remove element from room state
    const elements = this.whiteboardElements.get(roomId);
    if (elements) {
      const index = elements.findIndex(el => el.id === data.elementId);
      if (index !== -1) {
        elements.splice(index, 1);
      }
    }

    // Broadcast to all users in the room
    this.server.to(roomId).emit('element-deleted', data.elementId);
  }

  @SubscribeMessage('whiteboard-clear')
  handleWhiteboardClear(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string }
  ) {
    // Extract eventId from roomId (handle both "event-123" and "123" formats)
    const eventId = data.roomId.replace('event-', '');
    const roomId = `whiteboard:${eventId}`;

    // Reduced logging for production
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Whiteboard cleared by ${client.userId} in room ${roomId}`);
    }

    // Clear elements for this room
    this.whiteboardElements.set(roomId, []);

    // Broadcast to all users in the room
    this.server.to(roomId).emit('whiteboard-cleared');
  }

  // Generate consistent color for user
  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];

    // Use userId to generate consistent color
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // Utility methods for sending notifications from other services
  sendNotificationToUser(userId: string, notification: any) {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit('notification:new', notification);
    }
  }

  sendNotificationToEvent(eventId: string, notification: any) {
    this.server.to(`event:${eventId}`).emit('notification:new', notification);
  }

  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Get online users
  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Cleanup stale connections (can be called periodically)
  cleanupStaleConnections() {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    this.connectedUsers.forEach((socket, userId) => {
      // Fix TypeScript error by properly handling handshake time
      const handshakeTime = typeof socket.handshake.time === 'number'
        ? socket.handshake.time
        : new Date(socket.handshake.time).getTime();

      if (!socket.connected || (now - handshakeTime) > staleThreshold) {
        console.log(`Cleaning up stale connection for user ${userId}`);
        this.connectedUsers.delete(userId);

        // Clean up whiteboard rooms
        this.whiteboardUsers.forEach((users, roomId) => {
          if (users.has(userId)) {
            users.delete(userId);
            this.server.to(roomId).emit('user-left', userId);
          }
        });
      }
    });
  }
}
