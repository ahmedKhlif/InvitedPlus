'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/lib/contexts/ToastContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import MediaMessage from '@/components/chat/MediaMessage';
import { websocketService } from '@/lib/websocket';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  UserIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  MicrophoneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
}

interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VOICE' | 'FILE';
  messageType?: string;
  mediaUrl?: string;
  mediaType?: string;
  duration?: number;
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender: User;
  receiver: User;
  reactions?: {
    emoji: string;
    count: number;
    users: Array<{
      id: string;
      name: string;
      avatar?: string;
    }>;
  }[];
}

export default function PrivateChatPage() {
  const router = useRouter();
  const params = useParams();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [popularEmojis, setPopularEmojis] = useState<string[]>(['👍', '❤️', '😂', '😮', '😢', '😡']);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userId = params.userId as string;

  useEffect(() => {
    if (userId) {
      fetchConversation();
      fetchCurrentUser();
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate conversation ID (consistent for both users)
  const getConversationId = (user1Id: string, user2Id: string) => {
    return [user1Id, user2Id].sort().join('_');
  };

  // WebSocket connection
  useEffect(() => {
    if (!currentUser) return;

    const initializeWebSocket = async () => {
      try {
        await websocketService.connect();
        setIsConnected(true);

        const conversationId = getConversationId(currentUser.id, userId);

        // Join private chat room
        websocketService.joinPrivateChat(conversationId);

        // Set up event listeners
        websocketService.onPrivateChatMessage((message) => {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        });

        websocketService.onPrivateChatTyping((data) => {
          if (data.userId !== currentUser.id) {
            setIsTyping(data.isTyping);
          }
        });

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnected(false);
      }
    };

    initializeWebSocket();

    return () => {
      if (currentUser) {
        const conversationId = getConversationId(currentUser.id, userId);
        websocketService.leavePrivateChat(conversationId);
      }
      websocketService.disconnect();
    };
  }, [currentUser, userId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/profile');
      if (response.data.success) {
        setCurrentUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchConversation = async () => {
    try {
      const response = await api.get(`/private-chat/conversation/${userId}`);
      if (response.data.success) {
        setMessages(response.data.messages);
        if (response.data.messages.length > 0) {
          const firstMessage = response.data.messages[0];
          const other = firstMessage.sender.id === currentUser?.id 
            ? firstMessage.receiver 
            : firstMessage.sender;
          setOtherUser(other);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch conversation:', error);
      if (error.response?.status === 403) {
        showError('You can only chat with friends. Send a friend request first.');
        router.push('/friends');
      } else {
        showError('Failed to load conversation');
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !currentUser) return;

    setSending(true);
    try {
      const response = await api.post('/private-chat/send', {
        receiverId: userId,
        content: newMessage.trim(),
        messageType: 'text'
      });

      if (response.data.success) {
        // Send via WebSocket for real-time delivery
        if (isConnected) {
          const conversationId = getConversationId(currentUser.id, userId);
          websocketService.sendPrivateChatMessage(conversationId, response.data.message);
        }

        setMessages(prev => [...prev, response.data.message]);
        setNewMessage('');
        if (!otherUser && response.data.message.receiver) {
          setOtherUser(response.data.message.receiver);
        }
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      if (error.response?.status === 403) {
        showError('You can only send messages to friends');
      } else {
        showError('Failed to send message');
      }
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (!currentUser || !isConnected) return;

    const conversationId = getConversationId(currentUser.id, userId);

    // Send typing indicator
    websocketService.sendPrivateChatTyping(conversationId, value.length > 0);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        websocketService.sendPrivateChatTyping(conversationId, false);
      }, 1000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      await api.post(`/private-chat/messages/${messageId}/react`, { emoji });
      // Refresh messages to show updated reactions
      await fetchConversation();
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await api.post('/private-chat/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadResponse.data.success) {
        const messageResponse = await api.post('/private-chat/send', {
          receiverId: userId,
          content: `Shared an image: ${file.name}`,
          messageType: 'image',
          fileUrl: uploadResponse.data.data.url,
          fileName: file.name
        });

        if (messageResponse.data.success) {
          setMessages(prev => [...prev, messageResponse.data.message]);
        }
      }
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      showError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleVoiceRecording = async (audioBlob: Blob, duration: number) => {
    if (!currentUser) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('voice', new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' }));

      const uploadResponse = await api.post('/private-chat/upload/voice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadResponse.data.success) {
        const messageResponse = await api.post('/private-chat/send', {
          receiverId: userId,
          content: 'Sent a voice message',
          messageType: 'voice',
          fileUrl: uploadResponse.data.data.url,
          fileName: 'voice-message.webm'
        });

        if (messageResponse.data.success) {
          setMessages(prev => [...prev, messageResponse.data.message]);
        }
      }
      setShowVoiceRecorder(false);
    } catch (error: any) {
      console.error('Failed to upload voice message:', error);
      showError('Failed to upload voice message');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await api.post('/private-chat/upload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadResponse.data.success) {
        const messageResponse = await api.post('/private-chat/send', {
          receiverId: userId,
          content: `Shared a file: ${file.name}`,
          messageType: 'file',
          fileUrl: uploadResponse.data.data.url,
          fileName: file.name
        });

        if (messageResponse.data.success) {
          setMessages(prev => [...prev, messageResponse.data.message]);
        }
      }
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      showError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const getLastSeenText = (lastSeenAt?: string) => {
    if (!lastSeenAt) return 'Offline';

    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));

    if (diffMinutes < 5) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(diffMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Duplicate functions removed - using the ones defined earlier

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Button>
              {otherUser && (
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {otherUser.avatar ? (
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {getInitials(otherUser.name)}
                      </div>
                    )}
                    {otherUser.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">{otherUser.name}</h1>
                    <p className="text-sm text-gray-600">
                      {otherUser.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card variant="elevated" className="backdrop-blur-sm h-[calc(100vh-200px)] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start a conversation with {otherUser?.name || 'your friend'}
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender.id === currentUser?.id;
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
                    {!isOwn && (
                      <div className="flex-shrink-0 mr-3">
                        {message.sender.avatar ? (
                          <img
                            src={message.sender.avatar}
                            alt={message.sender.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                            {getInitials(message.sender.name)}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : ''}`}>
                      {!isOwn && (
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{message.sender.name}</span>
                          {message.sender.isOnline ? (
                            <span className="text-xs text-green-600">Online</span>
                          ) : (
                            <span className="text-xs text-gray-500">
                              {getLastSeenText((message.sender as any).lastSeenAt)}
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        className={`group px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        {/* Message Content */}
                        {(message.messageType === 'image' || message.messageType === 'voice' || message.messageType === 'file' ||
                          message.type === 'IMAGE' || message.type === 'VOICE' || message.type === 'FILE') && message.fileUrl ? (
                          <MediaMessage
                            message={{
                              id: message.id,
                              content: message.content,
                              type: (message.messageType?.toUpperCase() || message.type) as 'TEXT' | 'IMAGE' | 'VOICE' | 'FILE',
                              mediaUrl: message.fileUrl,
                              mediaType: message.messageType,
                              duration: message.duration,
                              senderId: message.sender.id,
                              eventId: undefined, // Private chat doesn't have eventId
                              createdAt: message.createdAt,
                              updatedAt: message.updatedAt,
                              sender: {
                                id: message.sender.id,
                                name: message.sender.name,
                                email: message.sender.email,
                              },
                              event: undefined,
                            }}
                            isOwnMessage={isOwn}
                          />
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}

                        {/* Timestamp */}
                        <div
                          className={`text-xs mt-1 ${
                            isOwn ? 'text-indigo-200' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </div>

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.reactions.map((reaction, index) => (
                              <button
                                key={index}
                                onClick={() => addReaction(message.id, reaction.emoji)}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                                  isOwn
                                    ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                                title={reaction.users && reaction.users.length > 0 ? reaction.users.map(u => u.name).join(', ') : 'No users'}
                              >
                                <span>{reaction.emoji}</span>
                                <span className={isOwn ? 'text-indigo-100' : 'text-gray-600'}>
                                  {reaction.count || 0}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Quick Reactions */}
                        <div className="flex items-center space-x-1 mt-2">
                          <button
                            onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                            className={`p-1.5 rounded-full transition-colors border ${
                              isOwn
                                ? 'text-indigo-200 border-indigo-400 hover:text-white hover:bg-indigo-500 hover:border-indigo-500'
                                : 'text-gray-600 border-gray-300 hover:text-gray-800 hover:bg-gray-100 hover:border-gray-400'
                            }`}
                            title="Add reaction"
                          >
                            <FaceSmileIcon className="h-4 w-4" />
                          </button>

                          {showEmojiPicker === message.id && (
                            <div className="flex space-x-1 ml-2">
                              {popularEmojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    addReaction(message.id, emoji);
                                    setShowEmojiPicker(null);
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {isOwn && (
                      <div className="flex-shrink-0 ml-3">
                        {currentUser?.avatar ? (
                          <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                            {getInitials(currentUser?.name || 'You')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-500">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>{otherUser?.name || 'User'} is typing...</span>
              </div>
            )}
          </div>

          {/* Voice Recorder */}
          {showVoiceRecorder && (
            <div className="border-t border-gray-200 p-4">
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecording}
                onCancel={() => setShowVoiceRecorder(false)}
              />
            </div>
          )}

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              {/* File Upload Buttons */}
              <div className="flex space-x-1">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Upload Image"
                >
                  <PhotoIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Upload File"
                >
                  <PaperClipIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                  disabled={uploading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Voice Message"
                >
                  <MicrophoneIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Text Input */}
              <Input
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sending || uploading}
              />

              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending || uploading}
                className="px-4"
              >
                {sending || uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <PaperAirplaneIcon className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Hidden File Inputs */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </Card>
      </main>
    </div>
  );
}
