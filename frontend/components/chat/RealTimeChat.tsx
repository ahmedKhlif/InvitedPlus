'use client';

import { useState, useEffect, useRef } from 'react';
import { websocketService } from '@/lib/websocket';
import { authService } from '@/lib/services';
import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import MessageActions from './MessageActions';
import { chatService } from '@/lib/services/chat';

interface Message {
  id: string;
  message: string;
  userId: string;
  userEmail: string;
  timestamp: string;
  isOwn?: boolean;
}

interface TypingUser {
  userId: string;
  userEmail: string;
  timestamp: string;
}

interface OnlineUser {
  userId: string;
  email: string;
  timestamp: string;
}

interface RealTimeChatProps {
  eventId: string;
  className?: string;
}

export default function RealTimeChat({ eventId, className = '' }: RealTimeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    
    initializeWebSocket();
    
    return () => {
      cleanup();
    };
  }, [eventId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeWebSocket = async () => {
    try {
      await websocketService.connect();
      setIsConnected(true);
      
      // Join the chat room for this event
      websocketService.joinChat(eventId);
      
      // Set up event listeners
      websocketService.onNewMessage(handleNewMessage);
      websocketService.onUserTyping(handleUserTyping);
      websocketService.onUserJoined(handleUserJoined);
      websocketService.onUserLeft(handleUserLeft);
      websocketService.onUserOnline(handleUserOnline);
      websocketService.onUserOffline(handleUserOffline);
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnected(false);
    }
  };

  const cleanup = () => {
    if (websocketService.isConnected()) {
      websocketService.leaveChat(eventId);
      
      // Remove event listeners
      websocketService.off('chat:new_message', handleNewMessage);
      websocketService.off('chat:user_typing', handleUserTyping);
      websocketService.off('chat:user_joined', handleUserJoined);
      websocketService.off('chat:user_left', handleUserLeft);
      websocketService.off('user:online', handleUserOnline);
      websocketService.off('user:offline', handleUserOffline);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleNewMessage = (data: any) => {
    const message: Message = {
      ...data,
      isOwn: data.userId === currentUser?.id
    };
    
    setMessages(prev => [...prev, message]);
  };

  const handleUserTyping = (data: any) => {
    if (data.userId === currentUser?.id) return;
    
    setTypingUsers(prev => {
      const filtered = prev.filter(user => user.userId !== data.userId);
      
      if (data.isTyping) {
        return [...filtered, {
          userId: data.userId,
          userEmail: data.userEmail,
          timestamp: data.timestamp
        }];
      } else {
        return filtered;
      }
    });
    
    // Auto-remove typing indicator after 3 seconds
    setTimeout(() => {
      setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
    }, 3000);
  };

  const handleUserJoined = (data: any) => {
    // Add system message for user joining
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      message: `${data.email} joined the chat`,
      userId: 'system',
      userEmail: 'System',
      timestamp: data.timestamp,
      isOwn: false
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleUserLeft = (data: any) => {
    // Add system message for user leaving
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      message: `${data.email} left the chat`,
      userId: 'system',
      userEmail: 'System',
      timestamp: data.timestamp,
      isOwn: false
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleUserOnline = (data: any) => {
    setOnlineUsers(prev => {
      const filtered = prev.filter(user => user.userId !== data.userId);
      return [...filtered, data];
    });
  };

  const handleUserOffline = (data: any) => {
    setOnlineUsers(prev => prev.filter(user => user.userId !== data.userId));
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;
    
    const messageId = `msg-${Date.now()}-${Math.random()}`;
    websocketService.sendMessage(eventId, newMessage.trim(), messageId);
    
    setNewMessage('');
    stopTyping();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && e.target.value.trim()) {
      startTyping();
    } else if (isTyping && !e.target.value.trim()) {
      stopTyping();
    }
  };

  const startTyping = () => {
    setIsTyping(true);
    websocketService.sendTyping(eventId, true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      websocketService.sendTyping(eventId, false);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].charAt(0).toUpperCase();
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      // Remove the message from the local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error: any) {
      console.error('Failed to delete message:', error);
      throw error; // Re-throw to let MessageActions handle the error display
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900">Event Chat</h3>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <UserIcon className="h-4 w-4" />
          <span>{onlineUsers.length} online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${message.isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              {!message.isOwn && message.userId !== 'system' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getInitials(message.userEmail)}
                  </span>
                </div>
              )}
              
              {/* Message Content */}
              <div className={`group relative rounded-lg px-3 py-2 ${
                message.userId === 'system'
                  ? 'bg-gray-100 text-gray-600 text-center text-sm italic'
                  : message.isOwn
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
              }`}>
                {message.userId !== 'system' && !message.isOwn && (
                  <div className="text-xs text-gray-500 mb-1">
                    {message.userEmail.split('@')[0]}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                <div className={`text-xs mt-1 ${
                  message.userId === 'system'
                    ? 'text-gray-500'
                    : message.isOwn
                      ? 'text-indigo-200'
                      : 'text-gray-500'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </div>

                {/* Message Actions - only show for non-system messages */}
                {message.userId !== 'system' && (
                  <MessageActions
                    messageId={message.id}
                    isOwnMessage={message.isOwn || false}
                    isEventMessage={true}
                    onDelete={handleDeleteMessage}
                    className="absolute top-2 right-2"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 text-sm text-gray-500 italic">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>
                {typingUsers.map(user => user.userEmail.split('@')[0]).join(', ')} 
                {typingUsers.length === 1 ? ' is' : ' are'} typing...
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
              rows={1}
              className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <div className="flex space-x-1">
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Add emoji"
            >
              <FaceSmileIcon className="h-5 w-5" />
            </button>
            
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Attach file"
            >
              <PaperClipIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
