'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { chatService, eventsService } from '@/lib/services';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { PaperAirplaneIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const eventId = params.id as string;

  useEffect(() => {
    const fetchEventAndMessages = async () => {
      try {
        // Fetch event details
        const eventResponse = await eventsService.getEvent(eventId);
        setEvent(eventResponse);

        // Fetch chat messages
        const messagesResponse = await chatService.getEventMessages(eventId);
        setMessages(messagesResponse.messages || []);
      } catch (error) {
        console.error('Failed to fetch event or messages:', error);
        // Create mock data for demonstration
        setEvent({
          id: eventId,
          title: 'Sample Event',
          description: 'Sample event description'
        });
        
        setMessages([
          {
            id: '1',
            content: 'Welcome to the event chat!',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            user: { id: '1', name: 'Event Organizer', email: 'organizer@test.com' }
          },
          {
            id: '2',
            content: 'Looking forward to this event!',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            user: { id: '2', name: 'John Doe', email: 'john@test.com' }
          },
          {
            id: '3',
            content: 'Same here! Should be great.',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            user: { id: '3', name: 'Jane Smith', email: 'jane@test.com' }
          }
        ]);
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
        id: response.id || Date.now().toString(),
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      // For demo purposes, still add the message locally
      const newMsg: Message = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        user: {
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
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
                className={`flex ${message.user.id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.user.id === user?.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  {message.user.id !== user?.id && (
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      {message.user.name}
                    </div>
                  )}
                  <div className="text-sm">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.user.id === user?.id ? 'text-indigo-200' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
