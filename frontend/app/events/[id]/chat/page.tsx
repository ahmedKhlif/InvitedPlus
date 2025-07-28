'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { chatService, eventsService } from '@/lib/services';
import { usePermissions } from '@/lib/hooks/usePermissions';
import api from '@/lib/api';
import { PaperAirplaneIcon, ArrowLeftIcon, PhotoIcon, MicrophoneIcon, PaperClipIcon, HeartIcon, HandThumbUpIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import MediaMessage from '@/components/chat/MediaMessage';

interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VOICE' | 'FILE';
  mediaUrl?: string;
  mediaType?: string;
  duration?: number;
  senderId: string;
  eventId?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeenAt?: string;
  };
  event?: {
    id: string;
    title: string;
  };
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

interface Event {
  id: string;
  title: string;
  description: string;
}

export default function EventChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = usePermissions();
  const [event, setEvent] = useState<Event | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [popularEmojis, setPopularEmojis] = useState<string[]>(['👍', '❤️', '😂', '😮', '😢', '😡']);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const eventId = params.id as string;

  const fetchMessages = async () => {
    try {
      const messagesResponse = await chatService.getEventMessages(eventId);
      setMessages(messagesResponse.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  useEffect(() => {
    const fetchEventAndMessages = async () => {
      try {
        // Fetch event details
        const eventResponse = await eventsService.getEvent(eventId);
        setEvent(eventResponse.event || eventResponse);

        // Fetch chat messages with reactions
        const messagesResponse = await chatService.getEventMessages(eventId);
        setMessages(messagesResponse.messages || []);
      } catch (error) {
        console.error('Failed to fetch event or messages:', error);
        // Set empty messages array if API fails
        setMessages([]);
        setEvent({
          id: eventId,
          title: 'Event Chat',
          description: 'Unable to load event details'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndMessages();
  }, [eventId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user) return;

    setSending(true);
    try {
      const messageData = {
        content: newMessage.trim(),
        eventId: eventId
      };

      const response = await chatService.sendMessage(messageData);
      
      // Add the new message to the list
      const newMsg: Message = {
        id: response.data?.id || Date.now().toString(),
        content: newMessage.trim(),
        type: response.data?.type || 'TEXT',
        mediaUrl: response.data?.mediaUrl,
        mediaType: response.data?.mediaType,
        duration: response.data?.duration,
        senderId: response.data?.senderId || user.id,
        eventId: response.data?.eventId || eventId,
        createdAt: response.data?.createdAt || new Date().toISOString(),
        updatedAt: response.data?.updatedAt || new Date().toISOString(),
        sender: response.data?.sender || {
          id: user.id,
          name: user.name,
          email: user.email
        },
        event: response.data?.event
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      // For demo purposes, still add the message locally
      const newMsg: Message = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        type: 'TEXT',
        senderId: user.id,
        eventId: eventId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } finally {
      setSending(false);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      await api.post(`/chat/messages/${messageId}/react`, { emoji });
      // Refresh messages to show updated reactions
      fetchMessages();
    } catch (error) {
      console.error('Failed to add reaction:', error);
      // Show user-friendly error message
      alert('Failed to add reaction. Please try again.');
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
        eventId: eventId
      };

      const response = await chatService.sendMessage(messageData);

      const newMsg: Message = {
        id: response.data?.id || Date.now().toString(),
        content: messageData.content,
        type: 'IMAGE',
        mediaUrl: uploadResponse.data.url,
        mediaType: file.type,
        senderId: response.data?.senderId || user.id,
        eventId: response.data?.eventId || eventId,
        createdAt: response.data?.createdAt || new Date().toISOString(),
        updatedAt: response.data?.updatedAt || new Date().toISOString(),
        sender: response.data?.sender || {
          id: user.id,
          name: user.name,
          email: user.email
        },
        event: response.data?.event
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
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
        eventId: eventId
      };

      const response = await chatService.sendMessage(messageData);

      const newMsg: Message = {
        id: response.data?.id || Date.now().toString(),
        content: messageData.content,
        type: 'VOICE',
        mediaUrl: uploadResponse.data.url,
        mediaType: 'audio/webm',
        duration: duration,
        senderId: response.data?.senderId || user.id,
        eventId: response.data?.eventId || eventId,
        createdAt: response.data?.createdAt || new Date().toISOString(),
        updatedAt: response.data?.updatedAt || new Date().toISOString(),
        sender: response.data?.sender || {
          id: user.id,
          name: user.name,
          email: user.email
        },
        event: response.data?.event
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('Error uploading voice message:', error);
      alert('Failed to upload voice message');
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
        eventId: eventId
      };

      const response = await chatService.sendMessage(messageData);

      const newMsg: Message = {
        id: response.data?.id || Date.now().toString(),
        content: messageData.content,
        type: 'FILE',
        mediaUrl: uploadResponse.data.url,
        mediaType: file.type,
        senderId: response.data?.senderId || user.id,
        eventId: response.data?.eventId || eventId,
        createdAt: response.data?.createdAt || new Date().toISOString(),
        updatedAt: response.data?.updatedAt || new Date().toISOString(),
        sender: response.data?.sender || {
          id: user.id,
          name: user.name,
          email: user.email
        },
        event: response.data?.event
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push(`/events/${eventId}`)}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{event?.title}</h1>
                <p className="text-sm text-gray-600">Event Chat • {messages.length} messages</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-col h-[calc(100vh-140px)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`group px-4 py-2 rounded-lg ${
                    message.sender.id === user?.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  {message.sender.id !== user?.id && (
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      {message.sender.name}
                    </div>
                  )}

                  {/* Message Content */}
                  <MediaMessage
                    message={message}
                    isOwnMessage={message.sender.id === user?.id}
                  />

                  {/* Timestamp */}
                  <div
                    className={`text-xs mt-1 ${
                      message.sender.id === user?.id ? 'text-indigo-200' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                    {message.sender.lastSeenAt && (
                      <span className="ml-2">• {getLastSeenText(message.sender.lastSeenAt)}</span>
                    )}
                  </div>

                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {message.reactions.map((reaction, index) => (
                        <button
                          key={index}
                          onClick={() => addReaction(message.id, reaction.emoji)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                            message.sender.id === user?.id
                              ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                          title={reaction.users && reaction.users.length > 0 ? reaction.users.map(u => u.name).join(', ') : 'No users'}
                        >
                          <span>{reaction.emoji}</span>
                          <span className={message.sender.id === user?.id ? 'text-indigo-100' : 'text-gray-600'}>
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
                        message.sender.id === user?.id
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
                              message.sender.id === user?.id
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
              </div>
            ))}
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
          <div className="bg-white border-t border-gray-200 p-4">
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

              {/* Text Input */}
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
      </div>
    </div>
  );
}
