'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { chatService, authService, eventsService } from '@/lib/services';
import { PaperAirplaneIcon, UserIcon, PhotoIcon, MicrophoneIcon, PaperClipIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import MediaMessage from '@/components/chat/MediaMessage';

interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VOICE' | 'FILE';
  mediaUrl?: string;
  mediaType?: string;
  duration?: number;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  senderId: string;
  createdAt: string;
  updatedAt: string;
  eventId?: string;
  event?: {
    id: string;
    title: string;
  };
  reactions?: {
    emoji: string;
    count: number;
    users: { id: string; name: string; avatar?: string }[];
  }[];
}

interface User {
  id: string;
  name: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [error, setError] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Popular emojis for quick reactions
  const popularEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        // Fetch user profile
        const profileResponse = await authService.getProfile();
        setUser(profileResponse.user);

        // Fetch events
        const eventsResponse = await eventsService.getEvents();
        setEvents(eventsResponse.events);

        // Fetch messages
        await fetchMessages();
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load chat data');
        if (error.response?.status === 401) {
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const fetchMessages = async () => {
    try {
      const response = await chatService.getMessages({
        eventId: selectedEventId || undefined,
        limit: 50
      });
      setMessages(response.messages);
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      setError('Failed to load messages');
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [selectedEventId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      await api.post(`/chat/messages/${messageId}/react`, { emoji });
      // Refresh messages to show updated reactions
      fetchMessages();
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    try {
      await chatService.sendMessage({
        content: newMessage.trim(),
        eventId: selectedEventId || undefined
      });

      setNewMessage('');
      // Refresh messages
      await fetchMessages();
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const uploadResponse = await chatService.uploadImage(file);

      const messageData = {
        content: newMessage.trim() || 'Shared an image',
        type: 'IMAGE' as const,
        mediaUrl: uploadResponse.data.url,
        mediaType: file.type,
        eventId: selectedEventId || undefined
      };

      await chatService.sendMessage(messageData);
      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleVoiceRecording = async (audioBlob: Blob, duration: number) => {
    if (!user) return;

    setUploading(true);
    try {
      const file = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
      const uploadResponse = await chatService.uploadVoice(file);

      const messageData = {
        content: newMessage.trim() || 'Sent a voice message',
        type: 'VOICE' as const,
        mediaUrl: uploadResponse.data.url,
        mediaType: 'audio/webm',
        duration: duration,
        eventId: selectedEventId || undefined
      };

      await chatService.sendMessage(messageData);
      setNewMessage('');
      setShowVoiceRecorder(false);
      await fetchMessages();
    } catch (error) {
      console.error('Error uploading voice message:', error);
      setError('Failed to upload voice message');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const uploadResponse = await chatService.uploadFile(file);

      const messageData = {
        content: newMessage.trim() || `Shared a file: ${file.name}`,
        type: 'FILE' as const,
        mediaUrl: uploadResponse.data.url,
        mediaType: file.type,
        eventId: selectedEventId || undefined
      };

      await chatService.sendMessage(messageData);
      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Event Chat</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="input text-sm"
              >
                <option value="">Global Chat</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow h-[600px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => {
              const showDate = index === 0 ||
                formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);
              const isCurrentUser = message.sender.id === user?.id;

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center text-sm text-gray-500 my-4">
                      {formatDate(message.createdAt)}
                    </div>
                  )}
                  
                  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-1' : 'order-2'}`}>
                      {!isCurrentUser && (
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          {message.sender.name}
                        </div>
                      )}
                      <MediaMessage
                        message={message}
                        isOwnMessage={isCurrentUser}
                      />
                      <div className={`mt-1 text-xs text-gray-500 ${
                        isCurrentUser ? 'text-right' : 'text-left'
                      }`}>
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
                                isCurrentUser
                                  ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                              title={reaction.users && reaction.users.length > 0 ? reaction.users.map(u => u.name).join(', ') : 'No users'}
                            >
                              <span>{reaction.emoji}</span>
                              <span className={isCurrentUser ? 'text-indigo-100' : 'text-gray-600'}>
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
                            isCurrentUser
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
                                className={`p-1 rounded transition-colors ${
                                  isCurrentUser
                                    ? 'hover:bg-indigo-500 text-white'
                                    : 'hover:bg-gray-100 text-gray-700'
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!isCurrentUser && (
                      <div className="order-1 mr-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Recorder */}
          {showVoiceRecorder && (
            <div className="p-4 border-t border-gray-200">
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecording}
                onCancel={() => setShowVoiceRecorder(false)}
                disabled={uploading}
              />
            </div>
          )}

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-end space-x-3">
              {/* Media Buttons */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading || sending}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload image"
                >
                  <PhotoIcon className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                  disabled={uploading || sending}
                  className={`p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    showVoiceRecorder
                      ? 'text-red-600 bg-red-50 hover:bg-red-100'
                      : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                  title="Record voice message"
                >
                  <MicrophoneIcon className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sending}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload file"
                >
                  <PaperClipIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Message Form */}
              <form onSubmit={handleSendMessage} className="flex-1 flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={sending || uploading}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || uploading}
                  className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
            </div>

            {/* Upload Status */}
            {uploading && (
              <div className="mt-2 text-sm text-indigo-600 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                Uploading...
              </div>
            )}

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
        </div>

        {/* Chat Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Chat Guidelines:</strong> This is a public chat for all event attendees. 
                Please keep conversations relevant to the event and be respectful to all participants.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
