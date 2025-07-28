import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CollaborativeUser {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  isActive: boolean;
  socketId: string;
}

interface WhiteboardRoom {
  eventId: string;
  whiteboardId: string;
  users: Map<string, CollaborativeUser>;
}

class WhiteboardCollaborationService {
  private io: Server;
  private rooms: Map<string, WhiteboardRoom> = new Map();
  private userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('User connected to whiteboard:', socket.id);

      socket.on('join-whiteboard', async (data: { eventId: string; whiteboardId?: string; user: any }) => {
        try {
          const { eventId, whiteboardId, user } = data;
          const roomId = whiteboardId || `event-${eventId}`;

          // Verify user has access to the event
          const event = await prisma.event.findFirst({
            where: {
              id: eventId,
              OR: [
                { organizerId: user.id },
                { attendees: { some: { userId: user.id } } }
              ]
            }
          });

          if (!event) {
            socket.emit('error', { message: 'Access denied to this whiteboard' });
            return;
          }

          // Join the room
          socket.join(roomId);

          // Get or create room
          if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
              eventId,
              whiteboardId: whiteboardId || '',
              users: new Map()
            });
          }

          const room = this.rooms.get(roomId)!;
          
          // Add user to room
          const collaborativeUser: CollaborativeUser = {
            id: user.id,
            name: user.name,
            color: this.userColors[room.users.size % this.userColors.length],
            isActive: true,
            socketId: socket.id
          };

          room.users.set(user.id, collaborativeUser);

          // Notify other users
          socket.to(roomId).emit('user-joined', collaborativeUser);

          // Send current users to the new user
          const currentUsers = Array.from(room.users.values()).filter(u => u.id !== user.id);
          socket.emit('current-users', currentUsers);

          console.log(`User ${user.name} joined whiteboard room ${roomId}`);
        } catch (error) {
          console.error('Error joining whiteboard:', error);
          socket.emit('error', { message: 'Failed to join whiteboard' });
        }
      });

      socket.on('leave-whiteboard', (whiteboardId: string) => {
        this.handleUserLeave(socket, whiteboardId);
      });

      socket.on('add-element', (data: { roomId: string; element: any }) => {
        socket.to(data.roomId).emit('element-added', data.element);
      });

      socket.on('update-element', (data: { roomId: string; element: any }) => {
        socket.to(data.roomId).emit('element-updated', data.element);
      });

      socket.on('delete-element', (data: { roomId: string; elementId: string }) => {
        socket.to(data.roomId).emit('element-deleted', data.elementId);
      });

      socket.on('cursor-move', (data: { roomId: string; position: { x: number; y: number } }) => {
        socket.to(data.roomId).emit('cursor-moved', {
          userId: this.getUserIdBySocket(socket.id),
          position: data.position
        });
      });

      socket.on('clear-whiteboard', (data: { roomId: string }) => {
        socket.to(data.roomId).emit('whiteboard-cleared');
      });

      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket);
      });
    });
  }

  private handleUserLeave(socket: Socket, whiteboardId: string) {
    const roomId = whiteboardId;
    const room = this.rooms.get(roomId);
    
    if (room) {
      const userId = this.getUserIdBySocket(socket.id);
      if (userId) {
        room.users.delete(userId);
        socket.to(roomId).emit('user-left', userId);
        socket.leave(roomId);

        // Clean up empty rooms
        if (room.users.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    }
  }

  private handleUserDisconnect(socket: Socket) {
    // Find and remove user from all rooms
    for (const [roomId, room] of this.rooms.entries()) {
      for (const [userId, user] of room.users.entries()) {
        if (user.socketId === socket.id) {
          room.users.delete(userId);
          socket.to(roomId).emit('user-left', userId);

          // Clean up empty rooms
          if (room.users.size === 0) {
            this.rooms.delete(roomId);
          }
          break;
        }
      }
    }
  }

  private getUserIdBySocket(socketId: string): string | null {
    for (const room of this.rooms.values()) {
      for (const [userId, user] of room.users.entries()) {
        if (user.socketId === socketId) {
          return userId;
        }
      }
    }
    return null;
  }

  public getRoomUsers(roomId: string): CollaborativeUser[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users.values()) : [];
  }

  public getRoomCount(): number {
    return this.rooms.size;
  }

  public getTotalUsers(): number {
    let total = 0;
    for (const room of this.rooms.values()) {
      total += room.users.size;
    }
    return total;
  }
}

export default WhiteboardCollaborationService;
