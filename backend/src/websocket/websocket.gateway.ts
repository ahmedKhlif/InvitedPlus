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
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, AuthenticatedSocket>();
  private userRooms = new Map<string, Set<string>>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub || payload.userId;
      client.userEmail = payload.email;

      // Store connected user
      this.connectedUsers.set(client.userId, client);
      
      // Join user to their personal room
      client.join(`user:${client.userId}`);
      
      console.log(`User ${client.userEmail} connected with socket ${client.id}`);
      
      // Notify user is online
      this.server.emit('user:online', {
        userId: client.userId,
        email: client.userEmail,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      // Remove from connected users
      this.connectedUsers.delete(client.userId);
      
      // Remove from all rooms
      const userRooms = this.userRooms.get(client.userId);
      if (userRooms) {
        userRooms.forEach(room => {
          client.leave(room);
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
    @MessageBody() data: { eventId: string }
  ) {
    const room = `chat:${data.eventId}`;
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
      eventId: data.eventId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('chat:leave')
  handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId: string }
  ) {
    const room = `chat:${data.eventId}`;
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
      eventId: data.eventId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('chat:message')
  handleChatMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId: string; message: string; messageId: string }
  ) {
    const room = `chat:${data.eventId}`;
    
    // Broadcast message to all users in the chat room
    this.server.to(room).emit('chat:new_message', {
      id: data.messageId,
      message: data.message,
      userId: client.userId,
      userEmail: client.userEmail,
      eventId: data.eventId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId: string; isTyping: boolean }
  ) {
    const room = `chat:${data.eventId}`;
    
    // Broadcast typing status to others in the room
    client.to(room).emit('chat:user_typing', {
      userId: client.userId,
      userEmail: client.userEmail,
      eventId: data.eventId,
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
}
