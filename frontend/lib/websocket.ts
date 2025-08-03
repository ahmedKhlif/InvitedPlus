import { io, Socket } from 'socket.io-client';
import { authService } from './services';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      const token = authService.getToken();
      if (!token) {
        reject(new Error('No authentication token available'));
        return;
      }

      this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'https://invitedplus-production.up.railway.app', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve(this.socket!);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          this.handleReconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.handleReconnect();
        reject(error);
      });

      // Handle authentication errors
      this.socket.on('unauthorized', () => {
        console.error('WebSocket authentication failed');
        this.disconnect();
        reject(new Error('Authentication failed'));
      });
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Chat methods
  joinChat(eventId?: string) {
    this.socket?.emit('chat:join', { eventId: eventId || null });
  }

  leaveChat(eventId?: string) {
    this.socket?.emit('chat:leave', { eventId: eventId || null });
  }

  sendMessage(eventId: string | null, message: string, messageId: string) {
    this.socket?.emit('chat:message', { eventId: eventId || null, message, messageId });
  }

  sendTyping(eventId: string | null, isTyping: boolean) {
    this.socket?.emit('chat:typing', { eventId: eventId || null, isTyping });
  }

  onNewMessage(callback: (data: any) => void) {
    this.socket?.on('chat:new_message', callback);
  }

  onUserTyping(callback: (data: any) => void) {
    this.socket?.on('chat:user_typing', callback);
  }

  onUserJoined(callback: (data: any) => void) {
    this.socket?.on('chat:user_joined', callback);
  }

  onUserLeft(callback: (data: any) => void) {
    this.socket?.on('chat:user_left', callback);
  }

  // Private Chat methods
  joinPrivateChat(conversationId: string) {
    this.socket?.emit('private_chat:join', { conversationId });
  }

  leavePrivateChat(conversationId: string) {
    this.socket?.emit('private_chat:leave', { conversationId });
  }

  sendPrivateChatMessage(conversationId: string, message: any) {
    this.socket?.emit('private_chat:message', { conversationId, message });
  }

  sendPrivateChatTyping(conversationId: string, isTyping: boolean) {
    this.socket?.emit('private_chat:typing', { conversationId, isTyping });
  }

  onPrivateChatMessage(callback: (data: any) => void) {
    this.socket?.on('private_chat:new_message', callback);
  }

  onPrivateChatTyping(callback: (data: any) => void) {
    this.socket?.on('private_chat:user_typing', callback);
  }

  // Poll methods
  joinPoll(pollId: string) {
    this.socket?.emit('poll:join', { pollId });
  }

  sendPollVote(pollId: string, optionId: string, voteCount: number, totalVotes: number) {
    this.socket?.emit('poll:vote', { pollId, optionId, voteCount, totalVotes });
  }

  onPollVoteUpdate(callback: (data: any) => void) {
    this.socket?.on('poll:vote_update', callback);
  }

  // Task methods
  sendTaskUpdate(taskId: string, eventId: string, status: string, assigneeId?: string) {
    this.socket?.emit('task:update', { taskId, eventId, status, assigneeId });
  }

  onTaskStatusChanged(callback: (data: any) => void) {
    this.socket?.on('task:status_changed', callback);
  }

  // Event methods
  joinEvent(eventId: string) {
    this.socket?.emit('event:join', { eventId });
  }

  sendEventCheckin(eventId: string, attendeeId: string, attendeeName: string) {
    this.socket?.emit('event:checkin', { eventId, attendeeId, attendeeName });
  }

  onAttendeeCheckin(callback: (data: any) => void) {
    this.socket?.on('event:attendee_checkin', callback);
  }

  // Notification methods
  markNotificationRead(notificationId: string) {
    this.socket?.emit('notification:mark_read', { notificationId });
  }

  onNewNotification(callback: (data: any) => void) {
    this.socket?.on('notification:new', callback);
  }

  onNotificationMarkedRead(callback: (data: any) => void) {
    this.socket?.on('notification:marked_read', callback);
  }

  // User presence methods
  onUserOnline(callback: (data: any) => void) {
    this.socket?.on('user:online', callback);
  }

  onUserOffline(callback: (data: any) => void) {
    this.socket?.on('user:offline', callback);
  }

  // Generic event listeners
  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  // Connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const websocketService = new WebSocketService();
