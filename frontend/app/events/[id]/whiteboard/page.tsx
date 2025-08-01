'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/lib/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  CursorArrowRaysIcon,
  Square2StackIcon,
  RectangleStackIcon,
  EllipsisHorizontalCircleIcon,
  DocumentTextIcon,
  PhotoIcon,
  PlusIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  CloudArrowUpIcon,
  UserGroupIcon,
  Squares2X2Icon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';

interface Whiteboard {
  id: string;
  eventId: string;
  name: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

interface DrawingElement {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'text' | 'image';
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  imageUrl?: string;
  userId: string;
  userName: string;
  timestamp: number;
}

interface CollaborativeUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  cursor?: { x: number; y: number };
  isActive: boolean;
}

export default function EventWhiteboardPage() {
  const router = useRouter();
  const params = useParams();
  const { showSuccess, showError } = useToast();
  
  // Core state
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const eventId = params.id as string;

  // Suppress browser extension errors
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('Cannot find menu item with id') ||
          message.includes('save-page') ||
          message.includes('translate-page')) {
        return; // Suppress browser extension errors
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);
  
  // Whiteboard management
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [currentWhiteboardIndex, setCurrentWhiteboardIndex] = useState(0);
  const [currentWhiteboard, setCurrentWhiteboard] = useState<Whiteboard | null>(null);
  
  // Drawing state
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentTool, setCurrentTool] = useState<'select' | 'pen' | 'line' | 'rectangle' | 'circle' | 'text' | 'eraser' | 'image'>('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [lastDrawnElement, setLastDrawnElement] = useState<DrawingElement | null>(null);
  
  // Tool settings
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [fontSize, setFontSize] = useState(16);
  
  // Canvas state
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1200, height: 800 });
  
  // Collaboration
  const [socket, setSocket] = useState<any>(null);
  const [collaborativeUsers, setCollaborativeUsers] = useState<CollaborativeUser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isConnecting, setIsConnecting] = useState(false); // Prevent multiple connection attempts
  const connectionLockRef = useRef(false); // Global lock to prevent any connection attempts
  
  // History and auto-save
  const [history, setHistory] = useState<DrawingElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  // UI state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pendingImage, setPendingImage] = useState<{file: File, width: number, height: number, serverUrl?: string} | null>(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Notification debouncing
  const [notificationQueue, setNotificationQueue] = useState<{[key: string]: NodeJS.Timeout}>({});

  // Cache for loaded avatar images
  const [avatarImageCache, setAvatarImageCache] = useState<{ [key: string]: HTMLImageElement }>({});

  // Helper function to load and cache avatar images
  const loadAvatarImage = useCallback((avatarUrl: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      // Check if already cached
      if (avatarImageCache[avatarUrl]) {
        resolve(avatarImageCache[avatarUrl]);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous'; // Handle CORS
      img.onload = () => {
        setAvatarImageCache(prev => ({ ...prev, [avatarUrl]: img }));
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error('Failed to load avatar image'));
      };
      img.src = avatarUrl.startsWith('http') ? avatarUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://invitedplus-production.up.railway.app'}${avatarUrl}`;
    });
  }, [avatarImageCache]);

  // Helper function to draw cursor avatar with ring
  const drawCursorAvatar = useCallback((ctx: CanvasRenderingContext2D, user: CollaborativeUser) => {
    if (!user.cursor) return;

    const { x, y } = user.cursor;
    const avatarSize = 32;
    const ringSize = 40;
    const ringWidth = 3;

    // Draw colored ring around cursor
    ctx.save();
    ctx.strokeStyle = user.color;
    ctx.lineWidth = ringWidth;
    ctx.beginPath();
    ctx.arc(x, y, ringSize / 2, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw semi-transparent background for avatar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, avatarSize / 2 + 2, 0, 2 * Math.PI);
    ctx.fill();

    if (user.avatar && avatarImageCache[user.avatar]) {
      // Draw avatar image
      const img = avatarImageCache[user.avatar];
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, avatarSize / 2, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(
        img,
        x - avatarSize / 2,
        y - avatarSize / 2,
        avatarSize,
        avatarSize
      );
      ctx.restore();
    } else {
      // Draw fallback with initials
      ctx.fillStyle = user.color;
      ctx.beginPath();
      ctx.arc(x, y, avatarSize / 2, 0, 2 * Math.PI);
      ctx.fill();

      // Draw initials
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = user.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
      ctx.fillText(initials, x, y);
    }

    // Draw user name below avatar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x - 30, y + 25, 60, 18);
    ctx.fillStyle = 'white';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(user.name, x, y + 34);

    ctx.restore();
  }, [avatarImageCache]);

  const debouncedNotification = useCallback((key: string, message: string, type: 'success' | 'error' = 'success') => {
    // Clear existing timeout for this key
    if (notificationQueue[key]) {
      clearTimeout(notificationQueue[key]);
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      if (type === 'success') {
        showSuccess(message);
      } else {
        showError(message);
      }
      setNotificationQueue(prev => {
        const newQueue = { ...prev };
        delete newQueue[key];
        return newQueue;
      });
    }, 1000); // 1 second debounce

    setNotificationQueue(prev => ({ ...prev, [key]: timeoutId }));
  }, [showSuccess, showError, notificationQueue]);

  // Initialize socket connection for real-time collaboration
  const initializeSocket = useCallback(() => {
    // CRITICAL: Multiple layers of connection prevention
    if (connectionLockRef.current) {
      console.log('🔒 Connection locked, preventing duplicate connection');
      return () => {};
    }

    if (socket?.connected || isConnecting) {
      console.log('🚫 Socket already exists or connecting, skipping...');
      return () => {};
    }

    // Lock connections globally
    connectionLockRef.current = true;
    setIsConnecting(true);
    setConnectionStatus('connecting');

    console.log('🔌 Creating NEW socket connection...');

    // Disconnect existing socket first
    if (socket) {
      console.log('🔌 Disconnecting existing socket before creating new one');
      socket.removeAllListeners();
      socket.disconnect(true);
      setSocket(null);
    }

    // Get authentication token
    const token = localStorage.getItem('token');

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'https://invitedplus-production.up.railway.app', {
      auth: {
        token: token
      },
      query: {
        eventId,
        userId: currentUser?.id,
        whiteboardId: currentWhiteboard?.id
      },
      transports: ['websocket', 'polling'],
      timeout: 10000, // Reduced timeout
      reconnection: true,
      reconnectionAttempts: 3, // Reduced attempts
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      forceNew: true, // Force new connection to prevent conflicts
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('🔗 Connected to whiteboard collaboration');
      setConnectionStatus('connected');
      setIsConnecting(false);
      connectionLockRef.current = false; // Unlock after successful connection
      newSocket.emit('join-whiteboard', {
        eventId,
        whiteboardId: currentWhiteboard?.id,
        user: currentUser
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('disconnected');
      setIsConnecting(false);
      connectionLockRef.current = false; // Unlock on error
      debouncedNotification('connection-error', 'Connection issues detected', 'error');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnectionStatus('disconnected');
      setIsConnecting(false);
      connectionLockRef.current = false; // Unlock on disconnect
      if (reason === 'io server disconnect') {
        debouncedNotification('disconnected', 'Server disconnected, reconnecting...', 'error');
      } else if (reason === 'io client disconnect') {
        console.log('Client initiated disconnect - this is normal');
      } else {
        debouncedNotification('disconnected', 'Connection lost, reconnecting...', 'error');
      }
    });

    newSocket.on('reconnect', () => {
      console.log('WebSocket reconnected');
      debouncedNotification('reconnected', 'Reconnected to whiteboard', 'success');
    });

    newSocket.on('user-joined', (user: CollaborativeUser) => {
      setCollaborativeUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
      debouncedNotification(`user-joined-${user.id}`, `${user.name} joined the whiteboard`);
    });

    newSocket.on('user-left', (userId: string) => {
      setCollaborativeUsers(prev => {
        const user = prev.find(u => u.id === userId);
        const newUsers = prev.filter(u => u.id !== userId);
        if (user) {
          debouncedNotification(`user-left-${userId}`, `${user.name} left the whiteboard`);
        }
        return newUsers;
      });
    });

    newSocket.on('current-users', (users: CollaborativeUser[]) => {
      setCollaborativeUsers(users);
    });

    newSocket.on('element-added', (element: DrawingElement) => {
      console.log('📨 Received element-added:', element.type, 'from user:', element.userName);
      setElements(prev => {
        // Check if element already exists to prevent duplicates
        if (prev.find(el => el.id === element.id)) {
          console.log('Element already exists, skipping duplicate');
          return prev;
        }
        return [...prev, element];
      });
    });

    newSocket.on('element-updated', (element: DrawingElement) => {
      setElements(prev => prev.map(el => el.id === element.id ? element : el));
    });

    newSocket.on('element-deleted', (elementId: string) => {
      setElements(prev => prev.filter(el => el.id !== elementId));
    });

    newSocket.on('whiteboard-cleared', () => {
      setElements([]);
    });

    newSocket.on('cursor-moved', ({ userId, position }: { userId: string; position: { x: number; y: number } }) => {
      setCollaborativeUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, cursor: position } : user
      ));
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
      debouncedNotification('socket-error', error.message || 'Connection error', 'error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [eventId, currentUser, currentWhiteboard?.id, debouncedNotification]);

  // Fetch whiteboards
  const fetchWhiteboards = async () => {
    try {
      const response = await api.get(`/whiteboard/event/${eventId}/all`);
      if (response.data.success) {
        setWhiteboards(response.data.whiteboards);
        if (response.data.whiteboards.length > 0) {
          setCurrentWhiteboard(response.data.whiteboards[0]);
          setElements(response.data.whiteboards[0].data?.elements || []);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch whiteboards:', error);
      if (error.response?.status === 403) {
        showError('You do not have access to this event whiteboard');
        router.push('/events');
      } else {
        showError('Failed to load whiteboards');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch event
  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${eventId}`);
      if (response.data.success) {
        setEvent(response.data.event);
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    }
  };

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!currentWhiteboard) return;

    try {
      await api.put(`/whiteboard/${currentWhiteboard.id}`, {
        data: { elements, lastModified: Date.now() }
      });
      setLastSavedAt(new Date());
      console.log('Auto-saved whiteboard with', elements.length, 'elements');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [currentWhiteboard, elements]);

  // Manual save function
  const saveWhiteboard = useCallback(async () => {
    if (!currentWhiteboard) return;

    try {
      await api.put(`/whiteboard/${currentWhiteboard.id}`, {
        data: { elements, lastModified: Date.now() }
      });
      setLastSavedAt(new Date());
      showSuccess('Whiteboard saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
      showError('Failed to save whiteboard');
    }
  }, [currentWhiteboard, elements, showSuccess, showError]);

  // Add element to canvas and sync
  const addElement = useCallback((element: DrawingElement) => {
    console.log('📤 Adding element locally:', element.type, 'ID:', element.id);
    setElements(prev => [...prev, element]);
    setLastDrawnElement(element);

    // Sync with other users
    if (socket && socket.connected) {
      console.log('📡 Emitting element-add to server');
      socket.emit('element-add', { roomId: `event-${eventId}`, element });
    } else {
      console.warn('❌ Socket not connected, cannot sync element');
    }

    // Save to history
    setHistory(prev => [...prev.slice(0, historyIndex + 1), [...elements, element]]);
    setHistoryIndex(prev => prev + 1);
  }, [socket, elements, historyIndex, eventId]);

  // Update element
  const updateElement = useCallback((elementId: string, updates: Partial<DrawingElement>) => {
    setElements(prev => prev.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    ));

    if (socket) {
      socket.emit('element-update', { roomId: `event-${eventId}`, element: { id: elementId, ...updates } });
    }
  }, [socket, eventId]);

  // Delete element
  const deleteElement = useCallback((elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));

    if (socket) {
      socket.emit('element-delete', { roomId: `event-${eventId}`, elementId });
    }
  }, [socket, eventId]);

  // Get canvas coordinates
  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - stagePosition.x) / stageScale,
      y: (e.clientY - rect.top - stagePosition.y) / stageScale
    };
  }, [stagePosition, stageScale]);

  useEffect(() => {
    if (eventId) {
      fetchWhiteboards();
      fetchEvent();
    }
  }, [eventId]);

  // Initialize everything
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/auth/profile');
        if (response.data.success) {
          setCurrentUser(response.data.user);
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        // Set a default user for testing if auth fails
        setCurrentUser({
          id: 'anonymous',
          name: 'Anonymous User',
          email: 'anonymous@example.com'
        });
      }
    };

    fetchCurrentUser();
  }, []);

  // Initialize socket when user is available - PREVENT MULTIPLE CONNECTIONS
  useEffect(() => {
    if (currentUser && !socket && !isConnecting && !connectionLockRef.current) {
      console.log('🔌 Initializing socket for user:', currentUser.name);
      const cleanup = initializeSocket();
      return cleanup;
    } else if (currentUser && (socket || isConnecting || connectionLockRef.current)) {
      console.log('⏭️ Skipping socket init - already exists or connecting');
    }
  }, [currentUser]); // Remove initializeSocket from dependencies to prevent loops

  // Cleanup socket on component unmount
  useEffect(() => {
    return () => {
      if (socket) {
        console.log('🔌 Cleaning up socket connection on unmount');
        socket.emit('leave-whiteboard'); // Properly leave room first
        socket.removeAllListeners(); // Remove all event listeners
        socket.disconnect(true); // Force disconnect
        setSocket(null);
        setConnectionStatus('disconnected');
        connectionLockRef.current = false; // Unlock connection
      }
    };
  }, [socket]);

  // Additional cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socket) {
        socket.emit('leave-whiteboard');
        socket.disconnect(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [socket]);

  // Auto-save interval and on elements change
  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // Auto-save when elements change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (elements.length > 0) {
        autoSave();
      }
    }, 2000); // Save 2 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [elements, autoSave]);

  // Advanced HTML5 Canvas Drawing Functions
  const drawElement = useCallback((ctx: CanvasRenderingContext2D, element: DrawingElement) => {
    ctx.save();

    if (element.type === 'line' && element.points) {
      ctx.strokeStyle = element.stroke || brushColor;
      ctx.lineWidth = element.strokeWidth || brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (element.stroke === '#FFFFFF') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.beginPath();
      for (let i = 0; i < element.points.length - 1; i += 2) {
        if (i === 0) {
          ctx.moveTo(element.points[i], element.points[i + 1]);
        } else {
          ctx.lineTo(element.points[i], element.points[i + 1]);
        }
      }
      ctx.stroke();
    } else if (element.type === 'rectangle') {
      ctx.strokeStyle = element.stroke || brushColor;
      ctx.lineWidth = element.strokeWidth || brushSize;
      if (element.fill) {
        ctx.fillStyle = element.fill;
        ctx.fillRect(element.x!, element.y!, element.width!, element.height!);
      }
      ctx.strokeRect(element.x!, element.y!, element.width!, element.height!);
    } else if (element.type === 'circle') {
      ctx.strokeStyle = element.stroke || brushColor;
      ctx.lineWidth = element.strokeWidth || brushSize;
      ctx.beginPath();
      ctx.arc(element.x!, element.y!, element.radius!, 0, 2 * Math.PI);
      if (element.fill) {
        ctx.fillStyle = element.fill;
        ctx.fill();
      }
      ctx.stroke();
    } else if (element.type === 'text') {
      ctx.fillStyle = element.fill || element.stroke || brushColor;
      ctx.font = `${element.fontSize || fontSize}px Arial`;
      ctx.fillText(element.text!, element.x!, element.y!);
    } else if (element.type === 'image' && element.imageUrl) {
      // Create and draw image with error handling
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Handle CORS for server images
      img.onload = () => {
        try {
          ctx.drawImage(img, element.x!, element.y!, element.width!, element.height!);
        } catch (error) {
          console.warn('Failed to draw image element:', error);
        }
      };
      img.onerror = () => {
        // Only log blob URL errors once to avoid spam
        if (element.imageUrl?.startsWith('blob:')) {
          console.warn('Blob URL no longer available, skipping image element');
          return; // Don't draw anything for blob URLs
        } else {
          console.warn('Failed to load image:', element.imageUrl);
        }

        // Draw placeholder rectangle for non-blob URLs
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(element.x!, element.y!, element.width!, element.height!);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(element.x!, element.y!, element.width!, element.height!);
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Image not found', element.x! + element.width! / 2, element.y! + element.height! / 2);
      };

      // Handle both server URLs and blob URLs
      if (element.imageUrl.startsWith('blob:')) {
        img.src = element.imageUrl;
      } else if (element.imageUrl.startsWith('/uploads/')) {
        img.src = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://invitedplus-production.up.railway.app'}${element.imageUrl}`;
      } else {
        img.src = element.imageUrl;
      }
    }

    ctx.restore();
  }, [brushColor, brushSize, fontSize]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set transform for zoom and pan
    ctx.save();
    ctx.scale(stageScale, stageScale);
    ctx.translate(stagePosition.x / stageScale, stagePosition.y / stageScale);

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < canvas.width / stageScale; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height / stageScale);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height / stageScale; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width / stageScale, y);
      ctx.stroke();
    }

    // Draw all elements (filter out broken blob URLs)
    elements
      .filter(element => {
        // Skip image elements with blob URLs that no longer exist
        if (element.type === 'image' && element.imageUrl?.startsWith('blob:')) {
          return false;
        }
        return true;
      })
      .forEach(element => {
        drawElement(ctx, element);
      });

    // Draw collaborative cursor avatars
    collaborativeUsers.forEach(user => {
      if (user.cursor) {
        drawCursorAvatar(ctx, user);
      }
    });

    ctx.restore();
  }, [elements, collaborativeUsers, stageScale, stagePosition, drawElement, drawCursorAvatar]);

  // Redraw canvas when elements change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Preload avatar images when collaborative users change
  useEffect(() => {
    // Load current user avatar
    if (currentUser?.avatar && !avatarImageCache[currentUser.avatar]) {
      loadAvatarImage(currentUser.avatar).catch(error => {
        console.warn(`Failed to load current user avatar:`, error);
      });
    }

    // Load collaborative users avatars
    collaborativeUsers.forEach(user => {
      if (user.avatar && !avatarImageCache[user.avatar]) {
        loadAvatarImage(user.avatar).catch(error => {
          console.warn(`Failed to load avatar for ${user.name}:`, error);
        });
      }
    });
  }, [collaborativeUsers, currentUser, loadAvatarImage, avatarImageCache]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);

    // Handle pending image placement
    if (pendingImage) {
      const imageElement: DrawingElement = {
        id: uuidv4(),
        type: 'image',
        x: point.x - pendingImage.width / 2,
        y: point.y - pendingImage.height / 2,
        width: pendingImage.width,
        height: pendingImage.height,
        imageUrl: pendingImage.serverUrl || URL.createObjectURL(pendingImage.file),
        userId: currentUser?.id || 'anonymous',
        userName: currentUser?.name || 'Anonymous',
        timestamp: Date.now(),
      };

      addElement(imageElement);
      setPendingImage(null);
      setCurrentTool('select');
      return;
    }

    if (currentTool === 'select') return;

    if (currentTool === 'text') {
      setTextPosition(point);
      setShowTextModal(true);
      return;
    }

    const newElement: DrawingElement = {
      id: uuidv4(),
      userId: currentUser?.id || 'anonymous',
      userName: currentUser?.name || 'Anonymous',
      timestamp: Date.now(),
      stroke: brushColor,
      strokeWidth: brushSize,
      type: currentTool as any,
      x: point.x,
      y: point.y,
    };

    if (currentTool === 'pen') {
      newElement.points = [point.x, point.y];
      newElement.type = 'line';
    } else if (currentTool === 'eraser') {
      newElement.points = [point.x, point.y];
      newElement.type = 'line';
      newElement.stroke = '#FFFFFF';
      newElement.strokeWidth = brushSize * 2;
    } else if (currentTool === 'line') {
      newElement.points = [point.x, point.y, point.x, point.y];
      newElement.type = 'line';
    } else if (currentTool === 'rectangle') {
      newElement.width = 0;
      newElement.height = 0;
      newElement.fill = brushColor + '40';
    } else if (currentTool === 'circle') {
      newElement.radius = 0;
      newElement.fill = brushColor + '40';
    }

    setIsDrawing(true);
    addElement(newElement);
  }, [currentTool, brushColor, brushSize, fontSize, currentUser, addElement, getCanvasPoint, pendingImage, textPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);

    // Send cursor position to other users
    if (socket && currentWhiteboard) {
      socket.emit('cursor-move', {
        roomId: `event-${eventId}`,
        position: point
      });
    }

    if (!isDrawing) return;

    if (currentTool === 'pen' || currentTool === 'eraser') {
      // For continuous drawing, update the current element's points
      setElements(prev => {
        const newElements = [...prev];
        const lastElement = newElements[newElements.length - 1];
        if (lastElement && lastElement.points) {
          lastElement.points = [...lastElement.points, point.x, point.y];
        }
        return newElements;
      });
    } else if (lastDrawnElement) {
      if (currentTool === 'line') {
        const newPoints = [lastDrawnElement.points![0], lastDrawnElement.points![1], point.x, point.y];
        updateElement(lastDrawnElement.id, { points: newPoints });
      } else if (currentTool === 'rectangle') {
        const width = point.x - lastDrawnElement.x!;
        const height = point.y - lastDrawnElement.y!;
        updateElement(lastDrawnElement.id, { width, height });
      } else if (currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(point.x - lastDrawnElement.x!, 2) + Math.pow(point.y - lastDrawnElement.y!, 2));
        updateElement(lastDrawnElement.id, { radius });
      }
    }
  }, [socket, isDrawing, lastDrawnElement, currentTool, updateElement, getCanvasPoint, currentWhiteboard, eventId]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setLastDrawnElement(null);
  }, []);

  // Whiteboard management functions
  const createNewWhiteboard = async () => {
    try {
      const name = prompt('Enter whiteboard name:') || `Whiteboard ${whiteboards.length + 1}`;
      const response = await api.post(`/whiteboard/event/${eventId}`, {
        name,
        data: { elements: [] }
      });

      if (response.data.success) {
        const newWhiteboard = response.data.whiteboard;
        setWhiteboards(prev => [...prev, newWhiteboard]);
        switchToWhiteboard(whiteboards.length);
        showSuccess('New whiteboard created');
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        showError('Only organizers can create new whiteboards');
      } else {
        showError('Failed to create whiteboard');
      }
    }
  };

  const switchToWhiteboard = async (index: number) => {
    if (index === currentWhiteboardIndex) return;

    // Save current whiteboard before switching
    await autoSave();

    setCurrentWhiteboardIndex(index);
    const whiteboard = whiteboards[index];
    setCurrentWhiteboard(whiteboard);

    // Load elements from the new whiteboard
    const elementsToLoad = whiteboard.data?.elements || [];
    setElements(elementsToLoad);
    console.log('Loaded', elementsToLoad.length, 'elements from whiteboard:', whiteboard.name);

    // Update socket room
    if (socket) {
      socket.emit('leave-whiteboard', currentWhiteboard?.id);
      socket.emit('join-whiteboard', {
        eventId,
        whiteboardId: whiteboard.id,
        user: currentUser
      });
    }

    showSuccess(`Switched to ${whiteboard.name}`);
  };

  const deleteWhiteboard = async (index: number) => {
    if (whiteboards.length <= 1) {
      showError('Cannot delete the last whiteboard');
      return;
    }

    if (!confirm('Are you sure you want to delete this whiteboard?')) return;

    try {
      const whiteboard = whiteboards[index];
      await api.delete(`/whiteboard/${whiteboard.id}`);

      const newWhiteboards = whiteboards.filter((_, i) => i !== index);
      setWhiteboards(newWhiteboards);

      if (currentWhiteboardIndex >= index) {
        const newIndex = Math.max(0, currentWhiteboardIndex - 1);
        await switchToWhiteboard(newIndex);
      }

      showSuccess('Whiteboard deleted');
    } catch (error: any) {
      if (error.response?.status === 403) {
        showError('Only organizers can delete whiteboards');
      } else {
        showError('Failed to delete whiteboard');
      }
    }
  };

  // Advanced functions
  const clearWhiteboard = async () => {
    if (!confirm('Are you sure you want to clear the entire whiteboard?')) return;

    try {
      setElements([]);

      if (socket) {
        socket.emit('whiteboard-clear', { roomId: `event-${eventId}` });
      }

      if (currentWhiteboard) {
        await api.put(`/whiteboard/${currentWhiteboard.id}`, {
          data: { elements: [] }
        });
      }

      showSuccess('Whiteboard cleared successfully');
    } catch (error: any) {
      showError('Failed to clear whiteboard');
    }
  };

  const downloadWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${event?.title || 'Event'}_${currentWhiteboard?.name || 'whiteboard'}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const zoomIn = () => setStageScale(prev => Math.min(prev * 1.2, 5));
  const zoomOut = () => setStageScale(prev => Math.max(prev * 0.8, 0.1));
  const resetZoom = () => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      setHistoryIndex(newIndex);
      setElements(previousState);

      if (socket && currentWhiteboard) {
        socket.emit('elements-updated', {
          roomId: `event-${eventId}`,
          elements: previousState
        });
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      setHistoryIndex(newIndex);
      setElements(nextState);

      if (socket && currentWhiteboard) {
        socket.emit('elements-updated', {
          roomId: `event-${eventId}`,
          elements: nextState
        });
      }
    }
  };

  // Upload image to server to avoid blob URL issues
  const uploadImageToServer = useCallback(async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('eventId', eventId);

      const response = await api.post('/whiteboard/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.imageUrl;
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.warn('Server image upload failed, using local blob URL:', error);
      return null; // Fallback to blob URL
    }
  }, [eventId]);

  // Image upload and drag-drop functionality
  const processImageFile = useCallback(async (file: File) => {
    try {
      showSuccess('Processing image...');

      // Try to upload to server first
      const serverImageUrl = await uploadImageToServer(file);

      // Create a data URL for immediate display
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 400;
          const maxHeight = 300;

          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          // Set pending image for click-to-place
          setPendingImage({
            file,
            width,
            height,
            serverUrl: serverImageUrl || undefined
          });
          setCurrentTool('image');
          showSuccess('Click on the canvas to place the image');
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image processing error:', error);
      showError('Failed to process image');
    }
  }, [showSuccess, showError, uploadImageToServer]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processImageFile(file);

    if (event.target) {
      event.target.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      showError('Please drop image files only');
      return;
    }

    // Process all dropped images
    for (const file of imageFiles) {
      await processImageFile(file);
    }
  }, [processImageFile, showError]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Advanced Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/events/${eventId}`}>
                <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-blue-600">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Event
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">🎨 Advanced Collaborative Whiteboard</h1>
                {event && (
                  <p className="text-blue-100 text-sm">{event.title}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Live</span>
              </div>

              {lastSavedAt && (
                <div className="flex items-center space-x-1 text-xs text-blue-100">
                  <CloudArrowUpIcon className="h-3 w-3" />
                  <span>Auto-saved {lastSavedAt.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Whiteboard Tabs Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {whiteboards.map((wb, index) => (
                  <div key={wb.id} className="relative group">
                    <button
                      onClick={() => switchToWhiteboard(index)}
                      className={`px-4 py-2 text-sm rounded-md transition-all duration-200 ${
                        index === currentWhiteboardIndex
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      <Squares2X2Icon className="h-4 w-4 inline mr-2" />
                      {wb.name}
                    </button>
                    {whiteboards.length > 1 && (
                      <button
                        onClick={() => deleteWhiteboard(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  onClick={createNewWhiteboard}
                  variant="outline"
                  size="sm"
                  className="ml-2 border-dashed border-2 hover:border-solid"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  New Board
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowUserList(!showUserList)}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg text-sm hover:from-green-500 hover:to-blue-600 transition-all"
              >
                <UserGroupIcon className="h-4 w-4" />
                <span>{collaborativeUsers.length + 1} online</span>
              </button>

              <div className="flex items-center space-x-1">
                {collaborativeUsers.slice(0, 3).map((user) => (
                  <div
                    key={user.id}
                    className="relative w-8 h-8"
                    title={user.name}
                  >
                    {user.avatar ? (
                      <img
                        src={`https://invitedplus-production.up.railway.app${user.avatar}`}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border-2"
                        style={{ borderColor: user.color }}
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                {collaborativeUsers.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold">
                    +{collaborativeUsers.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-screen">
        {/* Professional Advanced Toolbar */}
        <div className="w-80 bg-gradient-to-b from-gray-50 to-white shadow-xl border-r overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Primary Tools */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <PaintBrushIcon className="h-4 w-4 mr-2" />
                Drawing Tools
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { tool: 'select', icon: CursorArrowRaysIcon, label: 'Select', color: 'blue' },
                  { tool: 'pen', icon: PencilIcon, label: 'Pen', color: 'green' },
                  { tool: 'eraser', icon: Square2StackIcon, label: 'Eraser', color: 'red' },
                  { tool: 'line', icon: ArrowUturnRightIcon, label: 'Line', color: 'purple' },
                ].map(({ tool, icon: Icon, label, color }) => (
                  <Button
                    key={tool}
                    variant={currentTool === tool ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentTool(tool as any)}
                    className={`flex flex-col items-center p-3 h-auto transition-all duration-200 ${
                      currentTool === tool
                        ? `bg-${color}-500 text-white shadow-lg scale-105`
                        : 'hover:scale-105 hover:shadow-md'
                    }`}
                    title={label}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Shape Tools */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <RectangleStackIcon className="h-4 w-4 mr-2" />
                Shapes & Objects
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { tool: 'rectangle', icon: RectangleStackIcon, label: 'Rectangle', color: 'indigo' },
                  { tool: 'circle', icon: EllipsisHorizontalCircleIcon, label: 'Circle', color: 'pink' },
                  { tool: 'text', icon: DocumentTextIcon, label: 'Text', color: 'yellow' },
                  { tool: 'image', icon: PhotoIcon, label: 'Image', color: 'teal' },
                ].map(({ tool, icon: Icon, label, color }) => (
                  <Button
                    key={tool}
                    variant={currentTool === tool ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => tool === 'image' ? fileInputRef.current?.click() : setCurrentTool(tool as any)}
                    className={`flex flex-col items-center p-3 h-auto transition-all duration-200 ${
                      currentTool === tool
                        ? `bg-${color}-500 text-white shadow-lg scale-105`
                        : 'hover:scale-105 hover:shadow-md'
                    }`}
                    title={label}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Advanced Color Picker */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: brushColor }}></div>
                Color Palette
              </h3>
              <div className="space-y-3">
                {/* Quick Colors */}
                <div className="grid grid-cols-8 gap-1">
                  {[
                    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
                    '#800000', '#808080', '#800080', '#008000', '#000080', '#808000', '#FFA500', '#FFC0CB'
                  ].map((quickColor) => (
                    <button
                      key={quickColor}
                      onClick={() => setBrushColor(quickColor)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                        brushColor === quickColor ? 'border-gray-800 shadow-lg' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: quickColor }}
                      title={quickColor}
                    />
                  ))}
                </div>

                {/* Current Color Display */}
                <div
                  className="w-full h-16 rounded-xl border-2 border-gray-300 flex flex-col items-center justify-center shadow-inner"
                  style={{ backgroundColor: brushColor }}
                >
                  <span className="text-white text-sm font-bold drop-shadow-lg">
                    {brushColor}
                  </span>
                  <span className="text-white text-xs drop-shadow">
                    Current Color
                  </span>
                </div>

                {/* Custom Color Input */}
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-full h-10 rounded border border-gray-300"
                />
              </div>
            </div>

            {/* Advanced Tool Settings */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <PaintBrushIcon className="h-4 w-4 mr-2" />
                Tool Settings
              </h3>
              <div className="space-y-4">
                {/* Brush Size */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-700">Brush Size</label>
                    <span className="text-xs font-bold text-blue-600">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-center mt-2">
                    <div
                      className="rounded-full border border-gray-300"
                      style={{
                        width: Math.max(brushSize, 4),
                        height: Math.max(brushSize, 4),
                        backgroundColor: brushColor
                      }}
                    />
                  </div>
                </div>

                {/* Font Size */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-700">Font Size</label>
                    <span className="text-xs font-bold text-purple-600">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-center mt-2">
                    <span
                      className="font-medium"
                      style={{ fontSize: Math.min(fontSize, 24), color: brushColor }}
                    >
                      Aa
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Actions */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <ArrowUturnLeftIcon className="h-4 w-4 mr-2" />
                Actions
              </h3>
              <div className="space-y-3">
                {/* History Controls */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    variant="outline"
                    size="sm"
                    className={`flex items-center transition-all duration-200 ${
                      historyIndex <= 0
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
                    Undo
                  </Button>
                  <Button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    variant="outline"
                    size="sm"
                    className={`flex items-center transition-all duration-200 ${
                      historyIndex >= history.length - 1
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    <ArrowUturnRightIcon className="h-4 w-4 mr-1" />
                    Redo
                  </Button>
                </div>

                {/* Canvas Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={clearWhiteboard}
                    variant="outline"
                    size="sm"
                    className="flex items-center text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                  <Button
                    onClick={downloadWhiteboard}
                    variant="outline"
                    size="sm"
                    className="flex items-center text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                    Export PNG
                  </Button>
                </div>

                {/* Save Button */}
                <Button
                  onClick={saveWhiteboard}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                >
                  <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                  Save Now
                </Button>
              </div>
            </div>

            {/* Advanced Zoom Controls */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <MagnifyingGlassPlusIcon className="h-4 w-4 mr-2" />
                Zoom & Navigation
              </h3>
              <div className="space-y-3">
                {/* Zoom Level Display */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(stageScale * 100)}%
                  </div>
                  <div className="text-xs text-gray-600">Current Zoom</div>
                </div>

                {/* Zoom Controls */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={zoomOut}
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                    disabled={stageScale <= 0.1}
                  >
                    <MagnifyingGlassMinusIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={resetZoom}
                    variant="outline"
                    size="sm"
                    className="text-xs hover:bg-gray-50 transition-all duration-200"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={zoomIn}
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                    disabled={stageScale >= 5}
                  >
                    <MagnifyingGlassPlusIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Zoom Presets */}
                <div className="grid grid-cols-4 gap-1">
                  {[25, 50, 100, 200].map((zoom) => (
                    <button
                      key={zoom}
                      onClick={() => setStageScale(zoom / 100)}
                      className={`text-xs py-1 px-2 rounded transition-all duration-200 ${
                        Math.round(stageScale * 100) === zoom
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {zoom}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Collaborative Users Panel */}
            {showUserList && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                  <UserGroupIcon className="h-4 w-4 mr-2" />
                  Live Collaboration
                </h3>
                <div className="space-y-3">
                  {/* Current User */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-10 h-10">
                        {currentUser?.avatar ? (
                          <img
                            src={`https://invitedplus-production.up.railway.app${currentUser.avatar}`}
                            alt={currentUser.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white border-opacity-30"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold">
                              {currentUser?.name?.charAt(0).toUpperCase() || 'Y'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {currentUser?.name || 'You'} (You)
                        </div>
                        <div className="text-xs opacity-80">
                          🎨 Drawing with {currentTool}
                        </div>
                      </div>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  {/* Other Users */}
                  {collaborativeUsers.map((user) => (
                    <div
                      key={user.id}
                      className="bg-white border-2 rounded-lg p-3 transition-all duration-200 hover:shadow-md"
                      style={{ borderColor: user.color + '40' }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative w-10 h-10">
                          {user.avatar ? (
                            <img
                              src={`https://invitedplus-production.up.railway.app${user.avatar}`}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border-2"
                              style={{ borderColor: user.color }}
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: user.color }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.isActive ? '✏️ Currently drawing' : '👀 Viewing'}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              user.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
                            }`}
                          ></div>
                          {user.cursor && (
                            <div className="text-xs text-gray-400">
                              📍 Active
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Connection Status */}
                  <div className={`rounded-lg p-3 text-center ${
                    connectionStatus === 'connected' ? 'bg-green-50' :
                    connectionStatus === 'connecting' ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                    <div className={`text-xs font-medium ${
                      connectionStatus === 'connected' ? 'text-green-600' :
                      connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {connectionStatus === 'connected' ? '🔗 Real-time sync active' :
                       connectionStatus === 'connecting' ? '⏳ Connecting...' : '❌ Connection lost'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {connectionStatus === 'connected' ?
                        `${collaborativeUsers.length + 1} users connected` :
                        'Attempting to reconnect...'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Canvas Area */}
        <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
          {/* Canvas Grid Background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              transform: `scale(${stageScale}) translate(${stagePosition.x}px, ${stagePosition.y}px)`
            }}
          />

          {/* Drag & Drop Overlay */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
            <div className="text-sm font-medium text-gray-700">
              🎨 Professional Whiteboard
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Drag & drop images • Real-time collaboration • Advanced tools
            </div>
          </div>

          {/* Main Canvas */}
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            className={`block ${
              currentTool === 'pen' ? 'cursor-crosshair' :
              currentTool === 'eraser' ? 'cursor-cell' :
              currentTool === 'select' ? 'cursor-pointer' :
              'cursor-crosshair'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              transform: `scale(${stageScale}) translate(${stagePosition.x}px, ${stagePosition.y}px)`,
              transformOrigin: '0 0'
            }}
          />

          {/* Advanced Status Bar */}
          <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200">
            <div className="px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Tool:</span>
                    <span className="capitalize font-bold text-blue-600">{currentTool}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MagnifyingGlassPlusIcon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Zoom:</span>
                    <span className="font-bold text-purple-600">{Math.round(stageScale * 100)}%</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Squares2X2Icon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Elements:</span>
                    <span className="font-bold text-green-600">{elements.length}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Users:</span>
                    <span className="font-bold text-orange-600">{collaborativeUsers.length + 1}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  {lastSavedAt && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CloudArrowUpIcon className="h-4 w-4" />
                      <span className="font-medium">Auto-saved {lastSavedAt.toLocaleTimeString()}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-medium text-green-600">Live Sync</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Action Buttons */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <Button
              onClick={resetZoom}
              className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
              title="Reset Zoom"
            >
              <Squares2X2Icon className="h-5 w-5" />
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
              title="Upload Image"
            >
              <PhotoIcon className="h-5 w-5" />
            </Button>

            <Button
              onClick={downloadWhiteboard}
              className="w-12 h-12 rounded-full bg-purple-500 hover:bg-purple-600 text-white shadow-lg"
              title="Download Whiteboard"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Text Input Modal */}
      {showTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Add Text</h3>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter your text here..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                onClick={() => {
                  setShowTextModal(false);
                  setTextInput('');
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (textInput.trim()) {
                    const textElement: DrawingElement = {
                      id: uuidv4(),
                      type: 'text',
                      x: textPosition.x,
                      y: textPosition.y,
                      text: textInput.trim(),
                      fontSize: fontSize,
                      fill: brushColor,
                      userId: currentUser?.id || 'anonymous',
                      userName: currentUser?.name || 'Anonymous',
                      timestamp: Date.now(),
                    };
                    addElement(textElement);
                  }
                  setShowTextModal(false);
                  setTextInput('');
                  setCurrentTool('select');
                }}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Add Text
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Image Indicator */}
      {pendingImage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-40">
          <div className="text-sm font-medium">
            📷 Click on the canvas to place your image
          </div>
        </div>
      )}

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
}
